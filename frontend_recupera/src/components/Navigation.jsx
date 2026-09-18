import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar, Nav, Container, Dropdown, Badge } from 'react-bootstrap'
import './Navigation.css'

export default function Navigation({ user, onLogout }) {
  const [notificaciones, setNotificaciones] = useState(3) // Ejemplo
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  return (
    <Navbar bg="light" expand="lg" sticky="top" className="navbar-custom">
      <Container>
        <Navbar.Brand href="/dashboard" className="fw-bold">
          <span className="navbar-icon">🗂️</span> Recupera+
          <span className="navbar-subtitle">INTEC</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {/* Menú Principal */}
            <Nav.Link href="/dashboard" className="nav-link-custom">
              Dashboard
            </Nav.Link>

            <Nav.Link href="/buscar-objetos" className="nav-link-custom">
              Buscar Objetos
            </Nav.Link>

            <Dropdown className="nav-link-custom">
              <Dropdown.Toggle variant="link" id="reportar-dropdown" className="text-decoration-none text-dark">
                Reportar
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item href="/reportar-perdido">
                  📌 Objeto Perdido
                </Dropdown.Item>
                <Dropdown.Item href="/reportar-encontrado">
                  ✅ Objeto Encontrado
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Nav.Link href="/mis-objetos" className="nav-link-custom">
              Mis Objetos
            </Nav.Link>

            {/* Coincidencias con Notificación */}
            <Nav.Link href="/coincidencias" className="nav-link-custom position-relative">
              Coincidencias
              {notificaciones > 0 && (
                <Badge bg="danger" className="position-absolute top-0 start-100 translate-middle">
                  {notificaciones}
                </Badge>
              )}
            </Nav.Link>

            {/* Mensajería */}
            <Nav.Link href="/mensajeria" className="nav-link-custom">
              💬 Mensajes
            </Nav.Link>

            {/* Admin - Solo para administradores */}
            {user?.role === 'admin' && (
              <Nav.Link href="/administracion" className="nav-link-custom">
                ⚙️ Administración
              </Nav.Link>
            )}

            {/* Menú de Usuario */}
            <Dropdown className="ms-3">
              <Dropdown.Toggle 
                variant="link" 
                id="user-dropdown" 
                className="text-decoration-none d-flex align-items-center nav-link-custom"
              >
                <span className="user-avatar me-2">
                  {user?.nombre?.charAt(0).toUpperCase()}
                </span>
                {user?.nombre}
              </Dropdown.Toggle>

              <Dropdown.Menu align="end">
                <Dropdown.Item href="/perfil">
                  👤 Mi Perfil
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="text-danger">
                  🚪 Cerrar Sesión
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
