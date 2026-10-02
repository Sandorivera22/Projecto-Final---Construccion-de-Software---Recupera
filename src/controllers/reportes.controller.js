const prisma = require("../lib/prisma");
const path = require("path");
const { supabaseAdmin } = require("../lib/supabase");
const AppError = require("../utils/AppError");
const {
  crearReporteSchema,
  actualizarReporteSchema,
  filtrosReporteSchema,
  misCoincidenciasSchema,
} = require("../schemas/reporte.schema");
const { indexarFoto, buscarPorDescripcion } = require("../services/motorBusqueda.service");
const { buscarSemanticoSchema } = require("../schemas/reporte.schema");

// Selección pública de campos del reportante: nunca exponemos correo/teléfono
// a cualquiera que liste reportes, solo nombre.
const REPORTANTE_PUBLICO = {
  select: { idUsuario: true, nombreCompleto: true },
};
const EXTENSIONES_FOTO_PERMITIDAS = new Set([".jpg", ".jpeg", ".png", ".webp", ".bmp"]);
const TIPOS_MIME_FOTO = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
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

async function subirFoto(req, res) {
  const id = BigInt(req.params.id);
  if (!req.file) throw new AppError("Debes enviar una imagen en el campo 'foto'", 400);

  const extension = path.extname(req.file.originalname).toLowerCase();
  if (!EXTENSIONES_FOTO_PERMITIDAS.has(extension)) {
    throw new AppError("Solo se permiten imágenes .jpg, .jpeg, .png, .webp o .bmp", 400);
  }

  const reporte = await prisma.reporte.findUnique({ where: { idReporte: id } });
  if (!reporte) throw new AppError("Reporte no encontrado", 404);
  if (!esDuenoOStaff(reporte, req.usuario)) {
    throw new AppError("No puedes modificar la foto de este reporte", 403);
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET_REPORTES;
  if (!bucket) throw new AppError("El bucket de fotos no está configurado", 500);

  const ruta = `reportes/${id.toString()}/${Date.now()}${extension}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(ruta, req.file.buffer, {
      contentType: TIPOS_MIME_FOTO[extension],
      upsert: true,
    });

  if (uploadError) throw new AppError(`No se pudo subir la imagen: ${uploadError.message}`, 502);

  const { data: publicUrl } = supabaseAdmin.storage.from(bucket).getPublicUrl(ruta);
  const actualizado = await prisma.reporte.update({
    where: { idReporte: id },
    data: { urlFoto: publicUrl.publicUrl },
    include: { categoriaObjeto: true },
  });

  indexarFoto(id, publicUrl.publicUrl);

  res.json(actualizado);
}

async function buscarSemantico(req, res) {
  const datos = buscarSemanticoSchema.parse(req.query);
  const resultado = await buscarPorDescripcion(datos);
  res.json(resultado);
}

async function misCoincidencias(req, res) {
  const { umbralMinimo } = misCoincidenciasSchema.parse(req.query);
  const reportesPerdidos = await prisma.reporte.findMany({
    where: {
      idUsuario: req.usuario.idUsuario,
      tipo: "perdido",
      estado: "activo",
    },
    include: { categoriaObjeto: true },
    orderBy: { creadoEn: "desc" },
  });

  const busquedas = await Promise.all(
    reportesPerdidos.map(async (reportePerdido) => {
      const consulta = `${reportePerdido.nombreObjeto}. ${reportePerdido.descripcionObjeto}`;
      const resultado = await buscarPorDescripcion({
        descripcion: consulta.slice(0, 500),
        tipoReporte: "encontrado",
        limite: 10,
        umbralMinimo,
      });

      if (!Array.isArray(resultado?.resultados)) {
        throw new AppError("El motor devolvió una respuesta de búsqueda inválida", 502);
      }

      return { reportePerdido, resultados: resultado.resultados };
    })
  );

  const idsEncontrados = [
    ...new Set(
      busquedas.flatMap(({ resultados }) =>
        resultados
          .map((resultado) => String(resultado.id_reporte))
          .filter((id) => /^\d+$/.test(id))
      )
    ),
  ];

  if (idsEncontrados.length === 0) {
    return res.json({ reportesConsultados: reportesPerdidos.length, resultados: [] });
  }

  const reportesEncontrados = await prisma.reporte.findMany({
    where: {
      idReporte: { in: idsEncontrados.map((id) => BigInt(id)) },
      tipo: "encontrado",
      estado: "activo",
      idUsuario: { not: req.usuario.idUsuario },
    },
    include: {
      categoriaObjeto: true,
      usuario: REPORTANTE_PUBLICO,
    },
  });
  const reportesPorId = new Map(
    reportesEncontrados.map((reporte) => [reporte.idReporte.toString(), reporte])
  );

  const coincidencias = busquedas.flatMap(({ reportePerdido, resultados }) =>
    resultados.flatMap((resultado) => {
      const reporteEncontrado = reportesPorId.get(String(resultado.id_reporte));
      if (!reporteEncontrado) {
        return [];
      }

      return [{
        id: `${reportePerdido.idReporte}-${reporteEncontrado.idReporte}`,
        similitud: resultado.similitud,
        perdido: {
          idReporte: reportePerdido.idReporte.toString(),
          nombreObjeto: reportePerdido.nombreObjeto,
          descripcionObjeto: reportePerdido.descripcionObjeto,
          lugarCampus: reportePerdido.lugarCampus,
          fechaEvento: reportePerdido.fechaEvento,
          urlFoto: reportePerdido.urlFoto,
          categoria: reportePerdido.categoriaObjeto?.nombreCategoria || null,
        },
        encontrado: {
          idReporte: reporteEncontrado.idReporte.toString(),
          nombreObjeto: reporteEncontrado.nombreObjeto,
          descripcionObjeto: reporteEncontrado.descripcionObjeto,
          lugarCampus: reporteEncontrado.lugarCampus,
          fechaEvento: reporteEncontrado.fechaEvento,
          urlFoto: reporteEncontrado.urlFoto,
          categoria: reporteEncontrado.categoriaObjeto?.nombreCategoria || null,
          reportante: reporteEncontrado.usuario?.nombreCompleto || null,
        },
      }];
    })
  );

  coincidencias.sort((a, b) => b.similitud - a.similitud);
  res.json({ reportesConsultados: reportesPerdidos.length, resultados: coincidencias });
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

module.exports = {
  listar,
  misReportes,
  misCoincidencias,
  obtener,
  crear,
  actualizar,
  retirar,
  marcarRecuperado,
  subirFoto,
  buscarSemantico,
};
