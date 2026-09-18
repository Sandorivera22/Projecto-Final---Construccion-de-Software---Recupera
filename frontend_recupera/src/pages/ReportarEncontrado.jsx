import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Form, Button, Alert } from 'react-bootstrap'
import './ReportarPerdido.css'

export default function ReportarEncontrado() {
  const [formData, setFormData] = useState({
    titulo: '',
    categoria: '',
    ubicacion: '',
    fechaHallazgo: '',
    caracteristicasClaves: '',
    fotografia: null,
  })
  const [fotoPreview, setFotoPreview] = useState(null)
  const navigate = useNavigate()

  const categorias = [
    'Tecnología',
    'Documentos',
    'Pertenencias',
    'Libros',
    'Otros',
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, fotografia: file }))
      const reader = new FileReader()
      reader.onloadend = () => setFotoPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // TODO: Implementar llamada al API
    alert('Reporte enviado exitosamente')
    navigate('/dashboard')
  }

  return (
    <>
      <div className="page-header">
        <Container>
          <h1>Reportar Objeto Encontrado</h1>
          <p>¿Encontraste algo en INTEC? Regístralo aquí. Escondemos ciertos datos para garantizar que se devuelva al dueño legítimo.</p>
        </Container>
      </div>

      <Container className="container-custom">
        <div className="form-section">
          <h3>✅ Información del Objeto Encontrado</h3>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Título del Objeto Encontrado <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: Carnet Estudiantil INTEC"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Categoría General <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecciona categoría</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Ubicación de Hallazgo <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Biblioteca Emilio Rodríguez"
                    name="ubicacion"
                    value={formData.ubicacion}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Fecha de Hallazgo <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="datetime-local"
                name="fechaHallazgo"
                value={formData.fechaHallazgo}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Características Clave (Para validación privada)</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="El carnet está a nombre de Santiago Pérez. ID: 1098273."
                name="caracteristicasClaves"
                value={formData.caracteristicasClaves}
                onChange={handleChange}
              />
              <small className="text-muted">Evita mostrar detalles ultra específicos en la foto pública</small>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Foto Prioritaria (Opcional)</Form.Label>
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
                      style={{ display: 'none' }}
                    />
                    <span className="photo-icon">📸</span>
                    <span className="photo-text">Sube una foto del objeto</span>
                  </label>
                )}
              </div>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="success" type="submit" className="flex-grow-1">
                ✅ Publicar Hallazgo
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate('/dashboard')}>
                Cancelar
              </Button>
            </div>
          </Form>

          <div className="alert alert-info mt-4">
            <h6>🔒 Consejo de Seguridad y Privacidad</h6>
            <p>Para proteger tu identidad, el sistema no comparte nombres completos ni números telefónicos. Coordina la entrega en puntos concurridos del campus.</p>
          </div>
        </div>
      </Container>
    </>
  )
}
