import { useParams } from 'react-router-dom'
import { Container } from 'react-bootstrap'

export default function VerificacionPertenencia() {
  const { id } = useParams()

  return (
    <>
      <div className="page-header">
        <Container>
          <h1>Proceso de Reclamación</h1>
          <p>Completa el formulario dinámico de seguridad para validar que el objeto te pertenece.</p>
        </Container>
      </div>

      <Container className="container-custom">
        <div className="form-section">
          <h3>Formulario de Verificación de Propiedad</h3>
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <h3>Página en desarrollo</h3>
            <p>Verificación para reclamación #{id}</p>
          </div>
        </div>
      </Container>
    </>
  )
}
