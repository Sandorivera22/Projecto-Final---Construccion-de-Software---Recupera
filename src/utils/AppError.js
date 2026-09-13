/**
 * Error de negocio con código HTTP asociado.
 * Ej: throw new AppError("No puedes reclamar tu propio reporte", 400)
 */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

module.exports = AppError;
