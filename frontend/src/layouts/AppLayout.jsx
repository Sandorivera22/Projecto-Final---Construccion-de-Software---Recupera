import React from "react";
import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";

const navigation = [
  { label: "Dashboard", icon: "/assets/house.svg", to: "/dashboard" },
  { label: "Mis objetos", icon: "/assets/folder.svg", to: "/mis-objetos" },
  { label: "Buscar objetos", icon: "/assets/search.svg" },
  { label: "Coincidencias", icon: "/assets/refresh.svg", badge: 3 },
  { label: "Mi Perfil", icon: "/assets/user.svg" },
  { label: "Administración", icon: "/assets/settings.svg" },
];

function getInitials(name, email) {
  const source = name || email || "U";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function AppLayout({ children }) {
  const { profile, session, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const displayName = profile?.nombreCompleto || session?.user?.email || "Usuario";
  const initials = useMemo(
    () => getInitials(profile?.nombreCompleto, session?.user?.email),
    [profile?.nombreCompleto, session?.user?.email]
  );

  async function handleSignOut() {
    setIsSigningOut(true);
    setSignOutError("");
    try {
      await signOut();
    } catch (error) {
      setSignOutError(error.message || "No se pudo cerrar la sesión.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Logo compact />
        <div className="app-header__search">
          <img src="/assets/search.svg" alt="" />
          <input aria-label="Buscar objetos" placeholder="Buscar laptop, carnet, llaves..." />
        </div>
        <div className="app-header__user">
          <button className="notification-button" type="button" aria-label="Notificaciones">
            <img src="/assets/bell.svg" alt="" />
            <img className="notification-button__dot" src="/assets/dot.svg" alt="" />
          </button>
          <button
            className="user-summary"
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            title="Cerrar sesión"
          >
            <span className="avatar">{initials}</span>
            <span className="user-summary__copy">
              <strong>{displayName}</strong>
              <small>{profile?.rol?.nombreRol || "Usuario"}</small>
            </span>
          </button>
        </div>
      </header>

      {signOutError ? <div className="app-notice">{signOutError}</div> : null}

      <div className="app-workspace">
        <aside className="app-sidebar">
          <nav aria-label="Navegación principal">
            {navigation.map((item) => (
              <NavLink
                key={item.label}
                to={item.to || "/dashboard"}
                className={({ isActive }) => `app-nav-item ${isActive ? "app-nav-item--active" : ""} ${
                  !item.to ? "app-nav-item--disabled" : ""
                }`}
                onClick={(event) => {
                  if (!item.to) {
                    event.preventDefault();
                  }
                }}
                aria-disabled={!item.to}
              >
                <img src={item.icon} alt="" />
                <span>{item.label}</span>
                {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

export default AppLayout;
