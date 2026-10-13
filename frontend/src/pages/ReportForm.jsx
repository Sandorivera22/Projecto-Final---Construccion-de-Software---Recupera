import React from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

const emptyForm = {
  tipo: "perdido",
  idCategoriaObjeto: "",
  nombreObjeto: "",
  descripcionObjeto: "",
  lugarCampus: "",
  fechaEvento: new Date().toISOString().slice(0, 10),
  urlFoto: "",
  enCustodiaOficina: false,
  origenHallazgo: "estudiante",
  nombrePersonalLimpieza: "",
};

function ReportForm() {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [form, setForm] = useState({ ...emptyForm, tipo: type === "encontrado" ? "encontrado" : "perdido" });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [error, setError] = useState("");

  const isEditing = Boolean(id);
  const isFound = form.tipo === "encontrado";
  const title = isFound ? "Reportar Objeto Encontrado" : "Reportar Objeto Perdido";
  const subtitle = isFound
    ? "¿Encontraste algo en INTEC? Regístralo aquí. Escondemos ciertos datos para garantizar que se devuelva al dueño legítimo."
    : "Completa los detalles del objeto que has extraviado en el campus para activar las coincidencias automáticas.";

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await apiRequest("/categorias", { accessToken: session.access_token });
        setCategories(response || []);
      } catch (loadError) {
        setError(loadError.message || "No se pudieron cargar las categorías.");
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, [session.access_token]);

  useEffect(() => {
    if (!id) return;

    async function loadReport() {
      try {
        const report = await apiRequest(`/reportes/${id}`, { accessToken: session.access_token });
        setForm({
          ...emptyForm,
          ...report,
          idCategoriaObjeto: String(report.idCategoriaObjeto),
          fechaEvento: report.fechaEvento?.slice(0, 10) || emptyForm.fechaEvento,
          urlFoto: report.urlFoto || "",
          nombrePersonalLimpieza: report.nombrePersonalLimpieza || "",
        });
        setPhotoPreview(report.urlFoto || "");
      } catch (loadError) {
        setError(loadError.message || "No se pudo cargar el reporte.");
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [id, session.access_token]);

  useEffect(() => {
    if (selectedFile) return;
    setPhotoPreview(form.urlFoto || "");
  }, [selectedFile, form.urlFoto]);

  const categoryOptions = useMemo(
    () => categories.map((category) => (
      <option key={category.idCategoriaObjeto} value={category.idCategoriaObjeto}>
        {category.nombreCategoria}
      </option>
    )),
    [categories]
  );

  function updateField(event) {
    const { name, value, type: inputType, checked } = event.target;
    setForm((current) => ({ ...current, [name]: inputType === "checkbox" ? checked : value }));
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setPhotoPreview(form.urlFoto || "");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/bmp"]; 
    const extension = file.name.split(".").pop()?.toLowerCase();
    const isValidType = validTypes.includes(file.type) || ["jpg", "jpeg", "png", "webp", "bmp"].includes(extension);

    if (!isValidType) {
      setError("Solo se permiten imágenes .jpg, .jpeg, .png, .webp o .bmp");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar los 5 MB");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setForm((current) => ({ ...current, urlFoto: "" }));
    setError("");
  }

  async function uploadPhoto(reportId) {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("foto", selectedFile);

    await apiRequest(`/reportes/${reportId}/foto`, {
      accessToken: session.access_token,
      method: "POST",
      body: formData,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        ...form,
        idCategoriaObjeto: Number(form.idCategoriaObjeto),
        urlFoto: selectedFile ? null : (form.urlFoto || null),
        nombrePersonalLimpieza: form.nombrePersonalLimpieza || null,
      };
      delete payload.tipo;

      let reportId = id;
      if (isEditing) {
        await apiRequest(`/reportes/${id}`, {
          accessToken: session.access_token,
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        const createdReport = await apiRequest("/reportes", {
          accessToken: session.access_token,
          method: "POST",
          body: JSON.stringify({ ...payload, tipo: form.tipo }),
        });
        reportId = createdReport.idReporte;
      }

      if (selectedFile) {
        await uploadPhoto(reportId);
      }

      navigate("/mis-objetos");
    } catch (submitError) {
      setError(submitError.message || "No se pudo guardar el reporte.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState message="Cargando reporte..." />;

  return (
    <div className="report-page">
      <div className="report-page__heading">
        <div>
          <h1>{isEditing ? "Editar reporte" : title}</h1>
          <p>{isEditing ? "Actualiza los detalles de tu reporte." : subtitle}</p>
        </div>
      </div>

      {error ? <ErrorState message={error} /> : null}

      <form className="report-layout" onSubmit={handleSubmit}>
        <section className="report-card report-card--details">
          <div className="report-fields">
            <label className="report-field report-field--wide">
              <span>{isFound ? "Título del Objeto Encontrado" : "Nombre del Objeto"} <em>*</em></span>
              <input name="nombreObjeto" value={form.nombreObjeto} onChange={updateField} required minLength={2} maxLength={120} />
            </label>
            <label className="report-field">
              <span>{isFound ? "Categoría General" : "Categoría"} <em>*</em></span>
              <select name="idCategoriaObjeto" value={form.idCategoriaObjeto} onChange={updateField} required disabled={loadingCategories}>
                <option value="">Selecciona una categoría</option>
                {categoryOptions}
              </select>
            </label>
            <label className="report-field">
              <span>{isFound ? "Ubicación de Hallazgo" : "Ubicación Detallada"} <em>*</em></span>
              <input name="lugarCampus" value={form.lugarCampus} onChange={updateField} required maxLength={150} />
            </label>
            <label className="report-field">
              <span>{isFound ? "Fecha de Hallazgo" : "Fecha Extraviado"} <em>*</em></span>
              <input type="date" name="fechaEvento" value={form.fechaEvento} onChange={updateField} required />
            </label>
            {isFound ? (
              <label className="report-field">
                <span>Lugar donde lo entregaste</span>
                <input name="nombrePersonalLimpieza" value={form.nombrePersonalLimpieza} onChange={updateField} placeholder="Recepción, seguridad..." maxLength={150} />
              </label>
            ) : null}
            <label className="report-field report-field--wide">
              <span>{isFound ? "Características Clave (Para validación privada)" : "Descripción Física"} <em>*</em></span>
              <textarea name="descripcionObjeto" value={form.descripcionObjeto} onChange={updateField} required minLength={5} rows={isFound ? 4 : 3} />
            </label>
          </div>
        </section>

        <aside className="report-page__aside">
          <section className="report-card report-photo-card">
            <h2>{isFound ? "Foto Prioritaria" : "Cargar Foto"} <span>(Opcional)</span></h2>
            <div className={`report-photo-dropzone report-photo-dropzone--${form.tipo}`}>
              {photoPreview ? (
                <img className="report-photo-preview" src={photoPreview} alt="Vista previa del objeto" />
              ) : (
                <>
                  <img src="/assets/archive.svg" alt="" />
                  <strong>{isFound ? "Sube una foto del objeto" : "Sube una imagen de referencia"}</strong>
                </>
              )}
              <small>{selectedFile ? `Archivo: ${selectedFile.name}` : "Sube una imagen JPG, PNG, WEBP o BMP o usa una URL pública."}</small>
            </div>
            <input className="report-photo-file" type="file" accept=".jpg,.jpeg,.png,.webp,.bmp,image/jpeg,image/png,image/webp,image/bmp" onChange={handlePhotoChange} aria-label="Seleccionar foto del reporte" />
            <input className="report-photo-url" type="url" name="urlFoto" value={form.urlFoto} onChange={updateField} placeholder="https://..." aria-label="URL de la foto" />
          </section>
          <section className="report-card report-submit-card">
            <button className={`report-submit-button report-submit-button--${form.tipo}`} type="submit" disabled={submitting || loadingCategories}>
              {submitting ? "Guardando..." : isEditing ? "Guardar cambios" : isFound ? "Publicar Hallazgo" : "Publicar Reporte"}
            </button>
            <Link className="report-secondary-button" to="/mis-objetos">Cancelar</Link>
          </section>
        </aside>
      </form>
    </div>
  );
}

export default ReportForm;
