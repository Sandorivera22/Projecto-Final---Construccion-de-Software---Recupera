const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const {
  crearReporteSchema,
  actualizarReporteSchema,
  filtrosReporteSchema,
} = require("../schemas/reporte.schema");

// Selección pública de campos del reportante: nunca exponemos correo/teléfono
// a cualquiera que liste reportes, solo nombre.
const REPORTANTE_PUBLICO = {
  select: { idUsuario: true, nombreCompleto: true },
};

function esDuenoOStaff(reporte, usuario) {
  const esDueno = reporte.idUsuario === usuario.idUsuario;
  const esStaff = ["encargado", "admin"].includes(usuario.rol.nombreRol);
  return esDueno || esStaff;
}

async function listar(req, res) {
  const filtros = filtrosReporteSchema.parse(req.query);
  const { tipo, idCategoriaObjeto, estado, busqueda, page, pageSize } = filtros;

  const where = {
    ...(tipo && { tipo }),
    ...(idCategoriaObjeto && { idCategoriaObjeto }),
    // Por defecto solo mostramos reportes visibles públicamente (no retirados)
    estado: estado ?? { not: "retirado" },
    ...(busqueda && {
      OR: [
        { nombreObjeto: { contains: busqueda, mode: "insensitive" } },
        { descripcionObjeto: { contains: busqueda, mode: "insensitive" } },
        { lugarCampus: { contains: busqueda, mode: "insensitive" } },
      ],
    }),
  };

  const [reportes, total] = await Promise.all([
    prisma.reporte.findMany({
      where,
      include: { categoriaObjeto: true, usuario: REPORTANTE_PUBLICO },
      orderBy: { creadoEn: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.reporte.count({ where }),
  ]);

  res.json({
    data: reportes,
    paginacion: { page, pageSize, total, totalPaginas: Math.ceil(total / pageSize) },
  });
}

async function misReportes(req, res) {
  const reportes = await prisma.reporte.findMany({
    where: { idUsuario: req.usuario.idUsuario },
    include: { categoriaObjeto: true },
    orderBy: { creadoEn: "desc" },
  });
  res.json(reportes);
}

async function obtener(req, res) {
  const id = BigInt(req.params.id);
  const reporte = await prisma.reporte.findUnique({
    where: { idReporte: id },
    include: { categoriaObjeto: true, usuario: REPORTANTE_PUBLICO },
  });
  if (!reporte) throw new AppError("Reporte no encontrado", 404);
  res.json(reporte);
}

async function marcarRecuperado(req, res) {
  const id = BigInt(req.params.id);
  const reporte = await prisma.reporte.findUnique({ where: { idReporte: id } });
  if (!reporte) throw new AppError("Reporte no encontrado", 404);

  if (reporte.tipo !== "perdido") {
    throw new AppError(
      "Solo un reporte de objeto perdido se marca como recuperado directamente; " +
        "un objeto encontrado se marca como entregado a través de la evaluación de una reclamación",
      400
    );
  }
  if (reporte.idUsuario !== req.usuario.idUsuario) {
    throw new AppError("Solo el dueño del reporte puede marcarlo como recuperado", 403);
  }
  if (["retirado", "resuelto"].includes(reporte.estado)) {
    throw new AppError(`Este reporte ya está en estado '${reporte.estado}'`, 400);
  }

  const actualizado = await prisma.reporte.update({
    where: { idReporte: id },
    data: { estado: "resuelto" },
  });
  res.json(actualizado);
}

async function crear(req, res) {
  const datos = crearReporteSchema.parse(req.body);

  const categoria = await prisma.categoriaObjeto.findUnique({
    where: { idCategoriaObjeto: datos.idCategoriaObjeto },
  });
  if (!categoria || !categoria.estado) {
    throw new AppError("Categoría inválida", 400);
  }

  const reporte = await prisma.reporte.create({
    data: { ...datos, idUsuario: req.usuario.idUsuario },
    include: { categoriaObjeto: true },
  });
  res.status(201).json(reporte);
}

async function actualizar(req, res) {
  const id = BigInt(req.params.id);
  const datos = actualizarReporteSchema.parse(req.body);

  const reporte = await prisma.reporte.findUnique({ where: { idReporte: id } });
  if (!reporte) throw new AppError("Reporte no encontrado", 404);
  if (!esDuenoOStaff(reporte, req.usuario)) {
    throw new AppError("No puedes editar este reporte", 403);
  }

  // Solo encargado/admin puede cambiar el estado del reporte
  if (datos.estado && !["encargado", "admin"].includes(req.usuario.rol.nombreRol)) {
    delete datos.estado;
  }

  const actualizado = await prisma.reporte.update({
    where: { idReporte: id },
    data: datos,
    include: { categoriaObjeto: true },
  });
  res.json(actualizado);
}

async function retirar(req, res) {
  const id = BigInt(req.params.id);
  const reporte = await prisma.reporte.findUnique({ where: { idReporte: id } });
  if (!reporte) throw new AppError("Reporte no encontrado", 404);
  if (!esDuenoOStaff(reporte, req.usuario)) {
    throw new AppError("No puedes retirar este reporte", 403);
  }

  const actualizado = await prisma.reporte.update({
    where: { idReporte: id },
    data: { estado: "retirado" },
  });
  res.json(actualizado);
}

module.exports = { listar, misReportes, obtener, crear, actualizar, retirar, marcarRecuperado };
