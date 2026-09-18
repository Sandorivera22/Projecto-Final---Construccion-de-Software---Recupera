import React from "react";
import { useCallback, useEffect, useState } from "react";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getReportTypeLabel(type) {
  return type === "encontrado" ? "Encontrado" : "Perdido";
}

function Dashboard() {
  const { profile, session } = useAuth();
  const [reports, setReports] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!session?.access_token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [recentResponse, ownReports] = await Promise.all([
        apiRequest("/reportes?page=1&pageSize=5", {
          accessToken: session.access_token,
        }),
        apiRequest("/reportes/mios", {
          accessToken: session.access_token,
        }),
      ]);

      setReports(recentResponse.data || []);
      setMyReports(ownReports || []);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar los reportes.");
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const displayName = profile?.nombreCompleto?.split(" ")[0] || "usuario";
  const recoveredCount = myReports.filter((report) => report.estado === "resuelto").length;

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <h1>
            Hola, {displayName} <span aria-hidden="true">👋</span>
          </h1>
          <p>Revisa tus coincidencias y reportes en tiempo real.</p>
        </div>
        <div className="dashboard-heading__actions">
          <button className="report-action report-action--lost" type="button" disabled>
            Reportar Objeto Perdido
          </button>
          <button className="report-action report-action--found" type="button" disabled>
            Reportar Encontrado
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span>Mis Reportes</span>
          <strong>{loading ? "—" : myReports.length}</strong>
          <small>
            {loading
              ? "Cargando..."
              : `${myReports.filter((report) => report.tipo === "perdido").length} perdidos / ${
                  myReports.filter((report) => report.tipo === "encontrado").length
                } encontrados`}
          </small>
        </article>
        <article className="stat-card">
          <span>Coincidencias Activas</span>
          <strong className="stat-card__accent">—</strong>
          <small>Esta función estará disponible próximamente</small>
        </article>
        <article className="stat-card">
          <span>Total Recuperado</span>
          <strong className="stat-card__success">{loading ? "—" : recoveredCount}</strong>
          <small>Reportes propios resueltos</small>
        </article>
      </div>

      <section className="activity-card">
        <div className="activity-card__header">
          <h2>Actividad Reciente del Campus</h2>
          <button className="text-button text-button--danger" type="button" disabled>
            Ver todo
          </button>
        </div>

        {error ? <ErrorState message={error} onRetry={loadDashboard} /> : null}
        {loading ? <LoadingState message="Cargando actividad..." /> : null}

        {!loading && !error && reports.length === 0 ? (
          <div className="empty-state">Todavía no hay reportes visibles.</div>
        ) : null}

        {!loading && !error && reports.length > 0 ? (
          <div className="table-responsive">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Objeto</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th>Ubicación</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.idReporte}>
                    <td>
                      <span className="object-icon">
                        <img src="/assets/archive-dashboard.svg" alt="" />
                      </span>
                      <strong>{report.nombreObjeto}</strong>
                    </td>
                    <td>{report.categoriaObjeto?.nombreCategoria || "Sin categoría"}</td>
                    <td>
                      <span className={`status-pill status-pill--${report.tipo}`}>
                        {getReportTypeLabel(report.tipo)}
                      </span>
                    </td>
                    <td>{report.lugarCampus}</td>
                    <td>{formatDate(report.fechaEvento)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default Dashboard;
