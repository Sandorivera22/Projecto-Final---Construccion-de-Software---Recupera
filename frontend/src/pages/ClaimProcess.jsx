import React from "react";
import { useNavigate } from "react-router-dom";

export default function ClaimProcess() {
    const navigate = useNavigate();
  return (
    <div className="claim-page">
      <div className="claim-header">
        <div>
          <h1>Proceso de Reclamación</h1>
          <p>
            Completa el formulario dinámico de seguridad para validar que el
            objeto te pertenece.
          </p>
        </div>
      </div>

      {/* Progreso */}
      <div className="claim-progress">
        <div className="claim-step active">
          <div className="claim-step-number">1</div>
          <div>
            <strong>En revisión</strong>
            <span>Completado</span>
          </div>
        </div>

        <div className="claim-line"></div>

        <div className="claim-step">
          <div className="claim-step-number">2</div>
          <div>
            <strong>Verificada</strong>
            <span>Pendiente</span>
          </div>
        </div>

        <div className="claim-line"></div>

        <div className="claim-step">
          <div className="claim-step-number">3</div>
          <div>
            <strong>Entregada</strong>
            <span>Pendiente</span>
          </div>
        </div>
      </div>

      <div className="claim-layout">
        {/* Formulario */}
        <section className="claim-form-card">
          <h2>Formulario de Verificación de Propiedad</h2>

          <div className="claim-info">
            Tus respuestas son privadas y solo serán visibles para el equipo
            de seguridad y administración.
          </div>

          <div className="claim-question">
            <label>
              1. ¿Qué características, calcomanías o marcas distintivas posee
              el objeto?
            </label>

            <textarea
              placeholder="Describe características que permitan demostrar que el objeto te pertenece..."
              rows="4"
            />
          </div>

          <div className="claim-question">
            <label>
              2. Describe algún detalle específico que solo el propietario
              debería conocer.
            </label>

            <textarea
              placeholder="Escribe aquí los detalles..."
              rows="4"
            />
          </div>

          <div className="claim-question">
            <label>Documentación de soporte (Opcional)</label>

            <div className="claim-upload">
              <strong>Subir evidencia de propiedad</strong>

              <span>
                Factura de compra, caja original o fotos previas
                (JPG, PNG, PDF)
              </span>

              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
              />
            </div>
          </div>

          <div className="claim-actions">
                        <button
            type="button"
            className="claim-cancel"
            onClick={() => navigate("/matches")}
            >
            Descartar
            </button>

            <button type="button" className="claim-submit">
              Enviar Reclamación
            </button>
          </div>
        </section>

        {/* Objeto coincidente */}
        <aside className="claim-object-card">
          <h2>Detalles del Objeto Coincidente</h2>

          <div className="claim-object-placeholder">
            Imagen del objeto
          </div>

          <h3>Objeto coincidente</h3>

          <span className="claim-object-status">
            Reportado como encontrado
          </span>

          <div className="claim-object-details">
            <p>
              <strong>Ubicación:</strong> Pendiente de datos
            </p>

            <p>
              <strong>Fecha de hallazgo:</strong> Pendiente de datos
            </p>

            <p>
              <strong>Gestor de entrega:</strong> Pendiente de datos
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}