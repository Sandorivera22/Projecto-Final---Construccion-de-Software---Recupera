"""
Microservicio de búsqueda semántica para Recupera — Fase 2 (pgvector real).

Flujo pensado (parametrizado por `tipo`, soporta las dos direcciones):
  1. Alguien reporta un objeto con foto en el backend de Node (puede ser
     'encontrado' o 'perdido' — ambos casos son válidos, ver README).
     El backend sube la foto a Supabase Storage y guarda la URL en
     reporte.url_foto (esto ya existe).
  2. El backend de Node llama a POST /indexar aquí, pasando id_reporte y
     url_foto. Este servicio descarga la imagen, genera el embedding CLIP
     y lo guarda en reporte_embedding (tabla separada, no en `reporte`).
  3. Alguien busca con una descripción de texto ("un bolso oscuro que se ve
     viejito"). El frontend llama a POST /buscar, indicando contra qué tipo
     de reporte comparar (`tipo_reporte`). Generamos el embedding del texto
     y llamamos a la función SQL buscar_reportes_similares(), que hace la
     comparación vectorial DENTRO de Postgres (con el índice HNSW) — nunca
     bajamos todos los embeddings a Python para compararlos a mano.

Correr con: uvicorn app.main:app --host 0.0.0.0 --port 8001
"""
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from app.clip_engine import MODEL_NAME, MotorEmbeddingsCLIP
from app.database import obtener_conexion

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

app = FastAPI(title="Recupera - Motor de Búsqueda Semántica")

motor: MotorEmbeddingsCLIP | None = None


@app.on_event("startup")
def cargar_modelo():
    # Se carga UNA vez cuando arranca el proceso, no en cada request.
    global motor
    motor = MotorEmbeddingsCLIP()


# --- Esquemas de entrada/salida -------------------------------------------


class IndexarRequest(BaseModel):
    id_reporte: int
    url_foto: str


class BuscarRequest(BaseModel):
    descripcion: str = Field(min_length=3, max_length=500)
    tipo_reporte: str = Field(
        default="perdido",
        pattern="^(perdido|encontrado)$",
        description="Contra qué tipo de reporte comparar la descripción.",
    )
    limite: int = Field(default=10, ge=1, le=50)
    umbral_minimo: float = Field(
        default=15.0, ge=0, le=100, description="% mínimo de similitud a devolver"
    )


# --- Endpoints ---------------------------------------------------------


@app.get("/salud")
def salud():
    return {"ok": True, "modelo_cargado": motor is not None}


@app.post("/indexar")
async def indexar(datos: IndexarRequest):
    """Genera el embedding de la foto de un reporte y lo guarda/actualiza
    en reporte_embedding (upsert: si ya existía, lo reemplaza)."""
    async with httpx.AsyncClient(timeout=15) as cliente:
        respuesta = await cliente.get(datos.url_foto)
    if respuesta.status_code != 200:
        raise HTTPException(400, f"No se pudo descargar la imagen ({respuesta.status_code})")

    vector = motor.embedding_de_imagen_bytes(respuesta.content)

    with obtener_conexion() as conexion, conexion.cursor() as cursor:
        # Primero confirmamos que el reporte existe (si no, el INSERT de
        # abajo fallaría por la FK, pero con un error menos claro).
        cursor.execute("SELECT 1 FROM reporte WHERE id_reporte = %s", (datos.id_reporte,))
        if cursor.fetchone() is None:
            raise HTTPException(404, "id_reporte no existe")

        cursor.execute(
            """
            INSERT INTO reporte_embedding (id_reporte, modelo, embedding, url_foto_procesada, actualizado_en)
            VALUES (%(id)s, %(modelo)s, %(v)s::vector, %(url)s, NOW())
            ON CONFLICT (id_reporte) DO UPDATE SET
                modelo = EXCLUDED.modelo,
                embedding = EXCLUDED.embedding,
                url_foto_procesada = EXCLUDED.url_foto_procesada,
                actualizado_en = NOW()
            """,
            {
                "id": datos.id_reporte,
                "modelo": MODEL_NAME,
                "v": vector.tolist(),
                "url": datos.url_foto,
            },
        )

    return {"ok": True, "id_reporte": datos.id_reporte}


@app.post("/buscar")
def buscar(datos: BuscarRequest):
    """Busca reportes de `tipo_reporte` cuya foto se parece a la descripción.
    La comparación vectorial la hace Postgres (función buscar_reportes_similares
    + índice HNSW) — aquí solo generamos el embedding del texto y pedimos los
    campos legibles (nombre, lugar, etc.) de los ids que devolvió la función."""
    vector_texto = motor.embedding_de_texto(datos.descripcion)

    with obtener_conexion() as conexion, conexion.cursor() as cursor:
        cursor.execute(
            "SELECT id_reporte, distancia FROM buscar_reportes_similares(%s::vector, %s, %s)",
            (vector_texto.tolist(), datos.limite, datos.tipo_reporte),
        )
        candidatos = cursor.fetchall()  # [(id_reporte, distancia), ...]

        if not candidatos:
            return {"resultados": []}

        ids = [fila[0] for fila in candidatos]
        distancia_por_id = {fila[0]: fila[1] for fila in candidatos}

        cursor.execute(
            """
            SELECT id_reporte, nombre_objeto, descripcion_objeto, lugar_campus, url_foto
            FROM reporte
            WHERE id_reporte = ANY(%s)
            """,
            (ids,),
        )
        columnas = [c.name for c in cursor.description]
        reportes_por_id = {fila[0]: dict(zip(columnas, fila)) for fila in cursor.fetchall()}

    resultados = []
    for id_reporte in ids:  # mantiene el orden de similitud que ya trae la función SQL
        distancia = distancia_por_id[id_reporte]
        similitud = round((1 - distancia) * 100, 2)
        if similitud < datos.umbral_minimo:
            continue
        resultados.append({**reportes_por_id[id_reporte], "similitud": similitud})

    return {"resultados": resultados}
