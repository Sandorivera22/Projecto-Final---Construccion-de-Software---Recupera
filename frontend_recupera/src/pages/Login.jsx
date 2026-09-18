import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap'
import { auth } from '../services/api'
import './Auth.css'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Crear usuario ficticio
    const userData = {
      id: 'user-' + Math.random().toString(36).substr(2, 9),
      nombre: email.split('@')[0], // Usa la parte del email como nombre
      email: email,
      role: 'user',
    }

    // Simular token JWT
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake_token_' + Date.now()

    onLogin(userData, fakeToken)
    navigate('/dashboard')
  } catch (err) {
    setError('Error al iniciar sesión')
  } finally {
    setLoading(false)
  }
}

  return (
    <Container className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🗂️</div>
          <h1>Recupera+</h1>
          <p className="auth-subtitle">INTEC</p>
        </div>

        <div className="auth-content">
          <h2>Inicia Sesión</h2>
          <p className="text-muted mb-4">Usa tu correo institucional @intec.edu.do</p>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Correo Electrónico</Form.Label>
              <Form.Control
                type="email"
                placeholder="tu.email@intec.edu.do"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </Form.Group>

            <div className="d-grid gap-2 mb-3">
              <Button 
                variant="primary" 
                type="submit" 
                className="btn-auth"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Ingresando...
                  </>
                ) : (
                  'Entrar a Recupera'
                )}
              </Button>
            </div>

            <div className="auth-footer">
              <p className="mb-0">
                ¿No tienes una cuenta? <Link to="/register" className="auth-link">Regístrate aquí</Link>
              </p>
            </div>
          </Form>
        </div>

        <div className="auth-info">
          <p className="text-center text-muted">
            La forma más rápida de recuperar tus pertenencias.
          </p>
        </div>
      </div>

      <div className="auth-background">
        <div className="auth-decoration auth-decoration-1"></div>
        <div className="auth-decoration auth-decoration-2"></div>
        <div className="auth-decoration auth-decoration-3"></div>
      </div>
    </Container>
  )
}
