# Recupera — Motor de Búsqueda Semántica (CLIP + pgvector) — Fase 2

Microservicio en Python/FastAPI que indexa fotos de reportes como vectores
CLIP y permite buscarlos con una descripción en texto libre ("un bolso
oscuro que se ve viejito"). Vive en la misma base de Postgres que el
backend de Node (Supabase), usando **pgvector** — no hace falta una base de
datos vectorial aparte.

## Qué cambió respecto a la fase 1

- El embedding ya **no vive en una columna dentro de `reporte`** — ahora es
  una tabla separada, `reporte_embedding`, con su propio índice **HNSW**
  (mejor que `ivfflat` para este tamaño de datos: no necesita "entrenarse"
  con datos existentes).
- La comparación vectorial la hace **una función SQL**
  (`buscar_reportes_similares`), no Python — Postgres compara los vectores
  usando el índice, y el microservicio solo le pide los IDs ya ordenados.
  Antes bajábamos todos los embeddings candidatos y comparábamos a mano.
- `/indexar` ahora hace **upsert** (`ON CONFLICT DO UPDATE`) en vez de un
  `UPDATE` simple — si la foto de un reporte cambia, reindexar no falla.
- **Soporta las dos direcciones de búsqueda**, no solo una: `tipo_reporte`
  en `/buscar` decide si comparas contra fotos de reportes `perdido` o
  `encontrado`. Antes solo indexábamos `encontrado`; ahora `/indexar` acepta
  cualquier reporte con foto, sea cual sea su tipo.

## Por qué funciona buscar con texto sobre fotos

CLIP entrena una sola red para que las imágenes y los textos que las
describen caigan **cerca en el mismo espacio vectorial** de 512
dimensiones. Por eso el mismo motor sirve tanto para convertir una foto en
vector (`embedding_de_imagen_bytes`) como una descripción en vector
(`embedding_de_texto`).

## Instalación

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # completa DATABASE_URL (conexión directa, no pgbouncer)
```

Antes de arrancar, corre `sql/pgvector-setup.sql` en el SQL Editor de
Supabase (activa pgvector, crea `reporte_embedding`, el índice HNSW y la
función `buscar_reportes_similares`).

```bash
uvicorn app.main:app --reload --port 8001
```

La primera vez que arranca descarga el modelo CLIP (~600MB) desde
Hugging Face — tarda un poco. Las siguientes veces usa la caché local.

## Endpoints

### `POST /indexar`
Genera el embedding de la foto de un reporte y lo guarda (o actualiza) en
`reporte_embedding`. Se llama **cada vez que un reporte tiene foto nueva o
cambiada** — no importa si es `perdido` o `encontrado`.

```json
{ "id_reporte": 42, "url_foto": "https://...supabase.co/storage/v1/.../foto.jpg" }
```

### `POST /buscar`
Recibe una descripción de texto y el tipo de reporte contra el que buscar,
devuelve los más parecidos ordenados por similitud.

```json
{
  "descripcion": "un bolso oscuro que se ve viejito para llevar libros",
  "tipo_reporte": "encontrado",
  "limite": 10
}
```

```json
{
  "resultados": [
    { "id_reporte": 42, "nombre_objeto": "Mochila Negra", "similitud": 78.3, ... }
  ]
}
```

`tipo_reporte` por defecto es `"perdido"` — cámbialo según el caso de uso:
- **Estudiante busca lo que perdió** → `tipo_reporte: "encontrado"` (compara
  su descripción contra fotos de objetos que alguien más encontró).
- **Encargado tiene un objeto en mano y quiere saber de quién es** →
  `tipo_reporte: "perdido"` (compara su descripción contra fotos que los
  estudiantes adjuntaron a sus propios reportes de pérdida, si las tienen).

## Cómo conectarlo con el backend de Node

En `reportes.controller.js`, después de crear **cualquier** reporte con
`urlFoto` (ya no solo `encontrado`), dispara una llamada a este servicio
(no bloqueante, para no demorar la respuesta al usuario):

```js
async function crear(req, res) {
  // ... (código actual que crea el reporte)

  if (reporte.urlFoto) {
    fetch(`${process.env.MOTOR_BUSQUEDA_URL}/indexar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_reporte: Number(reporte.idReporte), url_foto: reporte.urlFoto }),
    }).catch((err) => console.error("No se pudo indexar la foto:", err));
  }

  res.status(201).json(reporte);
}
```

Y el endpoint de "Buscar objetos" del frontend, en vez de (o además de) los
filtros normales de `GET /reportes`, puede llamar directo a `POST /buscar`
de este servicio cuando el usuario escribe una descripción libre.

## Reindexado masivo (`scripts/reindexar_todos.py`)

Para el backlog de reportes que ya tenían foto **antes** de que existiera
`reporte_embedding` — los nuevos ya se indexan solos en cuanto el backend
sube la foto, esto es solo para ponerte al día una vez:

```bash
python scripts/reindexar_todos.py                  # todos los pendientes
python scripts/reindexar_todos.py --tipo encontrado
python scripts/reindexar_todos.py --forzar          # reprocesa TODO, incluso lo ya indexado (útil si cambias de modelo)
```

No necesita que `uvicorn` esté corriendo — se conecta directo a Postgres y
usa el mismo `clip_engine.py`, como un proceso aparte. Sigue de largo si
una imagen falla (URL rota, formato corrupto) y al final te muestra un
resumen de qué reportes quedaron sin indexar para que los revises a mano.

Reemplaza al script CLI experimental (`motor_busqueda.py`, con índice local
en `.npz`) que armaron mientras probaban CLIP sin base de datos — ese ya
cumplió su función: ahora que `reporte_embedding` + pgvector viven en
Supabase, el índice persistente es la base de datos, no un archivo local.

## Notas de producción

- **CPU vs GPU**: sin GPU, cada inferencia toma ~200-500ms en un servidor
  normal — aceptable para este volumen. Con más carga conviene GPU o un
  modelo CLIP más chico.
- **HNSW vs ivfflat**: HNSW no necesita reconstruirse a medida que agregas
  datos (a diferencia de ivfflat, que idealmente se crea después de tener
  volumen). Si el índice llega a consumir demasiada memoria en un proyecto
  gratuito de Supabase, ivfflat es la alternativa más liviana.
- Este servicio **no valida el JWT de Supabase** — está pensado para que
  solo el backend de Node lo llame internamente (red privada / mismo
  servidor), no para exponerlo directo al frontend.
