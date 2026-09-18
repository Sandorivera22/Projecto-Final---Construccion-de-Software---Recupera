import React from "react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ErrorState from "../components/ErrorState";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signIn, resetPassword, configurationError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (session) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, session]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    setIsSubmitting(true);
    try {
      await signIn(email, password);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (submitError) {
      setError(submitError.message || "No se pudo iniciar sesión.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    setError("");
    setNotice("");

    if (!email.trim()) {
      setError("Escribe tu correo para recuperar la contraseña.");
      return;
    }

    setIsResetting(true);
    try {
      await resetPassword(email);
      setNotice("Revisa tu correo institucional para continuar con la recuperación.");
    } catch (resetError) {
      setError(resetError.message || "No se pudo enviar el correo de recuperación.");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="auth-hero__overlay" />
        <div className="auth-hero__content">
          <Logo inverse />
          <div className="auth-hero__message">
            <h1>La forma más rápida de recuperar tus pertenencias.</h1>
            <p>
              Exclusivo para la comunidad académica de INTEC. Reporta objetos perdidos o
              encontrados y ayúdanos a mantener nuestro campus conectado.
            </p>
          </div>
          <p className="auth-hero__copyright">
            © 2024 Instituto Tecnológico de Santo Domingo - INTEC
          </p>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <h2>Inicia Sesión</h2>
            <p>Usa el correo asociado a tu cuenta</p>
          </div>

          {configurationError ? <ErrorState message={configurationError} /> : null}
          {error ? <ErrorState message={error} /> : null}
          {notice ? <div className="alert alert-success">{notice}</div> : null}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="login-email">Correo Electrónico</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="login-password">Contraseña</label>
              <div className="password-field">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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

            <div className="auth-form-actions">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span>Recuérdame</span>
              </label>
              <button
                className="text-button"
                type="button"
                onClick={handlePasswordReset}
                disabled={isResetting}
              >
                {isResetting ? "Enviando..." : "¿Olvidaste tu contraseña?"}
              </button>
            </div>

            <button className="primary-button w-100" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Iniciando sesión..." : "Entrar a Recupera"}
            </button>
          </form>

          <p className="auth-redirect">
            ¿No tienes una cuenta? <Link to="/register">Regístrate aquí</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
