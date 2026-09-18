import { Container } from 'react-bootstrap'

export default function Coincidencias() {
  return (
    <>
      <div className="page-header">
        <Container>
          <h1>Coincidencias Detectadas (Algoritmo Recupera+)</h1>
          <p>Comparamos automáticamente características, fechas y ubicaciones de reportes de objetos perdidos vs. encontrados.</p>
        </Container>
      </div>

      <Container className="container-custom">
        <div className="form-section">
          <h3>Coincidencias Automáticas</h3>
          <div className="empty-state">
            <div className="empty-state-icon">⚡</div>
            <h3>Página en desarrollo</h3>
            <p>Sistema de coincidencias automáticas</p>
          </div>
        </div>
      </Container>
    </>
  )
}
