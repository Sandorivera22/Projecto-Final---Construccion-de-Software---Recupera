import { Container } from 'react-bootstrap'

export default function BuscarObjetos() {
  return (
    <>
      <div className="page-header">
        <Container>
          <h1>Buscar Objetos en el Campus</h1>
          <p>Busca y filtra objetos perdidos y encontrados</p>
        </Container>
      </div>

      <Container className="container-custom">
        <div className="form-section">
          <h3>Búsqueda Avanzada</h3>
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>Página en desarrollo</h3>
            <p>Búsqueda de objetos con filtros avanzados</p>
          </div>
        </div>
      </Container>
    </>
  )
}
