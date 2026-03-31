import pymssql
from typing import Generator
from app.config import settings


def get_bi_conn() -> Generator:
    conn = pymssql.connect(
        server=settings.DB_SERVER,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.BI_DB_NAME,
        login_timeout=5,
        timeout=30,
    )
    try:
        yield conn
    finally:
        conn.close()


def rows_to_dicts(cursor) -> list[dict]:
    """Converte cursor rows em lista de dicts, normalizando tipos."""
    cols = [d[0].lower() for d in cursor.description]
    result = []
    for row in cursor.fetchall():
        d = {}
        for col, val in zip(cols, row):
            if val is None:
                d[col] = None
            elif hasattr(val, 'year'):  # date / datetime
                d[col] = val.strftime('%Y-%m-%d')
            elif type(val).__name__ == 'Decimal':
                d[col] = float(val)
            else:
                d[col] = val
        result.append(d)
    return result
