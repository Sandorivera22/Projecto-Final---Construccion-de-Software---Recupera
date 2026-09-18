import React from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ErrorState from "../components/ErrorState";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";

const INTEC_EMAIL_PATTERN = /^[^\s@]+@intec\.edu\.do$/i;

function Register() {
  const navigate = useNavigate();
  const { session, signUp, configurationError } = useAuth();
  const [form, setForm] = useState({
    nombreCompleto: "",
    correo: "",
    idInstitucional: "",
    password: "",
    passwordConfirmation: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, session]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!INTEC_EMAIL_PATTERN.test(form.correo)) {
      setError("Usa un correo institucional con dominio @intec.edu.do.");
      return;
    }

    if (form.password !== form.passwordConfirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await signUp({
        email: form.correo,
        password: form.password,
        nombreCompleto: form.nombreCompleto,
        idInstitucional: form.idInstitucional,
      });

      if (data.session) {
        navigate("/dashboard", { replace: true });
      } else {
        setNotice("Cuenta creada. Revisa tu correo institucional para confirmar el registro.");
        setForm((current) => ({
          ...current,
          password: "",
          passwordConfirmation: "",
        }));
      }
    } catch (submitError) {
      setError(submitError.message || "No se pudo crear la cuenta.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-hero auth-hero--register">
        <div className="auth-hero__overlay" />
        <div className="auth-hero__content">
          <Logo inverse />
          <div className="auth-hero__message">
            <h1>Recupera tus pertenencias de forma sencilla.</h1>
            <p>
              Crea tu cuenta institucional para reportar, buscar y coordinar la devolución
              de objetos dentro del campus.
            </p>
          </div>
          <p className="auth-hero__copyright">
            © 2024 Instituto Tecnológico de Santo Domingo - INTEC
          </p>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrapper auth-form-wrapper--register">
          <div className="auth-form-header">
            <h2>Crea tu Cuenta</h2>
            <p>Regístrate con tus datos de estudiante o docente</p>
          </div>

          {configurationError ? <ErrorState message={configurationError} /> : null}
          {error ? <ErrorState message={error} /> : null}
          {notice ? <div className="alert alert-success">{notice}</div> : null}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="register-name">Nombre Completo</label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                placeholder="Escribe tu nombre y apellido"
                value={form.nombreCompleto}
                onChange={(event) => updateField("nombreCompleto", event.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="register-email">Correo Institucional</label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="nombre.apellido@intec.edu.do"
                value={form.correo}
                onChange={(event) => updateField("correo", event.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="register-id">Matrícula o ID institucional</label>
              <input
                id="register-id"
                type="text"
                autoComplete="username"
                placeholder="1120000"
                value={form.idInstitucional}
                onChange={(event) => updateField("idInstitucional", event.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="register-password">Contraseña</label>
              <div className="password-field">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Crea una contraseña segura"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <img src="/assets/eye.svg" alt="" />
                </button>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="register-confirm-password">Confirmar Contraseña</label>
              <input
                id="register-confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repite tu contraseña"
                value={form.passwordConfirmation}
                onChange={(event) => updateField("passwordConfirmation", event.target.value)}
                required
              />
            </div>

            <button className="primary-button w-100" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando cuenta..." : "Crear mi cuenta"}
            </button>
          </form>

          <p className="auth-redirect">
            ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Register;
