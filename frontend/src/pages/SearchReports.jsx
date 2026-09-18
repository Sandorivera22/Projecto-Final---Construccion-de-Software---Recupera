import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

const PAGE_SIZE = 6;
const typeLabels = { perdido: "Perdido", encontrado: "Encontrado" };
const statusLabels = {
  activo: "Activo",
  en_proceso: "En revisión",
  resuelto: "Recuperado",
  retirado: "Retirado",
};

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("es-DO", { dateStyle: "medium" }).format(new Date(value))
    : "Sin fecha";
}

function SearchReports() {
  const { session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPaginas: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");

  const filters = useMemo(
    () => ({
      busqueda: searchParams.get("busqueda") || "",
      tipo: searchParams.get("tipo") || "",
      idCategoriaObjeto: searchParams.get("categoria") || "",
      estado: searchParams.get("estado") || "",
      page: Number(searchParams.get("page") || 1),
    }),
    [searchParams]
  );

  const updateFilters = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries({ ...updates, page: updates.page || 1 }).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next);
  };

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ page: filters.page, pageSize: PAGE_SIZE });
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== "page") query.set(key === "idCategoriaObjeto" ? "idCategoriaObjeto" : key, value);
    });
    try {
      const response = await apiRequest(`/reportes?${query}`, { accessToken: session.access_token });
      setReports(response.data || []);
      setPagination(response.paginacion || { page: filters.page, totalPaginas: 0, total: 0 });
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar los objetos.");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [filters, session.access_token]);

  useEffect(() => {
    async function loadCategories() {
      try {
        setCategories(await apiRequest("/categorias", { accessToken: session.access_token }) || []);
      } catch (loadError) {
        setError(loadError.message || "No se pudieron cargar los filtros.");
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, [session.access_token]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const hasFilters = Object.values(filters).some((value) => value && value !== 1);

  return (
    <div className="search-page">
      <div className="search-page__heading">
        <div>
          <h1>Buscar Objetos en el Campus</h1>
          <p>Encuentra reportes de objetos perdidos y encontrados en INTEC.</p>
        </div>
      </div>

      <div className="search-toolbar">
        <div className="search-toolbar__input">
          <img src="/assets/search.svg" alt="" />
          <input
            aria-label="Buscar objetos"
            value={filters.busqueda}
            placeholder="¿Qué estás buscando? Ingresa palabras clave..."
            onChange={(event) => updateFilters({ busqueda: event.target.value })}
          />
        </div>
        <button type="button" className="primary-button search-toolbar__button" onClick={() => updateFilters({ page: 1 })}>
          Buscar ahora
        </button>
      </div>

      <div className="search-layout">
        <aside className="search-filters report-card">
          <div className="search-filters__header">
            <h2>Filtros avanzados</h2>
            {hasFilters ? <button type="button" onClick={() => setSearchParams({})}>Limpiar</button> : null}
          </div>
          <fieldset>
            <legend>Estado de reporte</legend>
            {[
              ["", "Todos"],
              ["perdido", "Perdidos"],
              ["encontrado", "Encontrados"],
            ].map(([value, label]) => (
              <label key={label}><input type="radio" name="tipo" checked={filters.tipo === value} onChange={() => updateFilters({ tipo: value })} /> {label}</label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Categoría</legend>
            <select value={filters.idCategoriaObjeto} disabled={loadingCategories} onChange={(event) => updateFilters({ idCategoriaObjeto: event.target.value })}>
              <option value="">Todas las categorías</option>
              {categories.map((category) => <option key={category.idCategoriaObjeto} value={category.idCategoriaObjeto}>{category.nombreCategoria}</option>)}
            </select>
          </fieldset>
          <fieldset>
            <legend>Estado actual</legend>
            <select value={filters.estado} onChange={(event) => updateFilters({ estado: event.target.value })}>
              <option value="">Todos los estados</option>
              {Object.entries(statusLabels).filter(([value]) => value !== "retirado").map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </fieldset>
        </aside>

        <section className="search-results">
          <div className="search-results__heading">
            <h2>Resultados <span>({pagination.total || 0} objetos encontrados)</span></h2>
            {pagination.total > 0 ? <span>Más recientes primero</span> : null}
          </div>
          {error ? <ErrorState message={error} onRetry={loadReports} /> : null}
          {loading ? <LoadingState message="Buscando objetos..." /> : null}
          {!loading && !error && reports.length === 0 ? (
            <div className="search-empty report-card">
              <img src="/assets/archive-dashboard.svg" alt="" />
              <h3>{hasFilters ? "No encontramos objetos con esos filtros" : "Todavía no hay objetos reportados"}</h3>
              <p>{hasFilters ? "Prueba con otros términos o limpia los filtros para ver más resultados." : "Los reportes publicados aparecerán aquí."}</p>
              {hasFilters ? <button type="button" className="secondary-button" onClick={() => setSearchParams({})}>Limpiar filtros</button> : null}
            </div>
          ) : null}
          {!loading && !error && reports.length > 0 ? (
            <div className="report-grid">
              {reports.map((report) => (
                <article className="search-report-card" key={report.idReporte}>
                  <div className="search-report-card__image">
                    <img src={report.urlFoto || "/assets/campus-banner.jpeg"} alt="" />
                  </div>
                  <div className="search-report-card__body">
                    <div className="search-report-card__tags">
                      <span>{report.categoriaObjeto?.nombreCategoria || "Sin categoría"}</span>
                      <strong className={`status-pill status-pill--${report.tipo}`}>{typeLabels[report.tipo]}</strong>
                    </div>
                    <h3>{report.nombreObjeto}</h3>
                    <p><span>⌖</span> {report.lugarCampus}</p>
                    <p><span>◷</span> {formatDate(report.fechaEvento)}</p>
                    <Link className="secondary-button" to={`/objetos/${report.idReporte}`}>Ver detalles</Link>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          {!loading && pagination.totalPaginas > 1 ? (
            <nav className="pagination" aria-label="Paginación de resultados">
              <button type="button" disabled={filters.page <= 1} onClick={() => updateFilters({ page: filters.page - 1 })}>Anterior</button>
              {Array.from({ length: pagination.totalPaginas }, (_, index) => index + 1).map((page) => (
                <button type="button" className={page === filters.page ? "pagination__active" : ""} key={page} onClick={() => updateFilters({ page })}>{page}</button>
              ))}
              <button type="button" disabled={filters.page >= pagination.totalPaginas} onClick={() => updateFilters({ page: filters.page + 1 })}>Siguiente</button>
            </nav>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default SearchReports;
