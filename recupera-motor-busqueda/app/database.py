import os
from contextlib import contextmanager

from dotenv import load_dotenv
from psycopg2.pool import SimpleConnectionPool

load_dotenv()

# Usa la misma DIRECT_URL de Supabase que ya tiene el backend de Node
# (Postgres puro, no necesita pasar por el pooler de pgbouncer para esto).
DATABASE_URL = os.environ["DIRECT_URL"]

_pool = SimpleConnectionPool(minconn=1, maxconn=5, dsn=DATABASE_URL)


@contextmanager
def obtener_conexion():
    conexion = _pool.getconn()
    try:
        yield conexion
        conexion.commit()
    except Exception:
        conexion.rollback()
        raise
    finally:
        _pool.putconn(conexion)
