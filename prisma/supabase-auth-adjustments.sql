-- =============================================================================
-- AJUSTES A schema.sql PARA USAR SUPABASE AUTH
-- =============================================================================
-- Tu schema.sql original define `usuario.id_usuario` como BIGINT IDENTITY y
-- una columna `password`. Eso funciona si tú manejas el login manualmente,
-- pero como vamos con Supabase Auth, el usuario "real" (credenciales, hash de
-- password, confirmación de correo, recuperación de contraseña) vive en la
-- tabla interna `auth.users`, que Supabase administra por ti.
--
-- Patrón estándar de Supabase: la tabla `public.usuario` pasa a ser el
-- "perfil" de ese usuario, y su id_usuario DEBE ser el mismo UUID que
-- auth.users.id (no un BIGINT autogenerado aparte). Así:
--   - El frontend usa supabase-js para signUp/signIn (Supabase valida todo).
--   - Un trigger en auth.users crea automáticamente la fila en public.usuario.
--   - El backend solo confía en el JWT que emite Supabase para saber quién
--     hace la petición (ver src/middleware/auth.js).
--
-- Corre esto en el SQL Editor de Supabase DESPUÉS de tu schema.sql original,
-- reemplazando la definición vieja de `usuario`:
-- =============================================================================

-- 1. Si la tabla `usuario` ya existe con la definición vieja, recréala:
DROP TABLE IF EXISTS usuario CASCADE;

CREATE TABLE usuario (
    id_usuario UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    id_institucional VARCHAR(20) UNIQUE,
    nombre_completo VARCHAR(150) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    id_rol SMALLINT NOT NULL REFERENCES rol(id_rol) ON DELETE RESTRICT,
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_matricula_intec_formato CHECK (
        id_institucional IS NULL OR id_institucional ~ '^[0-9]{7}$' OR LENGTH(id_institucional) <= 20
    )
);
-- Nota: si ya tenías filas en `usuario` y referencias en reporte/reclamacion/etc.
-- desde otra corrida del schema, este DROP CASCADE las borra. En producción,
-- migra los datos primero en vez de dropear.

-- 2. Recrear las FK de las tablas hijas apuntando al nuevo tipo UUID
--    (si corriste schema.sql completo de nuevo después del DROP CASCADE,
--    este paso ya está resuelto porque las tablas hijas se recrean con
--    id_usuario UUID; si no, deberás ALTER cada columna id_usuario a UUID).

-- 3. Función + trigger: cuando alguien se registra vía Supabase Auth,
--    crea automáticamente su fila en public.usuario.
--    Por defecto asigna el rol "estudiante" (ajusta el id_rol si es otro).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuario (id_usuario, nombre_completo, correo, id_institucional, id_rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'id_institucional',
    (SELECT id_rol FROM public.rol WHERE nombre_rol = 'estudiante')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Con esto, el frontend hace supabase.auth.signUp({ email, password, options:
-- { data: { nombre_completo, id_institucional } } }) y el perfil se crea solo.
