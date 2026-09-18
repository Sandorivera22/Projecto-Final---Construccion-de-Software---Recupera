import { Container } from 'react-bootstrap'

export default function MisObjetos() {
  return (
    <>
      <div className="page-header">
        <Container>
          <h1>Mis Objetos Reportados</h1>
          <p>Administra los reportes que has creado. Puedes marcar objetos como recuperados al instante.</p>
        </Container>
      </div>

      <Container className="container-custom">
        <div className="form-section">
          <h3>Mis Reportes</h3>
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <h3>Página en desarrollo</h3>
            <p>Esta sección mostrará todos tus reportes</p>
          </div>
        </div>
      </Container>
    </>
  )
}
