import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

const typeLabels = { perdido: "Perdido", encontrado: "Encontrado" };
const statusLabels = { activo: "Activo", en_proceso: "En revisión", resuelto: "Recuperado", retirado: "Retirado" };

function formatDate(value) {
  return value ? new Intl.DateTimeFormat("es-DO", { dateStyle: "long" }).format(new Date(value)) : "Sin fecha";
}

function ReportDetail() {
  const { id } = useParams();
  const { profile, session } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myClaim, setMyClaim] = useState(null);
  const [loadingMyClaim, setLoadingMyClaim] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [error, setError] = useState("");

  async function loadReport() {
    setLoading(true);
    setError("");
    try {
      setReport(await apiRequest(`/reportes/${id}`, { accessToken: session.access_token }));
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar el detalle del objeto.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReport(); }, [id, session.access_token]);

  useEffect(() => {
    if (profile?.rol?.nombreRol !== "estudiante") return;

    let cancelled = false;
    async function loadMyClaim() {
      setLoadingMyClaim(true);
      setClaimError("");
      try {
        const claims = await apiRequest("/reclamaciones/mias", { accessToken: session.access_token });
        const matchingClaim = claims.find((claim) =>
          String(claim.idReporte) === String(id) &&
          ["pendiente", "en_revision", "aprobada"].includes(claim.estado)
        );
        if (!cancelled) setMyClaim(matchingClaim || null);
      } catch (loadError) {
        if (!cancelled) setClaimError(loadError.message || "No se pudo comprobar tu reclamación.");
      } finally {
        if (!cancelled) setLoadingMyClaim(false);
      }
    }

    loadMyClaim();
    return () => { cancelled = true; };
  }, [id, profile?.rol?.nombreRol, session.access_token]);

  if (loading) return <LoadingState message="Cargando detalle..." />;
  if (error) return <div className="detail-page"><ErrorState message={error} onRetry={loadReport} /><Link className="back-link" to="/buscar-objetos">← Volver a buscar objetos</Link></div>;

  const isOwner = report.usuario?.idUsuario === profile?.idUsuario;
  const canClaim = profile?.rol?.nombreRol === "estudiante" &&
    report.tipo === "encontrado" &&
    !isOwner &&
    !["resuelto", "retirado"].includes(report.estado);
  const isStaff = ["encargado", "admin"].includes(profile?.rol?.nombreRol);

  return (
    <div className="detail-page">
      <div className="detail-breadcrumb"><Link to="/buscar-objetos">Buscar objetos</Link><span>/</span>{report.nombreObjeto}</div>
      <div className="detail-layout">
        <section className="detail-gallery report-card">
          <img className="detail-gallery__main" src={report.urlFoto || "/assets/campus-banner.jpeg"} alt={report.nombreObjeto} />
          <div className="detail-gallery__caption">Imagen del reporte</div>
        </section>
        <section className="detail-content">
          <div className="detail-tags">
            <span>{report.categoriaObjeto?.nombreCategoria || "Sin categoría"}</span>
            <strong className={`status-pill status-pill--${report.tipo}`}>{typeLabels[report.tipo]}</strong>
          </div>
          <h1>{report.nombreObjeto}</h1>
          <p className="detail-meta">Reportado el {formatDate(report.fechaEvento)} · Estado: {statusLabels[report.estado] || report.estado}</p>
          <hr />
          <h2>Descripción detallada</h2>
          <p className="detail-description">{report.descripcionObjeto}</p>
          <div className="detail-facts">
            <div><span>Ubicación</span><strong>{report.lugarCampus}</strong></div>
            <div><span>Tipo de reporte</span><strong>{typeLabels[report.tipo]}</strong></div>
            <div><span>Fecha del evento</span><strong>{formatDate(report.fechaEvento)}</strong></div>
            {report.enCustodiaOficina ? <div><span>Custodia</span><strong>En oficina</strong></div> : null}
          </div>
          <section className="reporter-card">
            <h2>Información del reportante</h2>
            <div className="reporter-card__person">
              <span className="avatar">{report.usuario?.nombreCompleto?.slice(0, 2).toUpperCase() || "U"}</span>
              <div><strong>{report.usuario?.nombreCompleto || "Usuario del campus"}</strong><small>Miembro de la comunidad INTEC</small></div>
            </div>
            <p>La identidad y datos de contacto se mantienen protegidos.</p>
          </section>
          <div className="detail-actions">
            {canClaim ? (
              claimError ? (
                <ErrorState message={claimError} />
              ) : loadingMyClaim ? (
                <button type="button" className="primary-button" disabled>Comprobando reclamación...</button>
              ) : (
                <Link className="primary-button" to={myClaim ? `/reclamaciones/${myClaim.idReclamacion}/conversacion` : `/reclamacion/${report.idReporte}`}>
                  {myClaim ? "Abrir conversación" : "Reclamar objeto"}
                </Link>
              )
            ) : null}
            {isOwner ? (
              <Link className="secondary-button" to="/reclamaciones">Ver reclamaciones recibidas</Link>
            ) : null}
            {isStaff ? (
              <Link className="secondary-button" to="/reclamaciones/revision">Revisar reclamaciones</Link>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ReportDetail;
