import React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

const EMPTY_CATEGORY_FORM = { nombreCategoria: "" };

function formatRoleLabel(role) {
  if (!role) {
    return "Sin rol";
  }

  return role.nombreRol || role;
}

function Administration() {
  const { profile, session } = useAuth();
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingUserId, setSavingUserId] = useState(null);
  const [savingCategoryId, setSavingCategoryId] = useState(null);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);
  const [categoryError, setCategoryError] = useState("");
  const [categorySuccess, setCategorySuccess] = useState("");

  const isAdmin = profile?.rol?.nombreRol === "admin";

  const availableRoles = useMemo(() => {
    const roles = new Map();

    users.forEach((user) => {
      if (user?.rol) {
        roles.set(String(user.rol.idRol), user.rol.nombreRol);
      }
    });

    return [...roles.entries()].map(([idRol, nombreRol]) => ({
      idRol: Number(idRol),
      nombreRol,
    }));
  }, [users]);

  const loadAdministrationData = useCallback(async () => {
    if (!session?.access_token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [usersResponse, categoriesResponse] = await Promise.all([
        apiRequest("/usuarios", {
          accessToken: session.access_token,
        }),
        apiRequest("/categorias?soloActivas=false", {
          accessToken: session.access_token,
        }),
      ]);

      setUsers(usersResponse || []);
      setCategories(categoriesResponse || []);
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar la administración.");
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    loadAdministrationData();
  }, [loadAdministrationData]);

  async function handleUserRoleChange(userId, nextRoleId) {
    if (!session?.access_token || !nextRoleId) {
      return;
    }

    setSavingUserId(userId);

    try {
      const updatedUser = await apiRequest(`/usuarios/${userId}/rol`, {
        accessToken: session.access_token,
        method: "PATCH",
        body: JSON.stringify({ idRol: Number(nextRoleId) }),
      });

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.idUsuario === userId
            ? {
                ...user,
                idRol: updatedUser.idRol,
                rol: updatedUser.rol,
              }
            : user
        )
      );
    } catch (updateError) {
      setError(updateError.message || "No se pudo actualizar el rol del usuario.");
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleUserStatusToggle(user) {
    if (!session?.access_token) {
      return;
    }

    setSavingUserId(user.idUsuario);

    try {
      const updatedUser = await apiRequest(`/usuarios/${user.idUsuario}/estado`, {
        accessToken: session.access_token,
        method: "PATCH",
        body: JSON.stringify({ estado: !user.estado }),
      });

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.idUsuario === user.idUsuario
            ? {
                ...currentUser,
                estado: updatedUser.estado,
              }
            : currentUser
        )
      );
    } catch (updateError) {
      setError(updateError.message || "No se pudo actualizar el estado del usuario.");
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleCategorySubmit(event) {
    event.preventDefault();

    if (!session?.access_token) {
      return;
    }

    const name = categoryForm.nombreCategoria.trim();

    if (!name) {
      setCategoryError("Escribe el nombre de la categoría.");
      return;
    }

    setCategoryError("");
    setCategorySuccess("");

    try {
      const createdCategory = await apiRequest("/categorias", {
        accessToken: session.access_token,
        method: "POST",
        body: JSON.stringify({ nombreCategoria: name }),
      });

      setCategories((currentCategories) => [createdCategory, ...currentCategories]);
      setCategoryForm(EMPTY_CATEGORY_FORM);
      setCategorySuccess("Categoría creada correctamente.");
    } catch (submitError) {
      setCategoryError(submitError.message || "No se pudo crear la categoría.");
    }
  }

  async function handleCategoryStatusToggle(category) {
    if (!session?.access_token) {
      return;
    }

    setSavingCategoryId(category.idCategoriaObjeto);

    try {
      const updatedCategory = await apiRequest(`/categorias/${category.idCategoriaObjeto}`, {
        accessToken: session.access_token,
        method: "PATCH",
        body: JSON.stringify({
          nombreCategoria: category.nombreCategoria,
          estado: !category.estado,
        }),
      });

      setCategories((currentCategories) =>
        currentCategories.map((currentCategory) =>
          currentCategory.idCategoriaObjeto === category.idCategoriaObjeto
            ? updatedCategory
            : currentCategory
        )
      );
    } catch (updateError) {
      setCategoryError(updateError.message || "No se pudo actualizar la categoría.");
    } finally {
      setSavingCategoryId(null);
    }
  }

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <div className="admin-card admin-card--empty">
          <h1>Acceso restringido</h1>
          <p>No tienes permisos para administrar usuarios y categorías.</p>
        </div>
      </div>
    );
  }

  const activeUsers = users.filter((user) => user.estado !== false).length;
  const activeCategories = categories.filter((category) => category.estado !== false).length;

  return (
    <div className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="admin-eyebrow">Panel administrativo</p>
          <h1>Administración</h1>
        </div>
      </div>

      <div className="admin-overview">
        <article className="admin-stat-card">
          <span>Usuarios</span>
          <strong>{loading ? "—" : users.length}</strong>
          <small>{activeUsers} activos</small>
        </article>
        <article className="admin-stat-card admin-stat-card--accent">
          <span>Categorías</span>
          <strong>{loading ? "—" : categories.length}</strong>
          <small>{activeCategories} activas</small>
        </article>
        <article className="admin-stat-card admin-stat-card--success">
          <span>Roles activos</span>
          <strong>{loading ? "—" : availableRoles.length}</strong>
          <small>Definidos en el sistema</small>
        </article>
      </div>

      {error ? <ErrorState message={error} onRetry={loadAdministrationData} /> : null}
      {loading ? <LoadingState message="Cargando administración..." /> : null}

      {!loading && !error ? (
        <>
          <section className="admin-card">
            <div className="admin-card__header">
              <div>
                <h2>Usuarios</h2>
                <p>Gestiona permisos y estados de acceso.</p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.idUsuario}>
                      <td>
                        <div className="admin-user-cell">
                          <span className="admin-avatar">{(user.nombreCompleto || user.correo || "U").slice(0, 1).toUpperCase()}</span>
                          <div>
                            <strong>{user.nombreCompleto || "Sin nombre"}</strong>
                            <small>{user.idInstitucional || "Sin ID"}</small>
                          </div>
                        </div>
                      </td>
                      <td>{user.correo || "No disponible"}</td>
                      <td>
                        <select
                          className="admin-select"
                          value={user.idRol ?? ""}
                          onChange={(event) => handleUserRoleChange(user.idUsuario, event.target.value)}
                          disabled={savingUserId === user.idUsuario}
                        >
                          {availableRoles.length === 0 ? (
                            <option value="">Sin roles</option>
                          ) : (
                            availableRoles.map((role) => (
                              <option key={role.idRol} value={role.idRol}>
                                {role.nombreRol}
                              </option>
                            ))
                          )}
                        </select>
                      </td>
                      <td>
                        <span className={`status-pill ${user.estado === false ? "status-pill--retirado" : "status-pill--activo"}`}>
                          {user.estado === false ? "Inactivo" : "Activo"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => handleUserStatusToggle(user)}
                          disabled={savingUserId === user.idUsuario}
                        >
                          {savingUserId === user.idUsuario
                            ? "Guardando..."
                            : user.estado === false
                              ? "Activar"
                              : "Desactivar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-card__header">
              <div>
                <h2>Categorías</h2>
                <p>Actualiza la clasificación de objetos del campus.</p>
              </div>
            </div>

            <form className="admin-form" onSubmit={handleCategorySubmit}>
              <div className="admin-form__field">
                <label htmlFor="category-name">Nueva categoría</label>
                <input
                  id="category-name"
                  name="nombreCategoria"
                  value={categoryForm.nombreCategoria}
                  onChange={(event) =>
                    setCategoryForm({ nombreCategoria: event.target.value })
                  }
                  placeholder="Ej.: Computadoras"
                />
              </div>
              <button type="submit" className="primary-button admin-form__button">
                Agregar categoría
              </button>
            </form>

            {categoryError ? <div className="admin-feedback admin-feedback--error">{categoryError}</div> : null}
            {categorySuccess ? <div className="admin-feedback admin-feedback--success">{categorySuccess}</div> : null}

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Categoría</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.idCategoriaObjeto}>
                      <td>{category.nombreCategoria}</td>
                      <td>
                        <span className={`status-pill ${category.estado === false ? "status-pill--retirado" : "status-pill--activo"}`}>
                          {category.estado === false ? "Inactiva" : "Activa"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => handleCategoryStatusToggle(category)}
                          disabled={savingCategoryId === category.idCategoriaObjeto}
                        >
                          {savingCategoryId === category.idCategoriaObjeto
                            ? "Guardando..."
                            : category.estado === false
                              ? "Activar"
                              : "Desactivar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

export default Administration;
