import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap'
import { objetosPerdidos } from '../services/api'
import './ReportarPerdido.css'

export default function ReportarPerdido() {
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    ubicacionDetallada: '',
    fechaExtraviado: '',
    descripcionFisica: '',
    fotografia: null,
    informacionContacto: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [fotoPreview, setFotoPreview] = useState(null)
  const navigate = useNavigate()

  const categorias = [
    'Tecnología',
    'Documentos',
    'Pertenencias',
    'Libros',
    'Otros',
  ]

  const edificios = [
    'Edificio FD',
    'Biblioteca Emilio Rodríguez',
    'Área Deportiva',
    'Comedores',
    'Estacionamiento',
    'Otro edificio',
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        fotografia: file
      }))
      
      // Preview de la imagen
      const reader = new FileReader()
      reader.onloadend = () => {
        setFotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validaciones
    if (!formData.nombre || !formData.categoria || !formData.ubicacionDetallada || !formData.fechaExtraviado) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }

    setLoading(true)

    try {
      // Crear FormData para enviar con archivo
      const data = new FormData()
      data.append('nombre', formData.nombre)
      data.append('categoria', formData.categoria)
      data.append('ubicacionDetallada', formData.ubicacionDetallada)
      data.append('fechaExtraviado', formData.fechaExtraviado)
      data.append('descripcionFisica', formData.descripcionFisica)
      data.append('informacionContacto', formData.informacionContacto)
      
      if (formData.fotografia) {
        data.append('fotografia', formData.fotografia)
      }

      // Aquí iría la llamada al API
      // const response = await objetosPerdidos.crear(data)
      
      // Por ahora, simular éxito
      setSuccess('¡Reporte creado exitosamente! El sistema buscará coincidencias automáticamente.')
      
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el reporte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <Container>
          <h1>Reportar Objeto Perdido</h1>
          <p>Completa los detalles del objeto que has extraviado en el campus para activar las coincidencias automáticas.</p>
        </Container>
      </div>

      <Container className="container-custom">
        <div className="form-section">
          <h3>📌 Información del Objeto Perdido</h3>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            {/* Primera fila */}
            <Form.Group className="mb-3">
              <Form.Label>Nombre del Objeto <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: Laptop Dell Vostro"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <small className="text-muted">Describe brevemente el objeto</small>
            </Form.Group>

            {/* Segunda fila */}
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Categoría <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Selecciona una categoría</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Ubicación Detallada <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="ubicacionDetallada"
                    value={formData.ubicacionDetallada}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="">¿Dónde lo perdiste?</option>
                    {edificios.map(ed => (
                      <option key={ed} value={ed}>{ed}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            {/* Tercera fila */}
            <Form.Group className="mb-3">
              <Form.Label>Fecha Extraviado <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="datetime-local"
                name="fechaExtraviado"
                value={formData.fechaExtraviado}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <small className="text-muted">Fecha y hora aproximada en que lo perdiste</small>
            </Form.Group>

            {/* Descripción Física */}
            <Form.Group className="mb-3">
              <Form.Label>Descripción Física</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Describe características distintivas del objeto: color, marcas, daños, accesorios, etc. Estos detalles son importantes para validar la reclamación."
                name="descripcionFisica"
                value={formData.descripcionFisica}
                onChange={handleChange}
                disabled={loading}
              />
              <small className="text-muted">Incluye detalles que solo el dueño debería conocer</small>
            </Form.Group>

            {/* Fotografía */}
            <Form.Group className="mb-3">
              <Form.Label>Cargar Foto (Opcional)</Form.Label>
              <div className="photo-upload-area">
                {fotoPreview ? (
                  <div className="photo-preview">
                    <img src={fotoPreview} alt="Preview" />
                    <Button 
                      variant="sm" 
                      onClick={() => {
                        setFotoPreview(null)
                        setFormData(prev => ({ ...prev, fotografia: null }))
                      }}
                      className="btn-clear-photo"
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <label className="photo-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={loading}
                      style={{ display: 'none' }}
                    />
                    <span className="photo-icon">📸</span>
                    <span className="photo-text">Sube una imagen de referencia</span>
                    <small className="text-muted">Formatos soportados: JPG, PNG. Máx 5MB</small>
                  </label>
                )}
              </div>
              <small className="text-muted d-block mt-2">
                Evita mostrar detalles ultra específicos en la foto pública
              </small>
            </Form.Group>

            {/* Información de Contacto */}
            <Form.Group className="mb-4">
              <Form.Label>Información de Contacto Privada <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="email"
                placeholder="tu.email@intec.edu.do"
                name="informacionContacto"
                value={formData.informacionContacto}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <small className="text-muted">Este dato es privado y solo se comparte si hay una coincidencia</small>
            </Form.Group>

            {/* Botones de Acción */}
            <div className="d-flex gap-2">
              <Button 
                variant="primary" 
                type="submit" 
                className="flex-grow-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Publicar Reporte...
                  </>
                ) : (
                  '📌 Publicar Reporte'
                )}
              </Button>
              <Button 
                variant="outline-secondary"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </Form>

          {/* Información de Seguridad */}
          <div className="alert alert-info mt-4">
            <h6>🔒 Consejo de Seguridad y Privacidad</h6>
            <p>Para proteger tu identidad, el sistema no comparte nombres completos ni números telefónicos. Coordina la entrega en puntos concurridos del campus.</p>
          </div>
        </div>
      </Container>
    </>
  )
}
