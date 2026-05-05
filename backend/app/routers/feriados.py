from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, extract, select
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user, require_roles

router = APIRouter(prefix="/feriados", tags=["feriados"])


@router.get("", response_model=list[schemas.FeriadoOut])
def list_feriados(
    ano: int | None = Query(None),
    mes: int | None = Query(None, ge=1, le=12),
    somente_ativos: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    filters = []

    if somente_ativos:
        filters.append(models.Feriado.is_active == True)

    if ano:
        filters.append(extract("year", models.Feriado.data_feriado) == ano)

    if mes:
        filters.append(extract("month", models.Feriado.data_feriado) == mes)

    stmt = select(models.Feriado)

    if filters:
        stmt = stmt.where(and_(*filters))

    stmt = stmt.order_by(models.Feriado.data_feriado.asc())

    feriados = db.execute(stmt).scalars().all()
    return feriados


@router.post("", response_model=schemas.FeriadoOut, status_code=status.HTTP_201_CREATED)
def create_feriado(
    data: schemas.FeriadoCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN", "PCP")),
):
    existing = db.execute(
        select(models.Feriado).where(
            models.Feriado.data_feriado == data.data_feriado
        )
    ).scalar_one_or_none()

    if existing:
        if existing.is_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um feriado cadastrado para esta data.",
            )

        existing.descricao = data.descricao
        existing.tipo = data.tipo
        existing.is_active = True
        existing.updated_at = datetime.now()
        existing.updated_by = current_user.username

        db.commit()
        db.refresh(existing)
        return existing

    feriado = models.Feriado(
        data_feriado=data.data_feriado,
        descricao=data.descricao,
        tipo=data.tipo,
        is_active=True,
        created_by=current_user.username,
    )

    db.add(feriado)
    db.commit()
    db.refresh(feriado)

    return feriado


@router.put("/{feriado_id}", response_model=schemas.FeriadoOut)
def update_feriado(
    feriado_id: int,
    data: schemas.FeriadoUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN", "PCP")),
):
    feriado = db.get(models.Feriado, feriado_id)

    if not feriado:
        raise HTTPException(status_code=404, detail="Feriado não encontrado.")

    payload = data.model_dump(exclude_none=True)

    if "data_feriado" in payload:
        existing = db.execute(
            select(models.Feriado).where(
                and_(
                    models.Feriado.data_feriado == payload["data_feriado"],
                    models.Feriado.id != feriado_id,
                )
            )
        ).scalar_one_or_none()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe outro feriado cadastrado para esta data.",
            )

    for field, value in payload.items():
        setattr(feriado, field, value)

    feriado.updated_at = datetime.now()
    feriado.updated_by = current_user.username

    db.commit()
    db.refresh(feriado)

    return feriado


@router.patch("/{feriado_id}/inactive", response_model=schemas.FeriadoOut)
def deactivate_feriado(
    feriado_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN", "PCP")),
):
    feriado = db.get(models.Feriado, feriado_id)

    if not feriado:
        raise HTTPException(status_code=404, detail="Feriado não encontrado.")

    feriado.is_active = False
    feriado.updated_at = datetime.now()
    feriado.updated_by = current_user.username

    db.commit()
    db.refresh(feriado)

    return feriado


@router.patch("/{feriado_id}/active", response_model=schemas.FeriadoOut)
def activate_feriado(
    feriado_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN", "PCP")),
):
    feriado = db.get(models.Feriado, feriado_id)

    if not feriado:
        raise HTTPException(status_code=404, detail="Feriado não encontrado.")

    feriado.is_active = True
    feriado.updated_at = datetime.now()
    feriado.updated_by = current_user.username

    db.commit()
    db.refresh(feriado)

    return feriado