// Prisma usa BigInt para las columnas BIGINT (id_reporte, id_reclamacion, etc.)
// pero JSON.stringify no sabe serializar BigInt de forma nativa.
// Este parche lo convierte a string al responder por Express (res.json).
// Se importa una sola vez, antes de que arranque la app.
BigInt.prototype.toJSON = function () {
  return this.toString();
};
