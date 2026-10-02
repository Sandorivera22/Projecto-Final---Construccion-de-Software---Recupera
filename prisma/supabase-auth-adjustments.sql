
-- 1. Rol

CREATE TABLE IF NOT EXISTS rol (
    id_rol SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    estado BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO rol (nombre_rol, estado)
SELECT * FROM (VALUES
    ('estudiante', TRUE),
    ('encargado', TRUE),
    ('admin', TRUE)
) AS datos(nombre_rol, estado)
WHERE NOT EXISTS (SELECT 1 FROM rol);


-- 2. Categoria_objeto 

CREATE TABLE IF NOT EXISTS categoria_objeto (
    id_categoria_objeto SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL UNIQUE,
    estado BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO categoria_objeto (nombre_categoria, estado)
SELECT * FROM (VALUES
    ('Electrónica y Cargadores', TRUE),
    ('Documentos y Carnets', TRUE),
    ('Material Académico y Libros', TRUE),
    ('Ropa y Accesorios', TRUE),
    ('Otros Artículos Personales', TRUE)
) AS datos(nombre_categoria, estado)
WHERE NOT EXISTS (SELECT 1 FROM categoria_objeto);


-- 3. Usuario 

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


-- 4. Reporte 

CREATE TABLE reporte (
    id_reporte BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    id_categoria_objeto SMALLINT NOT NULL REFERENCES categoria_objeto(id_categoria_objeto) ON DELETE RESTRICT,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('perdido', 'encontrado')),
    nombre_objeto VARCHAR(120) NOT NULL,
    descripcion_objeto TEXT NOT NULL,
    lugar_campus VARCHAR(150) NOT NULL,
    fecha_evento DATE NOT NULL,
    en_custodia_oficina BOOLEAN NOT NULL DEFAULT FALSE,
    url_foto VARCHAR(500),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'en_proceso', 'resuelto', 'retirado')),
    origen_hallazgo VARCHAR(30) NOT NULL DEFAULT 'estudiante' CHECK (origen_hallazgo IN ('estudiante', 'personal_limpieza', 'seguridad', 'encargado')),
    nombre_personal_limpieza VARCHAR(150),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 5. Reclamación 

CREATE TABLE reclamacion (
    id_reclamacion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_reporte BIGINT NOT NULL REFERENCES reporte(id_reporte) ON DELETE RESTRICT,
    id_usuario UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    pruebas_propiedad TEXT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'aprobada', 'rechazada', 'completada')),
    fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RF-22: evita que un mismo estudiante duplique reclamos activos sobre el mismo reporte
CREATE UNIQUE INDEX uq_reclamo_activo_usuario
ON reclamacion (id_reporte, id_usuario)
WHERE estado IN ('pendiente', 'en_revision', 'aprobada');


-- 6. Evaluaciones reclamacion 

CREATE TABLE evaluaciones_reclamacion (
    id_evaluacion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_reclamacion BIGINT NOT NULL UNIQUE REFERENCES reclamacion(id_reclamacion) ON DELETE CASCADE,
    id_usuario_encargado UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('aprobada', 'rechazada', 'completada')),
    observaciones TEXT NOT NULL,
    fecha_evaluacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 7. Mensaje 

CREATE TABLE mensaje (
    id_mensaje BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_reclamacion BIGINT NOT NULL REFERENCES reclamacion(id_reclamacion) ON DELETE CASCADE,
    id_usuario UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    contenido TEXT NOT NULL,
    fecha_envio TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-
-- Índices de rendimiento 

CREATE INDEX idx_reporte_categoria_estado ON reporte(id_categoria_objeto, estado);
CREATE INDEX idx_reporte_tipo_fecha ON reporte(tipo, fecha_evento DESC);
CREATE INDEX idx_reporte_usuario ON reporte(id_usuario);
CREATE INDEX idx_reclamacion_reporte ON reclamacion(id_reporte);
CREATE INDEX idx_reclamacion_usuario ON reclamacion(id_usuario);
CREATE INDEX idx_mensaje_reclamacion_fecha ON mensaje(id_reclamacion, fecha_envio ASC);


-- Trigger: crea el perfil en public.usuario cuando alguien se registra
-- vía Supabase Auth (supabase.auth.signUp). Rol por defecto: estudiante.

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