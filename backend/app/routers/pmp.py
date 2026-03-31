import math
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_, and_, text
from app.database import get_db
from app.deps import get_current_user, require_roles
from app import models, schemas

router = APIRouter(prefix="/pmp", tags=["pmp"])

# Filtro Protheus: D_E_L_E_T_ = ' ' → registro ativo
_ACTIVE = models.ZpmRecord.deleted == " "


def _next_recno(db: Session) -> int:
    """Retorna MAX(R_E_C_N_O_) + 1 para novos registros na ZPM010."""
    result = db.execute(
        text("SELECT ISNULL(MAX(R_E_C_N_O_), 0) + 1 FROM ZPM010")
    )
    return result.scalar() or 1


def _today_str() -> str:
    """Data atual no formato Protheus varchar(8): AAAAMMDD."""
    return date.today().strftime("%Y%m%d")


def _apply_totpg(record: models.ZpmRecord) -> None:
    record.totpg = record.calc_totpg()


@router.get("", response_model=schemas.PaginatedResponse[schemas.ZpmOut])
def list_pmp(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=1000),
    filial: str | None = Query(None),
    mesref: str | None = Query(None),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    filters = [_ACTIVE]
    if filial:
        filters.append(models.ZpmRecord.filial == filial)
    if mesref:
        filters.append(models.ZpmRecord.mesref == mesref)
    if search:
        pattern = f"%{search}%"
        filters.append(or_(
            models.ZpmRecord.prod.ilike(pattern),
            models.ZpmRecord.desc.ilike(pattern),
            models.ZpmRecord.linha.ilike(pattern),
        ))

    where_clause = and_(*filters)

    total = db.execute(
        select(func.count())
        .select_from(models.ZpmRecord)
        .where(where_clause)
    ).scalar() or 0

    records = db.execute(
        select(models.ZpmRecord)
        .where(where_clause)
        .order_by(models.ZpmRecord.mesref.desc(), models.ZpmRecord.prod)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()

    return schemas.PaginatedResponse[schemas.ZpmOut](
        items=[schemas.ZpmOut.model_validate(r) for r in records],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, math.ceil(total / page_size)),
    )


@router.get("/{record_id}", response_model=schemas.ZpmOut)
def get_pmp(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    record = db.execute(
        select(models.ZpmRecord).where(
            and_(_ACTIVE, models.ZpmRecord.recno == record_id)
        )
    ).scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    return record


@router.post("", response_model=schemas.ZpmOut, status_code=status.HTTP_201_CREATED)
def create_pmp(
    data: schemas.ZpmCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN", "PCP")),
):
    existing = db.execute(
        select(models.ZpmRecord).where(
            and_(
                _ACTIVE,
                models.ZpmRecord.filial == data.filial,
                models.ZpmRecord.prod == data.prod,
                models.ZpmRecord.mesref == data.mesref,
            )
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Registro já existe para produto '{data.prod}'"
                f" no mês '{data.mesref}'"
            ),
        )

    record = models.ZpmRecord(
        recno=_next_recno(db),
        recdel=0,
        deleted=" ",
        origem="M",
        dtimpt=_today_str(),
        usrimpt=current_user.username[:15],
        **data.model_dump(),
    )
    _apply_totpg(record)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/{record_id}", response_model=schemas.ZpmOut)
def update_pmp(
    record_id: int,
    data: schemas.ZpmUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN", "PCP")),
):
    record = db.execute(
        select(models.ZpmRecord).where(
            and_(_ACTIVE, models.ZpmRecord.recno == record_id)
        )
    ).scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Registro não encontrado")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(record, field, value)

    record.origem = "M"
    record.dtimpt = _today_str()
    record.usrimpt = current_user.username[:15]
    _apply_totpg(record)

    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pmp(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN", "PCP")),
):
    record = db.execute(
        select(models.ZpmRecord).where(
            and_(_ACTIVE, models.ZpmRecord.recno == record_id)
        )
    ).scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Registro não encontrado")

    # Soft-delete Protheus: D_E_L_E_T_ = '*'
    record.deleted = "*"
    db.commit()
