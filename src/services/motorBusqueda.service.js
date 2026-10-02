const AppError = require("../utils/AppError");

const MOTOR_BUSQUEDA_URL = process.env.MOTOR_BUSQUEDA_URL;

/**
 * Dispara la indexación de una foto en segundo plano. No bloquea al
 * usuario aunque el microservicio tarde en generar el embedding — los
 * errores solo se registran en consola, nunca rompen la respuesta al cliente.
 */
function indexarFoto(idReporte, urlFoto) {
  if (!MOTOR_BUSQUEDA_URL) {
    console.warn("MOTOR_BUSQUEDA_URL no configurado — se omite la indexación");
    return;
  }
  fetch(`${MOTOR_BUSQUEDA_URL}/indexar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_reporte: Number(idReporte), url_foto: urlFoto }),
  }).catch((err) => console.error(`No se pudo indexar el reporte ${idReporte}:`, err.message));
}

/**
 * Búsqueda semántica: a diferencia de indexarFoto, aquí SÍ hay que esperar
 * la respuesta — el usuario necesita los resultados para continuar.
 */
async function buscarPorDescripcion({ descripcion, tipoReporte, limite, umbralMinimo }) {
  if (!MOTOR_BUSQUEDA_URL) {
    throw new AppError("El motor de búsqueda no está configurado (falta MOTOR_BUSQUEDA_URL)", 500);
  }

  let respuesta;
  try {
    respuesta = await fetch(`${MOTOR_BUSQUEDA_URL}/buscar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descripcion,
        tipo_reporte: tipoReporte,
        limite,
        umbral_minimo: umbralMinimo,
      }),
    });
  } catch {
    throw new AppError("El motor de búsqueda no está disponible en este momento", 503);
  }

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => ({}));
    throw new AppError(cuerpo.detail || "Error al buscar en el motor semántico", 502);
  }

  return respuesta.json();
}

module.exports = { indexarFoto, buscarPorDescripcion };