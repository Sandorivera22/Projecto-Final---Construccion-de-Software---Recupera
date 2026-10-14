import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

const activeClaimStatuses = ["pendiente", "en_revision", "aprobada"];

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("es-DO", { dateStyle: "medium" }).format(new Date(value))
    : "Sin fecha";
}

export default function ClaimProcess() {
  const { idReporte } = useParams();
  const { profile, session } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [existingClaim, setExistingClaim] = useState(null);
  const [proof, setProof] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadClaimContext() {
    setLoading(true);
    setError("");
    setReport(null);
    setExistingClaim(null);
    try {
      const nextReport = await apiRequest(`/reportes/${idReporte}`, {
        accessToken: session.access_token,
      });
      setReport(nextReport);

      if (profile?.rol?.nombreRol === "estudiante") {
        const claims = await apiRequest("/reclamaciones/mias", {
          accessToken: session.access_token,
        });
        setExistingClaim(claims.find((claim) =>
          String(claim.idReporte) === String(idReporte) &&
          activeClaimStatuses.includes(claim.estado)
        ) || null);
      }
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar el proceso de reclamación.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClaimContext();
  }, [idReporte, profile?.rol?.nombreRol, session.access_token]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!report || profile?.rol?.nombreRol !== "estudiante") return;

    setSubmitting(true);
    setError("");
    try {
      const claim = await apiRequest("/reclamaciones", {
        accessToken: session.access_token,
        method: "POST",
        body: JSON.stringify({
          idReporte: report.idReporte,
          pruebasPropiedad: proof.trim(),
        }),
      });
      navigate(`/reclamaciones/${claim.idReclamacion}/conversacion`);
    } catch (submitError) {
      setError(submitError.message || "No se pudo enviar la reclamación.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState message="Cargando reporte..." />;
  if (error && !report) {
    return <div className="claim-page"><ErrorState message={error} onRetry={loadClaimContext} /></div>;
  }

  const canSubmit = report?.tipo === "encontrado" &&
    report.usuario?.idUsuario !== profile?.idUsuario &&
    !["resuelto", "retirado"].includes(report.estado);
  const isStudent = profile?.rol?.nombreRol === "estudiante";

  return (
    <div className="claim-page">
      <div className="claim-header">
        <h1>Reclamar objeto encontrado</h1>
        <p>Describe detalles privados que ayuden a comprobar que el objeto te pertenece.</p>
      </div>

      {error ? <ErrorState message={error} /> : null}

      {!isStudent ? (
        <div className="claim-info claim-info--error">Solo los estudiantes pueden iniciar una reclamación.</div>
      ) : !canSubmit ? (
        <div className="claim-info claim-info--error">Este reporte no admite reclamaciones.</div>
      ) : error ? (
        <div className="claim-info claim-info--error">
          No se pudo comprobar si ya tienes una reclamación activa. Reintenta antes de enviar una nueva.
          <button type="button" className="claim-submit" onClick={loadClaimContext}>Reintentar</button>
        </div>
      ) : existingClaim ? (
        <div className="claim-info">
          Ya tienes una reclamación activa para este reporte. Puedes continuar la conversación existente.
          <Link to={`/reclamaciones/${existingClaim.idReclamacion}/conversacion`}>Abrir conversación</Link>
        </div>
      ) : (
        <div className="claim-layout">
          <form className="claim-form-card" onSubmit={handleSubmit}>
            <h2>Validación de propiedad</h2>
            <div className="claim-info">
              Comparte información distintiva que no aparezca en la descripción pública. Esta información será visible para quien reportó el objeto y para el personal autorizado.
            </div>
            <div className="claim-question">
              <label htmlFor="claim-proof">¿Qué detalles demuestran que el objeto es tuyo? (mínimo 10 caracteres)</label>
              <textarea
                id="claim-proof"
                value={proof}
                onChange={(event) => setProof(event.target.value)}
                minLength={10}
                maxLength={5000}
                required
                rows={6}
                placeholder="Describe marcas, contenido, características u otros detalles que solo su propietario conocería."
              />
            </div>
            <div className="claim-actions">
              <Link className="claim-cancel" to={`/objetos/${report.idReporte}`}>Cancelar</Link>
              <button className="claim-submit" type="submit" disabled={submitting || proof.trim().length < 10}>
                {submitting ? "Enviando..." : "Enviar reclamación"}
              </button>
            </div>
          </form>

          <aside className="claim-object-card">
            <h2>Objeto que reclamas</h2>
            <img className="claim-object-image" src={report.urlFoto || "/assets/campus-banner.jpeg"} alt={report.nombreObjeto} />
            <h3>{report.nombreObjeto}</h3>
            <span className="claim-object-status">Reportado como encontrado</span>
            <div className="claim-object-details">
              <p><strong>Categoría:</strong> {report.categoriaObjeto?.nombreCategoria || "Sin categoría"}</p>
              <p><strong>Ubicación:</strong> {report.lugarCampus}</p>
              <p><strong>Fecha del hallazgo:</strong> {formatDate(report.fechaEvento)}</p>
              <p><strong>Reportante:</strong> {report.usuario?.nombreCompleto || "Usuario del campus"}</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
