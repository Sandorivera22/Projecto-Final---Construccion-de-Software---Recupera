import { Container } from 'react-bootstrap'

export default function Mensajeria() {
  return (
    <>
      <div className="page-header">
        <Container>
          <h1>Mensajería</h1>
          <p>Buscar conversaciones...</p>
        </Container>
      </div>

      <Container className="container-custom">
        <div className="form-section">
          <h3>Conversaciones</h3>
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <h3>Página en desarrollo</h3>
            <p>Sistema de mensajería privada</p>
          </div>
        </div>
      </Container>
    </>
  )
}
