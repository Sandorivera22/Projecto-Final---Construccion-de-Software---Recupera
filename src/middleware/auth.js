const { supabaseAdmin } = require("../lib/supabase");
const prisma = require("../lib/prisma");

/**
 * Verifica el JWT que envía el frontend (Authorization: Bearer <token>),
 * obtenido de supabase.auth.getSession() en el cliente.
 * Si es válido, adjunta a req.usuario el perfil de public.usuario
 * (incluyendo el rol) para que el resto de la app no tenga que
 * volver a consultarlo.
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Falta el token de autenticación" });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario: data.user.id },
      include: { rol: true },
    });

    if (!usuario) {
      // El usuario existe en Supabase Auth pero aún no tiene perfil en
      // public.usuario (el trigger handle_new_user debería crearlo solo).
      return res.status(404).json({
        error: "Perfil de usuario no encontrado. Intenta de nuevo en unos segundos.",
      });
    }

    if (!usuario.estado) {
      return res.status(403).json({ error: "Tu cuenta está inhabilitada" });
    }

    req.usuario = usuario;
    req.authUser = data.user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Restringe una ruta a ciertos roles (nombre_rol), ej: requireRole('encargado', 'admin')
 * Debe usarse SIEMPRE después de requireAuth.
 */
function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: "No autenticado" });
    }
    if (!rolesPermitidos.includes(req.usuario.rol.nombreRol)) {
      return res.status(403).json({ error: "No tienes permiso para esta acción" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
