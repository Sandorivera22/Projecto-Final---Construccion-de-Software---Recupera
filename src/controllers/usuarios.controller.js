const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const {
  actualizarPerfilSchema,
  cambiarRolSchema,
  cambiarEstadoSchema,
} = require("../schemas/usuario.schema");

async function miPerfil(req, res) {
  // req.usuario ya viene cargado (con rol) desde el middleware requireAuth
  res.json(req.usuario);
}

async function actualizarMiPerfil(req, res) {
  const datos = actualizarPerfilSchema.parse(req.body);
  const actualizado = await prisma.usuario.update({
    where: { idUsuario: req.usuario.idUsuario },
    data: datos,
    include: { rol: true },
  });
  res.json(actualizado);
}

// --- Endpoints solo para admin ---

async function listar(req, res) {
  const usuarios = await prisma.usuario.findMany({
    include: { rol: true },
    orderBy: { creadoEn: "desc" },
  });
  res.json(usuarios);
}

async function obtener(req, res) {
  const usuario = await prisma.usuario.findUnique({
    where: { idUsuario: req.params.id },
    include: { rol: true },
  });
  if (!usuario) throw new AppError("Usuario no encontrado", 404);
  res.json(usuario);
}

async function cambiarRol(req, res) {
  const { idRol } = cambiarRolSchema.parse(req.body);
  const rol = await prisma.rol.findUnique({ where: { idRol } });
  if (!rol) throw new AppError("Rol inválido", 400);

  const usuario = await prisma.usuario.update({
    where: { idUsuario: req.params.id },
    data: { idRol },
    include: { rol: true },
  });
  res.json(usuario);
}

async function cambiarEstado(req, res) {
  const { estado } = cambiarEstadoSchema.parse(req.body);
  const usuario = await prisma.usuario.update({
    where: { idUsuario: req.params.id },
    data: { estado },
    include: { rol: true },
  });
  res.json(usuario);
}

module.exports = {
  miPerfil,
  actualizarMiPerfil,
  listar,
  obtener,
  cambiarRol,
  cambiarEstado,
};
