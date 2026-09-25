import React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
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

function getInitials(name, email) {
  const source = name || email || "U";

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function Profile() {
  const {
    profile,
    session,
    refreshProfile,
    signOut,
  } = useAuth();

  const [reports, setReports] = useState([]);
  const [claims, setClaims] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const [form, setForm] = useState({
    nombreCompleto: "",
    idInstitucional: "",
    telefono: "",
  });

  const loadProfileData = useCallback(async () => {
    if (!session?.access_token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [reportsResponse, claimsResponse] = await Promise.all([
        apiRequest("/reportes/mios", {
          accessToken: session.access_token,
        }),

        apiRequest("/reclamaciones/mias", {
          accessToken: session.access_token,
        }),
      ]);

      setReports(reportsResponse || []);
      setClaims(claimsResponse || []);
    } catch (loadError) {
      setError(
        loadError.message ||
          "No se pudo cargar la información del perfil."
      );
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  useEffect(() => {
    setForm({
      nombreCompleto: profile?.nombreCompleto || "",
      idInstitucional: profile?.idInstitucional || "",
      telefono: profile?.telefono || "",
    });
  }, [profile]);

  const displayName =
    profile?.nombreCompleto ||
    session?.user?.email ||
    "Usuario";

  const email =
    profile?.correo ||
    session?.user?.email ||
    "No disponible";

  const initials = useMemo(
    () =>
      getInitials(
        profile?.nombreCompleto,
        session?.user?.email
      ),
    [profile?.nombreCompleto, session?.user?.email]
  );

  const lostReports = reports.filter(
    (report) => report.tipo === "perdido"
  );

  const foundReports = reports.filter(
    (report) => report.tipo === "encontrado"
  );

  const recoveredLostReports = lostReports.filter(
    (report) => report.estado === "resuelto"
  );

  /*
   * Esta tasa se calcula únicamente con datos reales:
   * reportes perdidos resueltos / reportes perdidos.
   */
  const recoveryRate =
    lostReports.length > 0
      ? Math.round(
          (recoveredLostReports.length / lostReports.length) *
            100
        )
      : 0;

  const recentReports = reports.slice(0, 5);

  function handleEdit() {
    setSaveError("");
    setSaveSuccess("");
    setEditing(true);
  }

  function handleCancelEdit() {
    setForm({
      nombreCompleto: profile?.nombreCompleto || "",
      idInstitucional: profile?.idInstitucional || "",
      telefono: profile?.telefono || "",
    });

    setSaveError("");
    setEditing(false);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!session?.access_token) {
      return;
    }

    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const updatedProfile = await apiRequest(
        "/usuarios/me",
        {
          accessToken: session.access_token,
          method: "PATCH",
          body: JSON.stringify({
            nombreCompleto:
              form.nombreCompleto.trim(),

            idInstitucional:
              form.idInstitucional.trim() || null,

            telefono:
              form.telefono.trim() || null,
          }),
        }
      );

      /*
       * Actualizamos el profile global del AuthContext
       * para que también cambien los datos del header/sidebar.
       */
      await refreshProfile();

      setForm({
        nombreCompleto:
          updatedProfile?.nombreCompleto ||
          form.nombreCompleto.trim(),

        idInstitucional:
          updatedProfile?.idInstitucional || "",

        telefono:
          updatedProfile?.telefono || "",
      });

      setEditing(false);
      setSaveSuccess(
        "Perfil actualizado correctamente."
      );
    } catch (saveRequestError) {
      setSaveError(
        saveRequestError.message ||
          "No se pudo actualizar el perfil."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
    } catch (signOutError) {
      setError(
        signOutError.message ||
          "No se pudo cerrar la sesión."
      );
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-heading">
        <div>
          <h1>Mi Perfil Universitario</h1>

          <p>
            Administra tus datos institucionales y
            consulta tu actividad en Recupera.
          </p>
        </div>
      </div>

      {error ? (
        <ErrorState
          message={error}
          onRetry={loadProfileData}
        />
      ) : null}

      {saveSuccess ? (
        <div className="profile-feedback profile-feedback--success">
          {saveSuccess}
        </div>
      ) : null}

      <div className="profile-layout">
        {/* PERFIL */}
        <section className="profile-card profile-card--identity">
          <div className="profile-avatar">
            {initials}
          </div>

          <h2>{displayName}</h2>

          <p className="profile-role">
            {profile?.rol?.nombreRol || "Usuario"}
          </p>

          {!editing ? (
            <>
              <div className="profile-information">
                <div className="profile-information__item">
                  <span>
                    Correo institucional
                  </span>

                  <strong>{email}</strong>
                </div>

                <div className="profile-information__item">
                  <span>ID institucional</span>

                  <strong>
                    {profile?.idInstitucional ||
                      "No registrado"}
                  </strong>
                </div>

                <div className="profile-information__item">
                  <span>Teléfono</span>

                  <strong>
                    {profile?.telefono ||
                      "No registrado"}
                  </strong>
                </div>

                <div className="profile-information__item">
                  <span>Estado</span>

                  <strong>
                    {profile?.estado
                      ? "Activo"
                      : "Inactivo"}
                  </strong>
                </div>
              </div>

              <div className="profile-actions">
                <button
                  className="profile-primary-button"
                  type="button"
                  onClick={handleEdit}
                >
                  Editar perfil
                </button>

                <button
                  className="profile-secondary-button"
                  type="button"
                  onClick={handleSignOut}
                >
                  Cerrar sesión
                </button>
              </div>
            </>
          ) : (
            <form
              className="profile-edit-form"
              onSubmit={handleSave}
            >
              <div className="profile-form-field">
                <label htmlFor="profile-nombre">
                  Nombre completo
                </label>

                <input
                  id="profile-nombre"
                  name="nombreCompleto"
                  value={form.nombreCompleto}
                  onChange={handleChange}
                  minLength={2}
                  maxLength={150}
                  required
                />
              </div>

              <div className="profile-form-field">
                <label htmlFor="profile-id">
                  ID institucional
                </label>

                <input
                  id="profile-id"
                  name="idInstitucional"
                  value={form.idInstitucional}
                  onChange={handleChange}
                  inputMode="numeric"
                  pattern="[0-9]{7}"
                  maxLength={7}
                  placeholder="7 dígitos"
                />
              </div>

              <div className="profile-form-field">
                <label htmlFor="profile-phone">
                  Teléfono
                </label>

                <input
                  id="profile-phone"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  maxLength={20}
                  placeholder="809-000-0000"
                />
              </div>

              <p className="profile-readonly-note">
                El correo y el rol son administrados por
                la autenticación y no se modifican desde
                este formulario.
              </p>

              {saveError ? (
                <div className="profile-feedback profile-feedback--error">
                  {saveError}
                </div>
              ) : null}

              <div className="profile-actions">
                <button
                  className="profile-primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Guardando..."
                    : "Guardar cambios"}
                </button>

                <button
                  className="profile-secondary-button"
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </section>

        <div className="profile-main">
          {/* ESTADÍSTICAS */}
          <section className="profile-stats">
            <article className="profile-stat-card">
              <span>
                Reportes de objetos perdidos
              </span>

              <strong>
                {loading ? "—" : lostReports.length}
              </strong>

              <small>
                Reportes creados por ti
              </small>
            </article>

            <article className="profile-stat-card">
              <span>
                Reportes encontrados
              </span>

              <strong className="profile-stat-card__blue">
                {loading ? "—" : foundReports.length}
              </strong>

              <small>
                Objetos encontrados reportados
              </small>
            </article>

            <article className="profile-stat-card">
              <span>
                Tasa de recuperación
              </span>

              <strong className="profile-stat-card__green">
                {loading
                  ? "—"
                  : `${recoveryRate}%`}
              </strong>

              <small>
                {recoveredLostReports.length} de{" "}
                {lostReports.length} reportes perdidos
                recuperados
              </small>
            </article>
          </section>

          {/* HISTORIAL */}
          <section className="profile-history">
            <div className="profile-history__header">
              <div>
                <h2>
                  Historial de mis reportes
                </h2>

                <p>
                  Información obtenida directamente
                  de tu cuenta.
                </p>
              </div>

              <Link
                to="/mis-objetos"
                className="profile-history__link"
              >
                Ver todos
              </Link>
            </div>

            {loading ? (
              <LoadingState message="Cargando tu actividad..." />
            ) : null}

            {!loading &&
            !error &&
            recentReports.length === 0 ? (
              <div className="profile-empty">
                <img
                  src="/assets/archive-dashboard.svg"
                  alt=""
                />

                <p>
                  Aún no tienes reportes registrados.
                </p>

                <Link to="/reportar/perdido">
                  Crear un reporte
                </Link>
              </div>
            ) : null}

            {!loading &&
            !error &&
            recentReports.length > 0 ? (
              <div className="profile-history__table-wrapper">
                <table className="profile-history__table">
                  <thead>
                    <tr>
                      <th>Objeto</th>
                      <th>Categoría</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                      <th>Ubicación</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentReports.map(
                      (report) => (
                        <tr key={report.idReporte}>
                          <td>
                            <span className="object-icon">
                              <img
                                src="/assets/archive-dashboard.svg"
                                alt=""
                              />
                            </span>

                            <strong>
                              {report.nombreObjeto}
                            </strong>
                          </td>

                          <td>
                            {report
                              .categoriaObjeto
                              ?.nombreCategoria ||
                              "Sin categoría"}
                          </td>

                          <td>
                            <span
                              className={`profile-type-pill profile-type-pill--${report.tipo}`}
                            >
                              {report.tipo ===
                              "encontrado"
                                ? "Encontrado"
                                : "Perdido"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`profile-status-pill profile-status-pill--${report.estado}`}
                            >
                              {statusLabels[
                                report.estado
                              ] ||
                                report.estado ||
                                "Sin estado"}
                            </span>
                          </td>

                          <td>
                            {report.lugarCampus ||
                              "Sin ubicación"}
                          </td>

                          <td>
                            {formatDate(
                              report.fechaEvento
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>

          {/* RECLAMACIONES */}
          <section className="profile-claims-card">
            <div>
              <span className="profile-claims-card__label">
                Reclamaciones realizadas
              </span>

              <strong>
                {loading ? "—" : claims.length}
              </strong>

              <p>
                Solicitudes de reclamación asociadas
                a tu cuenta.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Profile;