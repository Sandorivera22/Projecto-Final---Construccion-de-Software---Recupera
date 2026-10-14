import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

const statusLabels = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  completada: "Entrega completada",
};

export default function ClaimReview() {
  const { profile, session } = useAuth();
  const [claims, setClaims] = useState([]);
  const [observations, setObservations] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const isStaff = ["encargado", "admin"].includes(profile?.rol?.nombreRol);

  const loadClaims = useCallback(async () => {
    if (!isStaff) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await apiRequest("/reclamaciones?page=1&pageSize=100", {
        accessToken: session.access_token,
      });
      setClaims(response.data || []);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar las reclamaciones.");
    } finally {
      setLoading(false);
    }
  }, [isStaff, session.access_token]);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  async function submitDecision(claim, decision) {
    const note = (observations[claim.idReclamacion] || "").trim();
    if (note.length < 3) {
      setError("Escribe una observación de al menos 3 caracteres antes de evaluar la reclamación.");
      return;
    }

    setSavingId(claim.idReclamacion);
    setError("");
    try {
      await apiRequest(`/reclamaciones/${claim.idReclamacion}/evaluacion`, {
        accessToken: session.access_token,
        method: "POST",
        body: JSON.stringify({ decision, observaciones: note }),
      });
      setObservations((current) => ({ ...current, [claim.idReclamacion]: "" }));
      await loadClaims();
    } catch (decisionError) {
      setError(decisionError.message || "No se pudo actualizar la reclamación.");
    } finally {
      setSavingId(null);
    }
  }

  if (!isStaff) {
    return (
      <div className="claim-page">
        <div className="claim-info claim-info--error">Esta pantalla está disponible solo para encargados y administradores.</div>
        <Link className="claim-cancel" to="/dashboard">Volver al dashboard</Link>
      </div>
    );
  }

  return (
    <div className="claim-page">
      <div className="claim-header">
        <h1>Revisión de reclamaciones</h1>
        <p>Evalúa la evidencia y registra la decisión o confirmación de entrega.</p>
      </div>

      {error ? <ErrorState message={error} onRetry={loadClaims} /> : null}
      {loading ? <LoadingState message="Cargando reclamaciones..." /> : null}

      {!loading && !error && claims.length === 0 ? (
        <div className="claim-info">No hay reclamaciones para revisar.</div>
      ) : null}

      {!loading && claims.length > 0 ? (
        <div className="claim-review-list">
          {claims.map((claim) => {
            const isPending = ["pendiente", "en_revision"].includes(claim.estado);
            const isApproved = claim.estado === "aprobada";
            const isSaving = savingId === claim.idReclamacion;
            return (
              <article className="claim-review-card" key={claim.idReclamacion}>
                <div className="claim-review-card__header">
                  <div>
                    <h2>{claim.reporte?.nombreObjeto || "Objeto reportado"}</h2>
                    <p>Reclamante: {claim.usuario?.nombreCompleto || "Usuario"}</p>
                    {claim.reporte?.lugarCampus ? <p>{claim.reporte.lugarCampus}</p> : null}
                  </div>
                  <span className={`profile-status-pill profile-status-pill--${claim.estado}`}>
                    {statusLabels[claim.estado] || claim.estado}
                  </span>
                </div>

                <section className="claim-review-card__evidence">
                  <h3>Detalles aportados para validar la propiedad</h3>
                  <p>{claim.pruebasPropiedad}</p>
                </section>
                <Link className="claim-review-card__conversation" to={`/reclamaciones/${claim.idReclamacion}/conversacion`}>
                  Abrir conversación
                </Link>

                {isPending || isApproved ? (
                  <div className="claim-review-card__actions">
                    <label htmlFor={`claim-observations-${claim.idReclamacion}`}>
                      {isApproved ? "Nota de entrega" : "Observaciones de evaluación"}
                    </label>
                    <textarea
                      id={`claim-observations-${claim.idReclamacion}`}
                      value={observations[claim.idReclamacion] || ""}
                      onChange={(event) => setObservations((current) => ({
                        ...current,
                        [claim.idReclamacion]: event.target.value,
                      }))}
                      minLength={3}
                      maxLength={5000}
                      rows={3}
                      required
                    />
                    {isPending ? (
                      <div className="claim-review-card__buttons">
                        <button type="button" className="claim-review-button claim-review-button--approve" disabled={isSaving} onClick={() => submitDecision(claim, "aprobada")}>
                          {isSaving ? "Guardando..." : "Aprobar"}
                        </button>
                        <button type="button" className="claim-review-button claim-review-button--reject" disabled={isSaving} onClick={() => submitDecision(claim, "rechazada")}>
                          Rechazar
                        </button>
                      </div>
                    ) : (
                      <button type="button" className="claim-review-button claim-review-button--approve" disabled={isSaving} onClick={() => submitDecision(claim, "completada")}>
                        {isSaving ? "Guardando..." : "Confirmar entrega"}
                      </button>
                    )}
                  </div>
                ) : claim.evaluacion?.observaciones ? (
                  <p className="claim-review-card__notes"><strong>Observaciones:</strong> {claim.evaluacion.observaciones}</p>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
