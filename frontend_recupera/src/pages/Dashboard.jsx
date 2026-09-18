import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Container, Row, Col, Card, Button, Table, Spinner, Alert } from 'react-bootstrap'
import { objetosPerdidos, objetosEncontrados, coincidencias } from '../services/api'
import './Dashboard.css'

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({
    misReportes: 0,
    coincidenciasActivas: 0,
    recuperados: 0,
  })
  const [actividadReciente, setActividadReciente] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true)
        
        // Simular carga de datos
        // En producción, esto vendría del backend
        const datosMock = {
          misReportes: 8,
          coincidenciasActivas: 3,
          recuperados: 142,
          actividad: [
            {
              id: 1,
              objeto: 'Laptop Dell Vostro',
              tipo: 'Perdido',
              estado: 'Activo',
              fecha: 'Hace 2 horas',
              ubicacion: 'Edificio FD - Nivel 2'
            },
            {
              id: 2,
              objeto: 'Carnet Estudiantil INTEC',
              tipo: 'Encontrado',
              estado: 'Entregado',
              fecha: 'Hace 4 horas',
              ubicacion: 'Biblioteca Emilio Rodríguez'
            },
            {
              id: 3,
              objeto: 'Termo Yeti Gris',
              tipo: 'Perdido',
              estado: 'En revisión',
              fecha: 'Ayer',
              ubicacion: 'Área Deportiva'
            }
          ]
        }

        setStats({
          misReportes: datosMock.misReportes,
          coincidenciasActivas: datosMock.coincidenciasActivas,
          recuperados: datosMock.recuperados,
        })
        
        setActividadReciente(datosMock.actividad)
      } catch (err) {
        setError('Error al cargar los datos del dashboard')
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [])

  if (loading) {
    return (
      <div className="container d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <Spinner animation="border" variant="danger" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <Container>
          <h1>Hola, {user?.nombre} 👋</h1>
          <p>Revisa tus coincidencias y reportes en tiempo real.</p>
        </Container>
      </div>

      <Container className="container-custom">
        {error && <Alert variant="danger">{error}</Alert>}

        {/* Botones de acción rápida */}
        <Row className="mb-4">
          <Col md={6} lg={4} className="mb-3">
            <Link to="/reportar-perdido" className="text-decoration-none">
              <Card className="action-card action-card-primary">
                <Card.Body className="text-center">
                  <div className="action-icon">📌</div>
                  <Card.Title>Reportar Objeto Perdido</Card.Title>
                  <p className="text-muted">Crea un nuevo reporte</p>
                </Card.Body>
              </Card>
            </Link>
          </Col>

          <Col md={6} lg={4} className="mb-3">
            <Link to="/reportar-encontrado" className="text-decoration-none">
              <Card className="action-card action-card-success">
                <Card.Body className="text-center">
                  <div className="action-icon">✅</div>
                  <Card.Title>Reportar Objeto Encontrado</Card.Title>
                  <p className="text-muted">Ayuda a la comunidad</p>
                </Card.Body>
              </Card>
            </Link>
          </Col>

          <Col md={6} lg={4} className="mb-3">
            <Link to="/buscar-objetos" className="text-decoration-none">
              <Card className="action-card action-card-info">
                <Card.Body className="text-center">
                  <div className="action-icon">🔍</div>
                  <Card.Title>Buscar Objetos</Card.Title>
                  <p className="text-muted">Encuentra lo que necesitas</p>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        </Row>

        {/* Estadísticas */}
        <Row className="mb-4">
          <Col md={4} className="mb-3">
            <Card className="stat-card">
              <Card.Body>
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <h3>{stats.misReportes}</h3>
                  <p>Mis Reportes</p>
                  <small>5 perdidos / 3 encontrados</small>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4} className="mb-3">
            <Card className="stat-card">
              <Card.Body>
                <div className="stat-icon">⚡</div>
                <div className="stat-content">
                  <h3>{stats.coincidenciasActivas}</h3>
                  <p>Coincidencias Activas</p>
                  <small>Emparejamientos automáticos</small>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4} className="mb-3">
            <Card className="stat-card">
              <Card.Body>
                <div className="stat-icon">✨</div>
                <div className="stat-content">
                  <h3>{stats.recuperados}</h3>
                  <p>Total Recuperado</p>
                  <small>Objetos devueltos este mes</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Actividad Reciente */}
        <div className="form-section">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>Actividad Reciente del Campus</h3>
            <Link to="/buscar-objetos" className="btn btn-sm btn-outline-primary">
              Ver todo
            </Link>
          </div>

          {actividadReciente.length > 0 ? (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Objeto</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                    <th>Ubicación</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {actividadReciente.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.objeto}</strong>
                      </td>
                      <td>{item.tipo}</td>
                      <td>
                        <span className={`badge badge-estado-${item.estado.toLowerCase().replace(' ', '-')}`}>
                          {item.estado}
                        </span>
                      </td>
                      <td>{item.ubicacion}</td>
                      <td>{item.fecha}</td>
                      <td>
                        <Link 
                          to={`/objeto/${item.id}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          Ver Detalles
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>No hay actividad reciente</h3>
              <p>Cuando se registren objetos, aparecerán aquí</p>
            </div>
          )}
        </div>

        {/* Sección de Coincidencias */}
        {stats.coincidenciasActivas > 0 && (
          <div className="alert alert-info mt-4">
            <h5>⚡ ¡Tienes Coincidencias Detectadas!</h5>
            <p>El sistema ha encontrado {stats.coincidenciasActivas} posibles coincidencias con tus reportes.</p>
            <Link to="/coincidencias" className="btn btn-sm btn-primary">
              Revisar Coincidencias
            </Link>
          </div>
        )}
      </Container>
    </>
  )
}
