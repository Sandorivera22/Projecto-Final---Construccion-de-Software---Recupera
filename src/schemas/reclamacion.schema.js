const { z } = require("zod");

const crearReclamacionSchema = z.object({
  idReporte: z.coerce.bigint(),
  pruebasPropiedad: z.string().trim().min(10, {
    message: "Describe con suficiente detalle por qué el objeto es tuyo (mínimo 10 caracteres)",
  }),
});

const crearEvaluacionSchema = z.object({
  decision: z.enum(["aprobada", "rechazada", "completada"]),
  observaciones: z.string().trim().min(3),
});

const filtrosReclamacionSchema = z.object({
  estado: z
    .enum(["pendiente", "en_revision", "aprobada", "rechazada", "completada"])
    .optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

module.exports = { crearReclamacionSchema, crearEvaluacionSchema, filtrosReclamacionSchema };
