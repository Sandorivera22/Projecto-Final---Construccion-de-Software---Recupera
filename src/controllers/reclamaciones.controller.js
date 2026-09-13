const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const {
  crearReclamacionSchema,
  crearEvaluacionSchema,
  filtrosReclamacionSchema,
} = require("../schemas/reclamacion.schema");

const REPORTANTE_PUBLICO = { select: { idUsuario: true, nombreCompleto: true } };

function esStaff(usuario) {
  return ["encargado", "admin"].includes(usuario.rol.nombreRol);
}

async function esParteDeLaReclamacion(reclamacion, usuario) {
  return (
    reclamacion.idUsuario === usuario.idUsuario || // el que reclama
    reclamacion.reporte.idUsuario === usuario.idUsuario || // quien reportó el objeto
    esStaff(usuario)
  );
}

async function crear(req, res) {
  const datos = crearReclamacionSchema.parse(req.body);

  const reporte = await prisma.reporte.findUnique({ where: { idReporte: datos.idReporte } });
  if (!reporte) throw new AppError("Reporte no encontrado", 404);
  if (reporte.estado === "retirado" || reporte.estado === "resuelto") {
    throw new AppError("Este reporte ya no admite reclamaciones", 400);
  }
  if (reporte.idUsuario === req.usuario.idUsuario) {
    throw new AppError("No puedes reclamar tu propio reporte", 400);
  }

  const [reclamacion] = await prisma.$transaction([
    prisma.reclamacion.create({
      data: {
        idReporte: datos.idReporte,
        idUsuario: req.usuario.idUsuario,
        pruebasPropiedad: datos.pruebasPropiedad,
      },
      include: { reporte: { include: { categoriaObjeto: true } } },
    }),
    prisma.reporte.updateMany({
      where: { idReporte: datos.idReporte, estado: "activo" },
      data: { estado: "en_proceso" },
    }),
  ]);

  res.status(201).json(reclamacion);
}

async function misReclamaciones(req, res) {
  const reclamaciones = await prisma.reclamacion.findMany({
    where: { idUsuario: req.usuario.idUsuario },
    include: {
      reporte: { include: { categoriaObjeto: true } },
      evaluacion: true,
    },
    orderBy: { fechaSolicitud: "desc" },
  });
  res.json(reclamaciones);
}

// Listado para encargado/admin: cola de reclamaciones a revisar
async function listar(req, res) {
  const { estado, page, pageSize } = filtrosReclamacionSchema.parse(req.query);

  const where = { ...(estado && { estado }) };
  const [reclamaciones, total] = await Promise.all([
    prisma.reclamacion.findMany({
      where,
      include: {
        reporte: { include: { categoriaObjeto: true } },
        usuario: REPORTANTE_PUBLICO,
        evaluacion: true,
      },
      orderBy: { fechaSolicitud: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.reclamacion.count({ where }),
  ]);

  res.json({
    data: reclamaciones,
    paginacion: { page, pageSize, total, totalPaginas: Math.ceil(total / pageSize) },
  });
}

async function obtener(req, res) {
  const id = BigInt(req.params.id);
  const reclamacion = await prisma.reclamacion.findUnique({
    where: { idReclamacion: id },
    include: {
      reporte: { include: { categoriaObjeto: true, usuario: REPORTANTE_PUBLICO } },
      usuario: REPORTANTE_PUBLICO,
      evaluacion: true,
    },
  });
  if (!reclamacion) throw new AppError("Reclamación no encontrada", 404);
  if (!(await esParteDeLaReclamacion(reclamacion, req.usuario))) {
    throw new AppError("No tienes acceso a esta reclamación", 403);
  }
  res.json(reclamacion);
}

// Encargado/admin evalúa: aprueba, rechaza o marca como completada (entregada)
async function evaluar(req, res) {
  const id = BigInt(req.params.id);
  const datos = crearEvaluacionSchema.parse(req.body);

  const reclamacion = await prisma.reclamacion.findUnique({
    where: { idReclamacion: id },
    include: { evaluacion: true },
  });
  if (!reclamacion) throw new AppError("Reclamación no encontrada", 404);
  if (reclamacion.evaluacion) {
    throw new AppError("Esta reclamación ya fue evaluada", 400);
  }

  const resultado = await prisma.$transaction(async (tx) => {
    const evaluacion = await tx.evaluacionReclamacion.create({
      data: {
        idReclamacion: id,
        idUsuarioEncargado: req.usuario.idUsuario,
        decision: datos.decision,
        observaciones: datos.observaciones,
      },
    });

    const reclamacionActualizada = await tx.reclamacion.update({
      where: { idReclamacion: id },
      data: { estado: datos.decision },
    });

    // Si se completa la entrega, el reporte pasa a resuelto.
    if (datos.decision === "completada") {
      await tx.reporte.update({
        where: { idReporte: reclamacion.idReporte },
        data: { estado: "resuelto" },
      });
    }

    // Si se rechaza, el reporte vuelve a estar activo para otras reclamaciones.
    if (datos.decision === "rechazada") {
      await tx.reporte.updateMany({
        where: { idReporte: reclamacion.idReporte, estado: "en_proceso" },
        data: { estado: "activo" },
      });
    }

    return { evaluacion, reclamacion: reclamacionActualizada };
  });

  res.status(201).json(resultado);
}

module.exports = { crear, misReclamaciones, listar, obtener, evaluar };
