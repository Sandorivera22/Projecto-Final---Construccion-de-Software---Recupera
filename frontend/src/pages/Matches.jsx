import { useState } from "react";
import { useNavigate } from "react-router-dom";

function MatchCard({ match, onDiscard, onReview }) {
  const [discarded, setDiscarded] = useState(false);

  if (discarded) return null;

  return (
    <div className="match-card">
      <div className="match-header">
        <div>
          <h3>Coincidencia automática #{match.id}</h3>

          <span
            className={`similarity-badge ${match.level?.toLowerCase()}`}
          >
            Similitud {match.level} ({match.similarity}%)
          </span>
        </div>
      </div>

      <div className="match-content">
        {/* OBJETO PERDIDO */}
        <div className="object-section">
          <div className="section-label">
            <span className="object-dot lost-dot"></span>
            OBJETO PERDIDO
          </div>

          <h4>{match.lost.name}</h4>

          <p>
            <strong>Por:</strong> {match.lost.person}
          </p>

          <p>
            <strong>Ubicación:</strong> {match.lost.location}
          </p>

          <p>
            <strong>Reportado:</strong> {match.lost.date}
          </p>
        </div>

        {/* PORCENTAJE */}
        <div className="match-score">
          <div className="score-circle">
            <span>{match.similarity}%</span>
          </div>

          <p>coincidencia</p>
        </div>

        {/* OBJETO ENCONTRADO */}
        <div className="object-section">
          <div className="section-label">
            <span className="object-dot found-dot"></span>
            OBJETO ENCONTRADO
          </div>

          <h4>{match.found.name}</h4>

          <p>
            <strong>Por:</strong> {match.found.person}
          </p>

          <p>
            <strong>Ubicación:</strong> {match.found.location}
          </p>

          <p>
            <strong>Encontrado:</strong> {match.found.date}
          </p>
        </div>
      </div>

      <div className="match-actions">
        <button
          className="review-button"
          onClick={() => onReview(match)}
        >
          Revisar Coincidencia
        </button>

        <button
          className="discard-button"
          onClick={() => {
            setDiscarded(true);
            onDiscard(match);
          }}
        >
          Descartar
        </button>
      </div>
    </div>
  );
}

export default function Matches() {
  const navigate = useNavigate();

  // Temporalmente vacío.
  // Cuando exista el endpoint del backend,
  // aquí cargaremos las coincidencias reales.
  const [matches, setMatches] = useState([
  {
    id: "TEST-001",
    level: "Alta",
    similarity: 92,

    lost: {
      name: "Laptop de prueba",
      person: "Usuario de prueba",
      location: "Biblioteca",
      date: "Hace 2 horas",
    },

    found: {
      name: "Laptop encontrada",
      person: "Personal de seguridad",
      location: "Oficina de objetos encontrados",
      date: "Hace 1 hora",
    },
  },
]);

  const handleDiscard = (match) => {
    setMatches((current) =>
      current.filter((item) => item.id !== match.id)
    );
  };

  const handleReview = (match) => {
    navigate("/reclamacion", {
      state: {
        match,
      },
    });
  };

  return (
    <div className="matches-page">
      <div className="matches-page-header">
        <div>
          <h1>Coincidencias Detectadas</h1>

          <p>
            Comparamos automáticamente características, fechas y ubicaciones
            de reportes de objetos perdidos vs. encontrados.
          </p>
        </div>

        <div className="algorithm-badge">
          ✨ Algoritmo Recupera+
        </div>
      </div>

      <div className="matches-summary">
        <div className="summary-icon">✓</div>

        <div>
          <strong>
            {matches.length} coincidencias detectadas
          </strong>

          <span>
            Las posibles coincidencias entre objetos perdidos y encontrados
            aparecerán aquí.
          </span>
        </div>
      </div>

      <div className="matches-list">
        {matches.length > 0 ? (
          matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onDiscard={handleDiscard}
              onReview={handleReview}
            />
          ))
        ) : (
          <div className="empty-matches">
            <div className="empty-icon">✓</div>

            <h3>No hay coincidencias disponibles</h3>

            <p>
              Cuando el sistema detecte una posible coincidencia,
              aparecerá en esta sección.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}