import { Container } from 'react-bootstrap'

export default function Administracion() {
  return (
    <>
      <div className="page-header">
        <Container>
          <h1>⚙️ Panel de Administración</h1>
          <p>Gestiona reportes, usuarios y moderación de contenido</p>
        </Container>
      </div>

      <Container className="container-custom">
        <div className="form-section">
          <h3>Administración del Sistema</h3>
          <div className="empty-state">
            <div className="empty-state-icon">⚙️</div>
            <h3>Página en desarrollo</h3>
            <p>Panel de administración</p>
          </div>
        </div>
      </Container>
    </>
  )
}
