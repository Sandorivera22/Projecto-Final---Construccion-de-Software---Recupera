# Guía Rápida de Desarrollo - Recupera+ Frontend

## 🎯 Próximos Pasos

Este documento te guía en cómo completar las páginas stub (esbozo) que están marcadas como "en desarrollo".

## 📋 Checklist de Páginas

- [x] Login
- [x] Register  
- [x] Dashboard
- [x] Reportar Objeto Perdido
- [x] Reportar Objeto Encontrado
- [ ] Mis Objetos (stub)
- [ ] Buscar Objetos (stub)
- [ ] Coincidencias (stub)
- [ ] Detalles de Objeto (stub)
- [ ] Mi Perfil (stub)
- [ ] Verificación de Pertenencia (stub)
- [ ] Mensajería (stub)
- [ ] Administración (stub)

## 🔧 Cómo Completar una Página

### Paso 1: Analizar los Requerimientos

Por ejemplo, para "Mis Objetos" (RF-05 a RF-08):
- RF-05: Registrar objeto perdido ✅ (Ya implementado en ReportarPerdido)
- RF-06: Editar reporte de objeto perdido
- RF-07: Eliminar reporte de objeto perdido
- RF-08: Marcar objeto como recuperado

### Paso 2: Actualizaré el Archivo de la Página

**Archivo**: `src/pages/MisObjetos.jsx`

```jsx
import { useState, useEffect } from 'react'
import { Container, Table, Button, Spinner, Alert } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { objetosPerdidos } from '../services/api'

export default function MisObjetos() {
  const [reportes, setReportes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarReportes()
  }, [])

  const cargarReportes = async () => {
    try {
      setLoading(true)
      // Aquí van tus llamadas al API
      const { data } = await objetosPerdidos.obtenerMios()
      setReportes(data)
    } catch (err) {
      setError('Error al cargar reportes')
    } finally {
      setLoading(false)
    }
  }

  const handleEliminar = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este reporte?')) {
      try {
        await objetosPerdidos.eliminar(id)
        cargarReportes() // Recargar lista
      } catch (err) {
        alert('Error al eliminar')
      }
    }
  }

  const handleMarcarRecuperado = async (id) => {
    try {
      await objetosPerdidos.marcarRecuperado(id)
      cargarReportes() // Recargar lista
    } catch (err) {
      alert('Error al actualizar estado')
    }
  }

  if (loading) return <Spinner />

  return (
    <>
      <div className="page-header">
        <Container>
          <h1>Mis Objetos Reportados</h1>
        </Container>
      </div>

      <Container className="container-custom">
        <div className="form-section">
          <h3>Mis Reportes</h3>
          
          {error && <Alert variant="danger">{error}</Alert>}

          {reportes.length > 0 ? (
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
                  {reportes.map(reporte => (
                    <tr key={reporte.id}>
                      <td><strong>{reporte.nombre}</strong></td>
                      <td>{reporte.categoria}</td>
                      <td>
                        <span className={`badge badge-estado-${reporte.estado.toLowerCase()}`}>
                          {reporte.estado}
                        </span>
                      </td>
                      <td>{reporte.ubicacionDetallada}</td>
                      <td>{new Date(reporte.fechaExtraviado).toLocaleDateString()}</td>
                      <td>
                        <Link 
                          to={`/objeto/${reporte.id}`}
                          className="btn btn-sm btn-outline-primary me-1"
                        >
                          Ver
                        </Link>
                        
                        {reporte.estado === 'Activo' && (
                          <>
                            <Button 
                              variant="sm"
                              onClick={() => handleMarcarRecuperado(reporte.id)}
                              className="btn-success me-1"
                            >
                              Marcar como Recuperado
                            </Button>
                            <Button
                              variant="sm"
                              variant="danger"
                              onClick={() => handleEliminar(reporte.id)}
                            >
                              Eliminar
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📁</div>
              <h3>No tienes reportes</h3>
              <p>
                <Link to="/reportar-perdido" className="btn btn-primary">
                  Crear primer reporte
                </Link>
              </p>
            </div>
          )}
        </div>
      </Container>
    </>
  )
}
```

## 📋 Patrón General para Completar Páginas

### 1. Import necesarios
```jsx
import { useState, useEffect } from 'react'
import { Container, Table, Button, Spinner, Alert } from 'react-bootstrap'
import { tuServicio } from '../services/api'
```

### 2. Estado
```jsx
const [datos, setDatos] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')
```

### 3. Efecto para cargar datos
```jsx
useEffect(() => {
  cargarDatos()
}, [])

const cargarDatos = async () => {
  try {
    setLoading(true)
    const { data } = await tuServicio.obtenerTodos()
    setDatos(data)
  } catch (err) {
    setError('Error al cargar')
  } finally {
    setLoading(false)
  }
}
```

### 4. Handlers para acciones
```jsx
const handleEliminar = async (id) => {
  if (window.confirm('¿Estás seguro?')) {
    try {
      await tuServicio.eliminar(id)
      cargarDatos()
    } catch (err) {
      setError('Error al eliminar')
    }
  }
}
```

### 5. JSX
```jsx
return (
  <>
    <div className="page-header">
      <Container>
        <h1>Título</h1>
        <p>Descripción</p>
      </Container>
    </div>

    <Container className="container-custom">
      <div className="form-section">
        <h3>Sección</h3>
        
        {error && <Alert variant="danger">{error}</Alert>}
        {loading && <Spinner />}
        
        {datos.length > 0 ? (
          // Contenido
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>Sin datos</h3>
          </div>
        )}
      </div>
    </Container>
  </>
)
```

## 🎨 Componentes Bootstrap Útiles

```jsx
// Spinner de carga
<Spinner animation="border" variant="danger" />

// Alertas
<Alert variant="danger">Error</Alert>
<Alert variant="success">Éxito</Alert>
<Alert variant="info">Información</Alert>

// Botones
<Button variant="primary">Primario</Button>
<Button variant="success">Éxito</Button>
<Button variant="danger">Peligro</Button>
<Button variant="outline-primary">Outline</Button>

// Badge (etiqueta)
<Badge bg="danger">Activo</Badge>

// Tabla
<Table hover>
  <thead><tr><th>Columna</th></tr></thead>
  <tbody><tr><td>Dato</td></tr></tbody>
</Table>

// Modal (modal)
<Modal show={show} onHide={handleClose}>
  <Modal.Header closeButton>
    <Modal.Title>Título</Modal.Title>
  </Modal.Header>
  <Modal.Body>Contenido</Modal.Body>
  <Modal.Footer>
    <Button onClick={handleClose}>Cerrar</Button>
  </Modal.Footer>
</Modal>

// Form
<Form onSubmit={handleSubmit}>
  <Form.Group className="mb-3">
    <Form.Label>Label</Form.Label>
    <Form.Control type="text" />
  </Form.Group>
</Form>
```

## 🛠️ API Response Handling

```jsx
// Petición exitosa
const { data } = await tuServicio.obtenerTodos()
console.log(data) // Array o objeto

// Error
try {
  await tuServicio.crear(datos)
} catch (err) {
  console.error(err.response.data.message) // Mensaje de error
  console.error(err.response.status) // Código HTTP
}

// Enviar datos
const { data } = await tuServicio.crear({
  nombre: formData.nombre,
  categoria: formData.categoria,
  // ... más campos
})

// Con archivo
const formData = new FormData()
formData.append('archivo', file)
formData.append('nombre', nombre)
const { data } = await tuServicio.crear(formData)
```

## 🔗 Rutas Útiles en el Código

```jsx
import { useNavigate, useParams } from 'react-router-dom'

const navigate = useNavigate()
const { id } = useParams() // Para rutas como /objeto/:id

// Navegar
navigate('/dashboard')
navigate(`/objeto/${id}`)

// Atrás
navigate(-1)
```

## 🧪 Testing con Datos Mock

Mientras no esté listo el backend, usa datos mock:

```jsx
useEffect(() => {
  setLoading(true)
  
  // Simular delay de red
  setTimeout(() => {
    setDatos([
      { id: 1, nombre: 'Objeto 1', estado: 'Activo' },
      { id: 2, nombre: 'Objeto 2', estado: 'Recuperado' },
    ])
    setLoading(false)
  }, 500)
}, [])
```

## 📱 Responsive Design

Usa Bootstrap grid:

```jsx
<Row>
  <Col md={6} lg={4}>
    Contenido que ocupa 6 en md, 4 en lg
  </Col>
</Row>

<div className="row">
  <div className="col-md-6 col-lg-4">
    Bootstrap nativo
  </div>
</div>
```

## 🚀 Próximas Tareas

1. **Completar Mis Objetos**: Mostrar tabla de reportes con acciones
2. **Buscar Objetos**: Implementar formulario de búsqueda con filtros
3. **Coincidencias**: Mostrar coincidencias detectadas automáticamente
4. **Detalles**: Modal o página detallada de objetos
5. **Perfil**: Mostrar y editar perfil del usuario
6. **Verificación**: Formulario dinámico de seguridad
7. **Mensajería**: Chat en tiempo real (considerar Socket.io)
8. **Administración**: Panel admin con gráficos y controles

## 💡 Tips Finales

- Siempre usa `try-catch` con async/await
- Carga datos en `useEffect`
- Limpia errores después de 5 segundos
- Deshabilita botones mientras se carga
- Usa confirmación antes de eliminar
- Navega después de acciones exitosas
- Mantén consistencia visual con los colores definidos

---

¡Feliz desarrollo! 🎉
