import React from "react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

const statusLabels = {
  activo: "Activo",
  en_proceso: "En revisión",
  resuelto: "Recuperado",
  retirado: "Retirado",
};

function formatDate(value) {
  return value ? new Intl.DateTimeFormat("es-DO", { dateStyle: "medium" }).format(new Date(value)) : "Sin fecha";
}

function MyReports() {
  const { session } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setReports(await apiRequest("/reportes/mios", { accessToken: session.access_token }) || []);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar tus reportes.");
    } finally {
      setLoading(false);
    }
  }, [session.access_token]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  async function retireReport(id) {
    if (!window.confirm("¿Quieres retirar este reporte?")) return;
    try {
      await apiRequest(`/reportes/${id}/retirar`, { accessToken: session.access_token, method: "POST" });
      await loadReports();
    } catch (retireError) {
      setError(retireError.message || "No se pudo retirar el reporte.");
    }
  }

  return (
    <div className="my-reports-page">
      <div className="my-reports-heading">
        <div>
          <h1>Mis Objetos Reportados</h1>
          <p>Administra los reportes que has creado. Puedes marcar objetos como recuperados al instante.</p>
        </div>
        <Link className="new-report-button" to="/reportar/perdido">Nuevo Reporte</Link>
      </div>

      {error ? <ErrorState message={error} onRetry={loadReports} /> : null}
      {loading ? <LoadingState message="Cargando tus reportes..." /> : null}
      {!loading && !error && reports.length === 0 ? (
        <div className="report-card my-reports-empty">Todavía no has creado reportes. <Link to="/reportar/perdido">Crear el primero</Link></div>
      ) : null}
      {!loading && reports.length > 0 ? (
        <div className="report-card reports-table-card">
          <div className="table-responsive">
            <table className="reports-table">
              <thead>
                <tr><th>Objeto</th><th>Categoría</th><th>Estado</th><th>Ubicación</th><th>Fecha</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.idReporte}>
                    <td><span className="object-icon"><img src="/assets/archive-dashboard.svg" alt="" /></span><strong>{report.nombreObjeto}</strong></td>
                    <td>{report.categoriaObjeto?.nombreCategoria || "Sin categoría"}</td>
                    <td><span className={`report-status report-status--${report.estado}`}>{statusLabels[report.estado] || report.estado}</span></td>
                    <td>{report.lugarCampus}</td>
                    <td>{formatDate(report.fechaEvento)}</td>
                    <td className="report-actions-cell">
                      {report.estado !== "retirado" ? <Link to={`/mis-objetos/editar/${report.idReporte}`}>Editar</Link> : null}
                      {report.estado !== "retirado" ? <button type="button" onClick={() => retireReport(report.idReporte)}>Retirar</button> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default MyReports;
