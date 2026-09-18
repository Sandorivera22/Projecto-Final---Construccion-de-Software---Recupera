import { Container } from 'react-bootstrap'

export default function MiPerfil({ user }) {
  return (
    <>
      <div className="page-header">
        <Container>
          <h1>Mi Perfil Universitario</h1>
          <p>Administra tus datos institucionales de INTEC y visualiza tus estadísticas de recuperación.</p>
        </Container>
      </div>

      <Container className="container-custom">
        <div className="form-section">
          <h3>Información de Perfil</h3>
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <h3>Página en desarrollo</h3>
            <p>Perfil del usuario: {user?.nombre}</p>
          </div>
        </div>
      </Container>
    </>
  )
}
