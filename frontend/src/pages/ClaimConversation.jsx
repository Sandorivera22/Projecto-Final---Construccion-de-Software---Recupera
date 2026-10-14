import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

const closedStatuses = ["rechazada", "completada"];

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("es-DO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "";
}

function getInitials(name) {
  return (name || "Usuario")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default function ClaimConversation() {
  const { id } = useParams();
  const { profile, session } = useAuth();
  const [claim, setClaim] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function loadConversation() {
    setLoading(true);
    setError("");
    try {
      const [claimResponse, messagesResponse] = await Promise.all([
        apiRequest(`/reclamaciones/${id}`, { accessToken: session.access_token }),
        apiRequest(`/reclamaciones/${id}/mensajes`, { accessToken: session.access_token }),
      ]);
      setClaim(claimResponse);
      setMessages(messagesResponse || []);
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar la conversación.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConversation();
  }, [id, session.access_token]);

  async function handleSubmit(event) {
    event.preventDefault();
    const content = message.trim();
    if (!content || sending || closedStatuses.includes(claim?.estado)) return;

    setSending(true);
    setError("");
    try {
      const createdMessage = await apiRequest(`/reclamaciones/${id}/mensajes`, {
        accessToken: session.access_token,
        method: "POST",
        body: JSON.stringify({ contenido: content }),
      });
      setMessages((current) => [...current, createdMessage]);
      setMessage("");
    } catch (sendError) {
      setError(sendError.message || "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <LoadingState message="Cargando conversación..." />;
  if (error && !claim) return <div className="claim-page"><ErrorState message={error} onRetry={loadConversation} /></div>;

  const isClosed = closedStatuses.includes(claim.estado);
  const claimant = claim.usuario;
  const reporter = claim.reporte?.usuario;
  const isClaimant = String(claimant?.idUsuario) === String(profile?.idUsuario);
  const isReporter = String(reporter?.idUsuario) === String(profile?.idUsuario);
  const isStaffViewer = !isClaimant && !isReporter;
  const otherParticipant = isClaimant ? reporter : claimant;
  const otherParticipantName = otherParticipant?.nombreCompleto || "Usuario del campus";
  const claimStatusLabels = {
    pendiente: "Pendiente de revisión",
    en_revision: "En revisión",
    aprobada: "Aprobada",
    rechazada: "Rechazada",
    completada: "Entrega completada",
  };

  return (
    <div className="claim-page">
      <div className="claim-header claim-conversation-header">
        <div>
          <span className="claim-page-eyebrow">Seguimiento de reclamación</span>
          <h1>Conversación</h1>
        </div>
        <Link className="claim-cancel" to="/reclamaciones">Volver a Reclamaciones</Link>
      </div>

      {error ? <ErrorState message={error} /> : null}

      <section className="claim-conversation-summary" aria-label="Participantes y objeto de la reclamación">
        <span className="claim-conversation-avatar" aria-hidden="true">
          {isStaffViewer ? "RC" : getInitials(otherParticipantName)}
        </span>
        <div className="claim-conversation-summary__copy">
          <span>{isStaffViewer ? "Participantes de la conversación" : "Estás conversando con"}</span>
          {isStaffViewer ? (
            <strong>{claimant?.nombreCompleto || "Reclamante"} y {reporter?.nombreCompleto || "Reportante"}</strong>
          ) : (
            <strong>{otherParticipantName}</strong>
          )}
          <p>
            Sobre <b>{claim.reporte?.nombreObjeto || "el objeto reportado"}</b>
            {claim.reporte?.lugarCampus ? ` · ${claim.reporte.lugarCampus}` : ""}
          </p>
        </div>
        <span className={`claim-conversation-status claim-conversation-status--${claim.estado}`}>
          {claimStatusLabels[claim.estado] || claim.estado}
        </span>
      </section>

      {isStaffViewer ? (
        <div className="claim-conversation-participants">
          <span><b>Reclamante:</b> {claimant?.nombreCompleto || "No disponible"}</span>
          <span><b>Reportante:</b> {reporter?.nombreCompleto || "No disponible"}</span>
        </div>
      ) : null}

      <section className="claim-conversation-card" aria-label="Mensajes de la reclamación">
        <div className="claim-conversation-card__heading">
          <div>
            <h2>Mensajes</h2>
            <p>Coordina la validación y la entrega del objeto por este canal.</p>
          </div>
        </div>
        {messages.length === 0 ? (
          <div className="claim-conversation-empty">
            <strong>Aún no hay mensajes</strong>
            <p>
              {isStaffViewer
                ? "Puedes escribir a las personas involucradas para ayudar a coordinar la revisión y entrega."
                : `Inicia la conversación con ${otherParticipantName} para coordinar la validación y entrega.`}
            </p>
          </div>
        ) : (
          <ol className="claim-message-list">
            {messages.map((item) => {
              const isOwnMessage = String(item.idUsuario) === String(profile?.idUsuario);
              return (
                <li className={`claim-message ${isOwnMessage ? "claim-message--own" : ""}`} key={item.idMensaje}>
                  <div className="claim-message__meta">
                    <strong>{isOwnMessage ? "Tú" : item.usuario?.nombreCompleto || "Participante"}</strong>
                    <time dateTime={item.fechaEnvio}>{formatDate(item.fechaEnvio)}</time>
                  </div>
                  <p>{item.contenido}</p>
                </li>
              );
            })}
          </ol>
        )}

        {isClosed ? (
          <p className="claim-conversation-closed">Esta conversación está cerrada porque la reclamación fue {claim.estado === "rechazada" ? "rechazada" : "completada"}.</p>
        ) : (
          <form className="claim-message-form" onSubmit={handleSubmit}>
            <label htmlFor="claim-message">Escribe un mensaje</label>
            <textarea
              id="claim-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={2000}
              rows={3}
              required
            />
            <button className="claim-submit" type="submit" disabled={sending || !message.trim()}>
              {sending ? "Enviando..." : "Enviar mensaje"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
