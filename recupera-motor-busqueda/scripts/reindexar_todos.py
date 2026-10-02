"""
Reindexado masivo — para ponerte al día con reportes que ya tenían foto
ANTES de que existiera reporte_embedding. Corre esto una sola vez (o cada
vez que quieras rellenar huecos); los reportes nuevos ya se indexan solos
en cuanto el backend de Node sube su foto (ver subirFoto() en el backend).

Uso:
    python scripts/reindexar_todos.py
    python scripts/reindexar_todos.py --tipo encontrado
    python scripts/reindexar_todos.py --forzar   # reprocesa TODO, incluso lo ya indexado

No necesita que el microservicio (uvicorn) esté corriendo — se conecta
directo a Postgres y usa el mismo motor CLIP, como un proceso aparte.
"""
import argparse
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))  # para importar app.*
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

from app.clip_engine import MODEL_NAME, MotorEmbeddingsCLIP  # noqa: E402
from app.database import obtener_conexion  # noqa: E402


def reportes_pendientes(tipo: str, forzar: bool) -> list[tuple[int, str]]:
    """Reportes con foto que aún no están indexados (o cuya foto cambió).
    Con --forzar, devuelve TODOS los que tengan foto, indexados o no."""
    condicion_tipo = "AND r.tipo = %(tipo)s" if tipo != "todos" else ""
    condicion_pendiente = (
        ""
        if forzar
        else """
        AND NOT EXISTS (
            SELECT 1 FROM reporte_embedding re
            WHERE re.id_reporte = r.id_reporte
              AND re.url_foto_procesada = r.url_foto
        )
        """
    )
    consulta = f"""
        SELECT r.id_reporte, r.url_foto
        FROM reporte r
        WHERE r.url_foto IS NOT NULL
          AND r.estado <> 'retirado'
          {condicion_tipo}
          {condicion_pendiente}
        ORDER BY r.id_reporte
    """
    with obtener_conexion() as conexion, conexion.cursor() as cursor:
        cursor.execute(consulta, {"tipo": tipo})
        return cursor.fetchall()


def indexar_uno(motor: MotorEmbeddingsCLIP, id_reporte: int, url_foto: str) -> None:
    respuesta = httpx.get(url_foto, timeout=15, follow_redirects=True)
    respuesta.raise_for_status()
    vector = motor.embedding_de_imagen_bytes(respuesta.content)

    with obtener_conexion() as conexion, conexion.cursor() as cursor:
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
            {"id": id_reporte, "modelo": MODEL_NAME, "v": vector.tolist(), "url": url_foto},
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="Reindexado masivo de fotos de reportes")
    parser.add_argument("--tipo", choices=["perdido", "encontrado", "todos"], default="todos")
    parser.add_argument("--forzar", action="store_true", help="Reprocesa incluso lo ya indexado")
    argumentos = parser.parse_args()

    pendientes = reportes_pendientes(argumentos.tipo, argumentos.forzar)
    if not pendientes:
        print("No hay reportes pendientes de indexar. Ya estás al día.")
        return

    print(f"Cargando el modelo CLIP... ({MODEL_NAME})")
    motor = MotorEmbeddingsCLIP()

    print(f"{len(pendientes)} reporte(s) por indexar.\n")
    exitosos, fallidos = 0, []
    for id_reporte, url_foto in pendientes:
        try:
            indexar_uno(motor, id_reporte, url_foto)
            print(f"  ✓ reporte {id_reporte}")
            exitosos += 1
        except Exception as error:  # noqa: BLE001 — queremos seguir con los demás aunque uno falle
            print(f"  ✗ reporte {id_reporte}: {error}")
            fallidos.append((id_reporte, str(error)))

    print(f"\nListo: {exitosos} indexado(s), {len(fallidos)} con error.")
    if fallidos:
        print("Revisa manualmente (probablemente URLs rotas o imágenes corruptas):")
        for id_reporte, motivo in fallidos:
            print(f"  - reporte {id_reporte}: {motivo}")


if __name__ == "__main__":
    main()
