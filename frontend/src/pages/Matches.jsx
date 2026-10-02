import React from "react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

function MatchReport({ report, type }) {
  const isLost = type === "perdido";

  return (
    <section className="match-report">
      {report.urlFoto ? (
        <img className="match-report__image" src={report.urlFoto} alt={report.nombreObjeto} />
      ) : (
        <div className="match-report__image match-report__image--empty">Sin foto</div>
      )}
      <div className="match-report__details">
        <span className="match-report__label">
          <span className={`object-dot ${isLost ? "lost-dot" : "found-dot"}`} />
          {isLost ? "REPORTE PERDIDO" : "REPORTE ENCONTRADO"}
        </span>
        <h3>{report.nombreObjeto}</h3>
        <p>{report.descripcionObjeto}</p>
        <dl>
          {report.categoria ? (
            <div>
              <dt>Categoría</dt>
              <dd>{report.categoria}</dd>
            </div>
          ) : null}
          <div>
            <dt>Ubicación</dt>
            <dd>{report.lugarCampus}</dd>
          </div>
          <div>
            <dt>Fecha</dt>
            <dd>{formatDate(report.fechaEvento)}</dd>
          </div>
          {!isLost && report.reportante ? (
            <div>
              <dt>Reportado por</dt>
              <dd>{report.reportante}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </section>
  );
}

function MatchCard({ match }) {
  return (
    <article className="match-card">
      <div className="match-header">
        <h2>Posible coincidencia</h2>
        <span className="similarity-badge">
          Similitud {Number(match.similitud).toFixed(2)}%
        </span>
      </div>

      <div className="match-content">
        <MatchReport report={match.perdido} type="perdido" />
        <div className="match-score" aria-label={`Similitud ${match.similitud}%`}>
          <div className="score-circle">
            <span>{Math.round(match.similitud)}%</span>
          </div>
          <p>similitud</p>
        </div>
        <MatchReport report={match.encontrado} type="encontrado" />
      </div>

      <div className="match-actions">
        <Link className="review-button" to={`/objetos/${match.encontrado.idReporte}`}>
          Ver reporte encontrado
        </Link>
      </div>
    </article>
  );
}

function Matches() {
  const { session } = useAuth();
  const [matches, setMatches] = useState([]);
  const [reportsConsulted, setReportsConsulted] = useState(null);
  const [minimumSimilarity, setMinimumSimilarity] = useState("25");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMatches = useCallback(
    async (threshold = 25) => {
      if (!session?.access_token) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await apiRequest(
          `/reportes/mis-coincidencias?umbralMinimo=${encodeURIComponent(threshold)}`,
          { accessToken: session.access_token }
        );
        setMatches(response.resultados || []);
        setReportsConsulted(response.reportesConsultados || 0);
      } catch (loadError) {
        setError(loadError.message || "No se pudieron cargar las coincidencias.");
      } finally {
        setLoading(false);
      }
    },
    [session?.access_token]
  );

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  function handleThresholdSubmit(event) {
    event.preventDefault();
    const threshold = Number(minimumSimilarity);

    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
      setError("El umbral debe ser un número entre 0 y 100.");
      return;
    }

    loadMatches(threshold);
  }

  return (
    <div className="matches-page">
      <div className="matches-page-header">
        <div>
          <h1>Coincidencias Detectadas</h1>
          <p>
            Candidatos encontrados al comparar tus reportes perdidos activos con
            reportes encontrados. La similitud no confirma que sean el mismo objeto.
          </p>
        </div>
        <div className="algorithm-badge">Motor semántico CLIP</div>
      </div>

      <form className="matches-controls" onSubmit={handleThresholdSubmit}>
        <label htmlFor="minimum-similarity">
          Similitud mínima (%)
          <input
            id="minimum-similarity"
            type="number"
            min="0"
            max="100"
            step="1"
            value={minimumSimilarity}
            onChange={(event) => setMinimumSimilarity(event.target.value)}
          />
        </label>
        <button className="review-button" type="submit" disabled={loading}>
          {loading ? "Buscando..." : "Actualizar búsqueda"}
        </button>
      </form>

      {error ? <ErrorState message={error} onRetry={() => loadMatches(Number(minimumSimilarity))} /> : null}
      {loading ? <LoadingState message="Buscando coincidencias para tus reportes..." /> : null}

      {!loading && !error ? (
        <>
          <div className="matches-summary">
            <div className="summary-icon">✓</div>
            <div>
              <strong>{matches.length} candidatos encontrados</strong>
              <span>
                {reportsConsulted} reportes perdidos activos consultados con un
                umbral mínimo de {minimumSimilarity}%.
              </span>
            </div>
          </div>

          {reportsConsulted === 0 ? (
            <div className="empty-matches">
              <h2>No tienes reportes perdidos activos</h2>
              <p>Crea un reporte de objeto perdido para buscar candidatos.</p>
              <Link className="review-button" to="/reportar/perdido">
                Crear reporte perdido
              </Link>
            </div>
          ) : matches.length === 0 ? (
            <div className="empty-matches">
              <h2>No hay candidatos sobre este umbral</h2>
              <p>
                No se encontraron reportes encontrados con similitud igual o
                superior a {minimumSimilarity}%. Puedes probar con un umbral menor.
              </p>
            </div>
          ) : (
            <div className="matches-list">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

export default Matches;
