const { z } = require("zod");

const crearMensajeSchema = z.object({
  contenido: z.string().trim().min(1).max(2000),
});

module.exports = { crearMensajeSchema };
