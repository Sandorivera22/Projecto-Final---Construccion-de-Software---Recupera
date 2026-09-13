const { ZodError } = require("zod");
const { Prisma } = require("@prisma/client");

/**
 * Manejador de errores centralizado. Con express-async-errors, cualquier
 * error lanzado (o rechazo de promesa) dentro de un controlador async
 * llega automáticamente aquí, sin necesidad de try/catch en cada ruta.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Errores de validación de entrada (zod)
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Datos inválidos",
      detalles: err.issues.map((i) => ({
        campo: i.path.join("."),
        mensaje: i.message,
      })),
    });
  }

  // Errores conocidos de Prisma (constraint violations, registros no encontrados, etc.)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error: "Ya existe un registro con ese valor único",
        campo: err.meta?.target,
      });
    }
    if (err.code === "P2003") {
      return res.status(409).json({ error: "Referencia inválida (llave foránea)" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Registro no encontrado" });
    }
  }

  // Errores de negocio lanzados a propósito (ver src/utils/AppError.js)
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error(err);
  return res.status(500).json({ error: "Error interno del servidor" });
}

module.exports = errorHandler;
