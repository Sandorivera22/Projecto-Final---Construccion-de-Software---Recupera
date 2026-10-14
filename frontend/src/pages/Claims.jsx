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

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("es-DO", { dateStyle: "medium" }).format(new Date(value))
    : "Sin fecha";
}

function ClaimList({ claims, emptyMessage, received = false }) {
  if (claims.length === 0) {
    return <p className="claims-empty">{emptyMessage}</p>;
  }

  return (
    <div className="claims-list">
      {claims.map((claim) => (
        <article className="claims-row" key={claim.idReclamacion}>
          <div className="claims-row__main">
            <span className="claims-row__eyebrow">
              {received ? "Reclamación recibida" : "Reclamación realizada"}
            </span>
            <h3>{claim.reporte?.nombreObjeto || "Objeto reportado"}</h3>
            <p>
              {received
                ? `De ${claim.usuario?.nombreCompleto || "un usuario"}`
                : `Enviada el ${formatDate(claim.fechaSolicitud)}`}
            </p>
          </div>
          <div className="claims-row__actions">
            <span className={`claims-status claims-status--${claim.estado}`}>
              {statusLabels[claim.estado] || claim.estado}
            </span>
            <Link to={`/reclamaciones/${claim.idReclamacion}/conversacion`}>
              Abrir conversación
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function Claims() {
  const { profile, session } = useAuth();
  const [claims, setClaims] = useState([]);
  const [receivedClaims, setReceivedClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isStaff = ["encargado", "admin"].includes(profile?.rol?.nombreRol);

  const loadClaims = useCallback(async () => {
    if (!session?.access_token) return;

    setLoading(true);
    setError("");
    try {
      const [filed, received] = await Promise.all([
        apiRequest("/reclamaciones/mias", { accessToken: session.access_token }),
        apiRequest("/reclamaciones/recibidas", { accessToken: session.access_token }),
      ]);
      setClaims(filed || []);
      setReceivedClaims(received || []);
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar el historial de reclamaciones.");
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  return (
    <div className="claims-page">
      <header className="claims-page__header">
        <div>
          <span className="claims-page__eyebrow">Seguimiento y conversaciones</span>
          <h1>Reclamaciones</h1>
          <p>Consulta el estado de tus solicitudes y continúa las conversaciones relacionadas.</p>
        </div>
        {isStaff ? (
          <Link className="claims-review-link" to="/reclamaciones/revision">
            Abrir cola de revisión
          </Link>
        ) : null}
      </header>

      {error ? <ErrorState message={error} onRetry={loadClaims} /> : null}
      {loading ? <LoadingState message="Cargando reclamaciones..." /> : null}

      {!loading && !error ? (
        <div className="claims-sections">
          <section className="claims-section">
            <div className="claims-section__heading">
              <div>
                <h2>Realizadas por ti</h2>
                <p>Solicitudes que enviaste para objetos encontrados.</p>
              </div>
              <span>{claims.length}</span>
            </div>
            <ClaimList claims={claims} emptyMessage="Aún no has realizado reclamaciones." />
          </section>

          <section className="claims-section">
            <div className="claims-section__heading">
              <div>
                <h2>Recibidas en tus reportes</h2>
                <p>Solicitudes de otras personas sobre objetos que reportaste.</p>
              </div>
              <span>{receivedClaims.length}</span>
            </div>
            <ClaimList
              claims={receivedClaims}
              emptyMessage="Aún no has recibido reclamaciones."
              received
            />
          </section>
        </div>
      ) : null}
    </div>
  );
}
