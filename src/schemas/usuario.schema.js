const { z } = require("zod");

const actualizarPerfilSchema = z.object({
  nombreCompleto: z.string().trim().min(2).max(150).optional(),
  telefono: z.string().trim().max(20).optional().nullable(),
  idInstitucional: z
    .string()
    .trim()
    .regex(/^[0-9]{7}$/, "La matrícula debe tener 7 dígitos")
    .optional()
    .nullable(),
});

const cambiarRolSchema = z.object({
  idRol: z.number().int().positive(),
});

const cambiarEstadoSchema = z.object({
  estado: z.boolean(),
});

module.exports = { actualizarPerfilSchema, cambiarRolSchema, cambiarEstadoSchema };
