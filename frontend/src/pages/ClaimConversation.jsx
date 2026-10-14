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
          <h1>Conversación de reclamación</h1>
          <p>{claim.reporte?.nombreObjeto} · {claimStatusLabels[claim.estado] || claim.estado}</p>
        </div>
        <Link className="claim-cancel" to="/perfil">Volver a Mi Perfil</Link>
      </div>

      {error ? <ErrorState message={error} /> : null}

      <section className="claim-conversation-card" aria-label="Mensajes de la reclamación">
        {messages.length === 0 ? (
          <p className="claim-conversation-empty">Aún no hay mensajes. Puedes iniciar la conversación para coordinar la validación y entrega.</p>
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
