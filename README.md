# Recupera — Backend

Backend para "Recupera", sistema de objetos perdidos y encontrados del campus
INTEC. Node.js + Express + Prisma, sobre PostgreSQL en Supabase, con
autenticación vía Supabase Auth.

## ⚠️ Antes de instalar: ajuste necesario en la base de datos

Tu `schema.sql` original definía `usuario.id_usuario` como `BIGINT` con una
columna `password` propia. Como decidimos usar **Supabase Auth**, las
credenciales viven en `auth.users` (tabla interna de Supabase) y
`public.usuario` pasa a ser solo el *perfil* del usuario, con
`id_usuario UUID` igual a `auth.users.id`.

**Corre `prisma/supabase-auth-adjustments.sql` en el SQL Editor de Supabase**
después de tu `schema.sql` original (o en su lugar, si vas a recrear la BD
desde cero). Ese script:

1. Recrea `usuario` con `id_usuario UUID REFERENCES auth.users(id)` y sin
   columna `password`.
2. Crea un trigger (`handle_new_user`) que, al registrarse alguien vía
   `supabase.auth.signUp()` desde el frontend, crea automáticamente su fila
   en `public.usuario` con rol `estudiante` por defecto.

Si prefieres seguir con auth propio (JWT manual) en vez de Supabase Auth,
dímelo y ajusto el schema de Prisma y el middleware de autenticación de
vuelta al `id_usuario BIGINT` + `password` original.

## Instalación

```bash
npm install
cp .env.example .env   # completa con tus credenciales de Supabase
npx prisma generate
npx prisma migrate dev --name init   # o `prisma db pull` si la BD ya existe
npm run dev
```

> Nota: en el sandbox donde generé este proyecto no pude ejecutar
> `npx prisma generate` porque el entorno bloquea la descarga del motor de
> Prisma (`binaries.prisma.sh`). Revisé el `schema.prisma` a mano, pero
> corre `npx prisma generate` en tu máquina/CI antes de arrancar el server
> para confirmar que todo compila.

### Variables de entorno necesarias

Ver `.env.example`. Las sacas del dashboard de Supabase:
- `DATABASE_URL` / `DIRECT_URL`: Project Settings → Database → Connection string
  (usa el modo *Transaction* con `pgbouncer=true` para `DATABASE_URL`, y el
  modo *Session*/directo para `DIRECT_URL`, que Prisma Migrate necesita).
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`:
  Project Settings → API.

## Cómo funciona la autenticación

1. El **frontend** usa `supabase-js` directamente contra Supabase Auth
   (`signUp`, `signInWithPassword`, etc.) — el backend no participa en login.
2. Tras autenticarse, el frontend manda el `access_token` de la sesión en
   cada request: `Authorization: Bearer <token>`.
3. El backend (`src/middleware/auth.js`) valida ese token contra Supabase
   (`supabaseAdmin.auth.getUser(token)`) y carga el perfil correspondiente de
   `public.usuario` (con su rol) en `req.usuario`.
4. `requireRole('encargado', 'admin')` restringe rutas según el rol.

## Estructura del proyecto

```
prisma/
  schema.prisma                    # modelos, 1:1 con schema.sql (usuario ajustado)
  supabase-auth-adjustments.sql    # SQL a correr en Supabase (ver arriba)
src/
  app.js / server.js               # setup de Express y arranque
  lib/prisma.js                    # cliente Prisma singleton
  lib/supabase.js                  # cliente Supabase (service role)
  middleware/auth.js               # requireAuth, requireRole
  middleware/errorHandler.js       # manejo centralizado de errores
  schemas/                         # validación de entrada (zod) por recurso
  controllers/                     # lógica de cada recurso
  routes/                          # definición de endpoints Express
  utils/AppError.js                # errores de negocio con status code
  utils/bigintSerializer.js        # permite serializar BigInt (ids) a JSON
```

## Endpoints

Todos bajo el prefijo `/api`. Todos requieren `Authorization: Bearer <token>`
salvo donde se indique.

### Usuarios (`/usuarios`)
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/me` | autenticado | Perfil propio |
| PATCH | `/me` | autenticado | Editar mi perfil (nombre, teléfono, matrícula) |
| GET | `/` | admin | Listar todos los usuarios |
| GET | `/:id` | admin | Ver un usuario |
| PATCH | `/:id/rol` | admin | Cambiar rol de un usuario |
| PATCH | `/:id/estado` | admin | Habilitar/inhabilitar un usuario |

### Categorías (`/categorias`)
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/` | autenticado | Listar categorías activas |
| POST | `/` | admin | Crear categoría |
| PATCH | `/:id` | admin | Editar categoría |

### Reportes (`/reportes`)
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/` | autenticado | Buscar/listar reportes (filtros: `tipo`, `idCategoriaObjeto`, `estado`, `busqueda`, paginación) |
| GET | `/mios` | autenticado | Mis reportes |
| GET | `/:id` | autenticado | Detalle de un reporte |
| POST | `/` | autenticado | Crear reporte (perdido o encontrado) |
| PATCH | `/:id` | dueño / encargado / admin | Editar reporte (solo staff puede cambiar `estado`) |
| POST | `/:id/retirar` | dueño / encargado / admin | Retirar un reporte |

### Reclamaciones (`/reclamaciones`)
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/` | autenticado | Reclamar un objeto encontrado (no puedes reclamar tu propio reporte) |
| GET | `/mias` | autenticado | Mis reclamaciones |
| GET | `/` | encargado / admin | Cola de reclamaciones (filtro por `estado`) |
| GET | `/:id` | dueño de la reclamación / dueño del reporte / staff | Detalle |
| POST | `/:id/evaluacion` | encargado / admin | Aprobar, rechazar o completar una reclamación |
| GET | `/:idReclamacion/mensajes` | parte de la reclamación / staff | Historial del chat |
| POST | `/:idReclamacion/mensajes` | parte de la reclamación / staff | Enviar mensaje |

## Reglas de negocio ya implementadas

- No puedes reclamar tu propio reporte.
- Un reporte `activo` pasa a `en_proceso` automáticamente al recibir su
  primera reclamación; vuelve a `activo` si esa reclamación se rechaza.
- Al marcar una reclamación como `completada`, el reporte pasa a `resuelto`.
- El chat de una reclamación se cierra (no se pueden mandar más mensajes)
  cuando la reclamación queda `rechazada` o `completada`.
- Un usuario solo puede tener una reclamación activa (`pendiente`,
  `en_revision` o `aprobada`) por reporte — lo garantiza el índice único
  `uq_reclamo_activo_usuario` de tu `schema.sql`.

## Pendiente / fuera de este alcance

- **Coincidencias automáticas** (pantalla "Coincidencias Detectadas"):
  quedó fuera a propósito para esta primera entrega. Cuando quieras
  encararlo, lo natural es un job (cron o trigger) que compare reportes
  `perdido` vs `encontrado` por categoría + cercanía de fecha + similitud de
  texto (`pg_trgm` es buena opción en Postgres) y guarde los resultados en
  una tabla nueva `coincidencia`.
- **Subida de fotos/evidencias**: el backend espera que el frontend suba el
  archivo directamente a Supabase Storage (con `supabase-js`) y mande la URL
  resultante en `urlFoto` / como parte de `pruebasPropiedad`. Si prefieres
  que el backend reciba el archivo (multipart) y lo suba él mismo, lo
  agregamos con `multer` + `supabaseAdmin.storage`.
- Notificaciones (la campanita del dashboard).
