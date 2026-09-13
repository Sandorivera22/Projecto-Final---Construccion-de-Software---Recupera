const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const { crearMensajeSchema } = require("../schemas/mensaje.schema");

function esStaff(usuario) {
  return ["encargado", "admin"].includes(usuario.rol.nombreRol);
}

async function obtenerReclamacionConAcceso(idReclamacion, usuario) {
  const reclamacion = await prisma.reclamacion.findUnique({
    where: { idReclamacion },
    include: { reporte: true },
  });
  if (!reclamacion) throw new AppError("Reclamación no encontrada", 404);

  const tieneAcceso =
    reclamacion.idUsuario === usuario.idUsuario ||
    reclamacion.reporte.idUsuario === usuario.idUsuario ||
    esStaff(usuario);

  if (!tieneAcceso) throw new AppError("No tienes acceso a esta conversación", 403);
  return reclamacion;
}

async function listar(req, res) {
  const idReclamacion = BigInt(req.params.idReclamacion);
  await obtenerReclamacionConAcceso(idReclamacion, req.usuario);

  const mensajes = await prisma.mensaje.findMany({
    where: { idReclamacion },
    include: { usuario: { select: { idUsuario: true, nombreCompleto: true } } },
    orderBy: { fechaEnvio: "asc" },
  });
  res.json(mensajes);
}

async function crear(req, res) {
  const idReclamacion = BigInt(req.params.idReclamacion);
  const datos = crearMensajeSchema.parse(req.body);
  const reclamacion = await obtenerReclamacionConAcceso(idReclamacion, req.usuario);

  // Se permite chatear mientras está pendiente, en revisión o aprobada
  // (para coordinar la entrega). Se cierra si fue rechazada o completada.
  if (["rechazada", "completada"].includes(reclamacion.estado)) {
    throw new AppError("Esta conversación ya está cerrada", 400);
  }

  const mensaje = await prisma.mensaje.create({
    data: {
      idReclamacion,
      idUsuario: req.usuario.idUsuario,
      contenido: datos.contenido,
    },
    include: { usuario: { select: { idUsuario: true, nombreCompleto: true } } },
  });
  res.status(201).json(mensaje);
}

module.exports = { listar, crear };
