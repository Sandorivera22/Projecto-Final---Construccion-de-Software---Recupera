const { z } = require("zod");

const crearReporteSchema = z.object({
  idCategoriaObjeto: z.number().int().positive(),
  tipo: z.enum(["perdido", "encontrado"]),
  nombreObjeto: z.string().trim().min(2).max(120),
  descripcionObjeto: z.string().trim().min(5),
  lugarCampus: z.string().trim().min(2).max(150),
  fechaEvento: z.coerce.date(),
  enCustodiaOficina: z.boolean().optional().default(false),
  urlFoto: z.string().url().max(500).optional().nullable(),
  origenHallazgo: z
    .enum(["estudiante", "personal_limpieza", "seguridad", "encargado"])
    .optional()
    .default("estudiante"),
  nombrePersonalLimpieza: z.string().trim().max(150).optional().nullable(),
});

const actualizarReporteSchema = crearReporteSchema.partial().extend({
  estado: z.enum(["activo", "en_proceso", "resuelto", "retirado"]).optional(),
});

const filtrosReporteSchema = z.object({
  tipo: z.enum(["perdido", "encontrado"]).optional(),
  idCategoriaObjeto: z.coerce.number().int().positive().optional(),
  estado: z.enum(["activo", "en_proceso", "resuelto", "retirado"]).optional(),
  busqueda: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

module.exports = { crearReporteSchema, actualizarReporteSchema, filtrosReporteSchema };
