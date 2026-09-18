import { useParams } from 'react-router-dom'
import { Container } from 'react-bootstrap'

export default function DetalleObjeto() {
  const { id } = useParams()

  return (
    <>
      <div className="page-header">
        <Container>
          <h1>Detalles del Objeto</h1>
          <p>Información completa del reporte #{id}</p>
        </Container>
      </div>

      <Container className="container-custom">
        <div className="form-section">
          <h3>Detalles</h3>
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>Página en desarrollo</h3>
            <p>Detalles del objeto con ID: {id}</p>
          </div>
        </div>
      </Container>
    </>
  )
}
