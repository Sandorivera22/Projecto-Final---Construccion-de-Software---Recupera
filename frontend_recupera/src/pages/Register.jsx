import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap'
import { auth } from '../services/api'
import './Auth.css'

export default function Register({ onLogin }) {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validaciones
    if (!formData.nombre || !formData.email || !formData.password) {
      setError('Por favor completa todos los campos')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (!acceptTerms) {
      setError('Debes aceptar los términos y condiciones')
      return
    }

    setLoading(true)

    try {
      const { data } = await auth.register({
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
      })

      const userData = {
        id: data.user.id,
        nombre: data.user.nombre,
        email: data.user.email,
        role: data.user.role,
      }

      onLogin(userData, data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse')
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
          <h2>Crea tu Cuenta</h2>
          <p className="text-muted mb-4">Regístrate con tus datos de estudiante o docente</p>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre Completo</Form.Label>
              <Form.Control
                type="text"
                placeholder="Escribe tu nombre y apellido"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Correo Institucional</Form.Label>
              <Form.Control
                type="email"
                placeholder="nombre.apellido@intec.edu.do"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <small className="text-muted">
                Solo se aceptan correos @intec.edu.do
              </small>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="Elige una contraseña robusta"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <small className="text-muted">
                Mínimo 6 caracteres
              </small>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirmar Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="Repite tu contraseña"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="terms"
                label="Acepto los Términos de Servicio y Políticas de Privacidad de INTEC."
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
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
                    Registrando...
                  </>
                ) : (
                  'Registrarme'
                )}
              </Button>
            </div>

            <div className="auth-footer">
              <p className="mb-0">
                ¿Ya tienes una cuenta? <Link to="/login" className="auth-link">Inicia sesión aquí</Link>
              </p>
            </div>
          </Form>
        </div>

        <div className="auth-info">
          <p className="text-center text-muted">
            Únete a la red de solidaridad INTEC.
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
