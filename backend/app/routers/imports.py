import io
import csv
import json
import math
import unicodedata
from datetime import date
from fastapi import (
    APIRouter, Depends, HTTPException, UploadFile, File, Form, Query,
)
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, text
from app.database import get_db
from app.deps import get_current_user, require_roles
from app import models, schemas

router = APIRouter(prefix="/imports", tags=["imports"])

IMPORT_SKIP = 1
IMPORT_UPDATE = 2
IMPORT_FORCE = 3

_ACTIVE = models.ZpmRecord.deleted == " "


def _next_recno(db: Session) -> int:
    result = db.execute(
        text("SELECT ISNULL(MAX(R_E_C_N_O_), 0) + 1 FROM ZPM010")
    )
    return result.scalar() or 1


def _today_str() -> str:
    return date.today().strftime("%Y%m%d")


# ---------------------------------------------------------------------------
# Mapeamento de nomes de colunas do CSV real → nomes internos
# Inclui variações com/sem acento e com/sem espaços
# ---------------------------------------------------------------------------
_COL_MAP: dict[str, str] = {
    # Produto
    "CODIGO": "PRODUTO",
    "CÓDIGO": "PRODUTO",
    "COD": "PRODUTO",
    "PRODUTO": "PRODUTO",
    # Linha
    "LINHA DE PRODUCAO": "LINHA",
    "LINHA DE PRODUÇÃO": "LINHA",
    "LINHA": "LINHA",
    # Descrição
    "DESCRICAO": "DESCRICAO",
    "DESCRIÇÃO": "DESCRICAO",
    "DESC": "DESCRICAO",
    # PMP Mês
    "PMP DO MES": "PMPMES",
    "PMP DO MÊS": "PMPMES",
    "PMPMES": "PMPMES",
    # Total programado (recalculamos, mas aceitamos a coluna)
    "TOTAL PROGRAMADO": "TOTPG",
    "TOTPG": "TOTPG",
}


def _strip_accents(text: str) -> str:
    """Remove acentos para comparação normalizada."""
    return "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    )


def _normalize_col(raw: str) -> str:
    """Normaliza um nome de coluna do CSV para o nome interno.

    - Tenta match direto no mapa (com e sem acento)
    - Detecta colunas de dia: "1".."31", "01".."31", "D1".."D31", "D01".."D31"
    - Retorna o nome em maiúsculo se não encontrar mapeamento
    """
    cleaned = raw.strip()
    upper = cleaned.upper()
    no_accent = _strip_accents(upper)

    if upper in _COL_MAP:
        return _COL_MAP[upper]
    if no_accent in _COL_MAP:
        return _COL_MAP[no_accent]

    # Tenta detectar coluna de dia
    candidate = upper
    if candidate.startswith("D") and candidate[1:].isdigit():
        candidate = candidate[1:]  # Remove prefixo D
    if candidate.isdigit():
        n = int(candidate)
        if 1 <= n <= 31:
            return f"D{n:02d}"

    return upper


def _normalize_headers(fieldnames) -> list[str]:
    return [_normalize_col(h) for h in fieldnames]


def _normalize_row(raw_row: dict, fieldnames) -> dict:
    """Reconstrói a linha usando nomes normalizados."""
    row = {}
    for orig_key, val in raw_row.items():
        if orig_key is None:
            continue
        row[_normalize_col(orig_key)] = val
    return row


def _parse_float(value: str) -> float:
    if not value or not value.strip():
        return 0.0
    cleaned = value.strip().replace(",", ".")
    try:
        return max(0.0, float(cleaned))
    except ValueError:
        return 0.0


def _calc_totpg(day_data: dict) -> float:
    return sum(day_data.get(f"d{i:02d}", 0.0) for i in range(1, 32))


def _pad_filial(val: str) -> str:
    """Protheus armazena FILIAL como CHAR(2) com PadR.
    '1' -> '1 ' para bater com o índice da tabela ZPM010.
    """
    stripped = val.strip()
    return stripped.ljust(2)


# ---------------------------------------------------------------------------
# Endpoint de importação CSV
# ---------------------------------------------------------------------------
@router.post("/csv", response_model=schemas.ImportLogOut)
def import_csv(
    file: UploadFile = File(...),
    mesref: str = Form(...),
    mode: int = Form(1),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN", "PCP")),
):
    mesref = mesref.strip()
    if len(mesref) != 6 or not mesref.isdigit():
        raise HTTPException(
            status_code=400,
            detail="Mês referência inválido (formato: AAAAMM)",
        )
    if mode not in (IMPORT_SKIP, IMPORT_UPDATE, IMPORT_FORCE):
        raise HTTPException(
            status_code=400,
            detail="Modo inválido (1=SKIP, 2=UPDATE, 3=FORCE)",
        )

    content = file.file.read()
    for encoding in ("utf-8-sig", "latin-1", "cp1252"):
        try:
            text = content.decode(encoding)
            break
        except (UnicodeDecodeError, LookupError):
            continue
    else:
        raise HTTPException(
            status_code=400,
            detail="Não foi possível decodificar o arquivo CSV",
        )

    reader = csv.DictReader(io.StringIO(text), delimiter=";")
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV sem cabeçalho")

    norm_headers = _normalize_headers(reader.fieldnames)

    # Valida presença das colunas obrigatórias após normalização
    required = {"FILIAL", "PRODUTO"}
    missing = required - set(norm_headers)
    if missing:
        # Dica amigável com os nomes originais
        raise HTTPException(
            status_code=400,
            detail=(
                f"CSV sem colunas obrigatórias: {', '.join(missing)}. "
                f"Colunas encontradas (normalizadas): "
                f"{', '.join(norm_headers[:10])}..."
            ),
        )

    total = ok_count = skip_count = error_count = 0
    details = []
    next_recno = _next_recno(db)

    for row_num, raw_row in enumerate(list(reader), start=2):
        row = _normalize_row(raw_row, reader.fieldnames)
        total += 1

        filial_val = _pad_filial(row.get("FILIAL", ""))
        prod_val = row.get("PRODUTO", "").strip()
        desc_val = row.get("DESCRICAO", "").strip()
        linha_val = row.get("LINHA", "").strip()

        if not filial_val.strip() or not prod_val:
            error_count += 1
            details.append(schemas.ImportDetailItem(
                row=row_num,
                prod=prod_val or "(vazio)",
                desc=desc_val,
                status="error",
                message="FILIAL ou PRODUTO vazio",
            ))
            continue

        # Parse quantidades diárias D01..D31
        day_data: dict[str, float] = {}
        parse_error = None
        for i in range(1, 32):
            col_key = f"D{i:02d}"
            raw_val = row.get(col_key, "0")
            try:
                day_data[f"d{i:02d}"] = _parse_float(raw_val)
            except Exception:
                parse_error = f"Valor inválido na coluna {col_key}: '{raw_val}'"
                break

        if parse_error:
            error_count += 1
            details.append(schemas.ImportDetailItem(
                row=row_num, prod=prod_val, desc=desc_val,
                status="error", message=parse_error,
            ))
            continue

        pmpmes_val = _parse_float(row.get("PMPMES", "0"))
        totpg_val = _calc_totpg(day_data)

        # Verifica registro existente
        existing = db.execute(
            select(models.ZpmRecord).where(
                and_(
                    _ACTIVE,
                    models.ZpmRecord.filial == filial_val,
                    models.ZpmRecord.prod == prod_val,
                    models.ZpmRecord.mesref == mesref,
                )
            )
        ).scalar_one_or_none()

        if existing:
            if mode == IMPORT_SKIP:
                skip_count += 1
                details.append(schemas.ImportDetailItem(
                    row=row_num, prod=prod_val, desc=desc_val,
                    status="skip", message="Registro já existe (modo SKIP)",
                ))
                continue
            if mode == IMPORT_UPDATE and existing.origem != "I":
                skip_count += 1
                details.append(schemas.ImportDetailItem(
                    row=row_num, prod=prod_val, desc=desc_val,
                    status="skip",
                    message="Registro manual preservado (modo UPDATE)",
                ))
                continue
            # UPDATE ou FORCE: atualiza registro existente
            existing.linha = linha_val
            existing.desc = desc_val
            existing.pmpmes = pmpmes_val
            for k, v in day_data.items():
                setattr(existing, k, v)
            existing.totpg = totpg_val
            existing.dtimpt = _today_str()
            existing.usrimpt = current_user.username[:15]
            existing.origem = "I"
            ok_count += 1
            details.append(schemas.ImportDetailItem(
                row=row_num, prod=prod_val, desc=desc_val,
                status="ok", message="Atualizado",
            ))
        else:
            new_record = models.ZpmRecord(
                recno=next_recno,
                recdel=0,
                deleted=" ",
                filial=filial_val,
                prod=prod_val,
                mesref=mesref,
                linha=linha_val,
                desc=desc_val,
                pmpmes=pmpmes_val,
                totpg=totpg_val,
                dtimpt=_today_str(),
                usrimpt=current_user.username[:15],
                origem="I",
                **day_data,
            )
            db.add(new_record)
            next_recno += 1
            ok_count += 1
            details.append(schemas.ImportDetailItem(
                row=row_num, prod=prod_val, desc=desc_val,
                status="ok", message="Inserido",
            ))

    db.commit()

    log = models.ImportLog(
        mesref=mesref,
        filename=file.filename or "arquivo.csv",
        mode=mode,
        total=total,
        ok=ok_count,
        skip=skip_count,
        error=error_count,
        username=current_user.username,
        details=json.dumps(
            [d.model_dump() for d in details], ensure_ascii=False
        ),
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return schemas.ImportLogOut(
        id=log.id,
        mesref=log.mesref,
        filename=log.filename,
        mode=log.mode,
        total=log.total,
        ok=log.ok,
        skip=log.skip,
        error=log.error,
        created_at=log.created_at,
        username=log.username,
        details=details,
    )


# ---------------------------------------------------------------------------
# Listagem e detalhe de logs
# ---------------------------------------------------------------------------
@router.get(
    "/logs",
    response_model=schemas.PaginatedResponse[schemas.ImportLogOut],
)
def list_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN", "PCP")),
):
    total = db.execute(
        select(func.count()).select_from(models.ImportLog)
    ).scalar() or 0

    logs = db.execute(
        select(models.ImportLog)
        .order_by(models.ImportLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()

    items = [
        schemas.ImportLogOut(
            id=log.id,
            mesref=log.mesref,
            filename=log.filename,
            mode=log.mode,
            total=log.total,
            ok=log.ok,
            skip=log.skip,
            error=log.error,
            created_at=log.created_at,
            username=log.username,
            details=None,
        )
        for log in logs
    ]

    return schemas.PaginatedResponse[schemas.ImportLogOut](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, math.ceil(total / page_size)),
    )


@router.get("/logs/{log_id}", response_model=schemas.ImportLogOut)
def get_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN", "PCP")),
):
    log = db.execute(
        select(models.ImportLog).where(models.ImportLog.id == log_id)
    ).scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Log não encontrado")

    details = None
    if log.details:
        try:
            raw = json.loads(log.details)
            details = [schemas.ImportDetailItem(**d) for d in raw]
        except Exception:
            details = None

    return schemas.ImportLogOut(
        id=log.id,
        mesref=log.mesref,
        filename=log.filename,
        mode=log.mode,
        total=log.total,
        ok=log.ok,
        skip=log.skip,
        error=log.error,
        created_at=log.created_at,
        username=log.username,
        details=details,
    )
