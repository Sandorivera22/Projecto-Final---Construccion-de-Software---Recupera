import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ReportarPerdido from './pages/ReportarPerdido'
import ReportarEncontrado from './pages/ReportarEncontrado'
import MisObjetos from './pages/MisObjetos'
import BuscarObjetos from './pages/BuscarObjetos'
import Coincidencias from './pages/Coincidencias'
import DetalleObjeto from './pages/DetalleObjeto'
import MiPerfil from './pages/MiPerfil'
import VerificacionPertenencia from './pages/VerificacionPertenencia'
import Mensajeria from './pages/Mensajeria'
import Administracion from './pages/Administracion'
import Navigation from './components/Navigation'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si el usuario está autenticado (verificar token en localStorage)
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      setIsAuthenticated(true)
      setUser(JSON.parse(userData))
    }
    
    setLoading(false)
  }, [])

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setIsAuthenticated(true)
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setUser(null)
  }

  if (loading) {
    return <div className="container d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="spinner-border text-danger" role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
    </div>
  }

  return (
    <Router>
      {isAuthenticated && <Navigation user={user} onLogout={handleLogout} />}
      
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register onLogin={handleLogin} />} />

        {/* Rutas protegidas */}
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard user={user} /> : <Navigate to="/login" />} />
        <Route path="/reportar-perdido" element={isAuthenticated ? <ReportarPerdido /> : <Navigate to="/login" />} />
        <Route path="/reportar-encontrado" element={isAuthenticated ? <ReportarEncontrado /> : <Navigate to="/login" />} />
        <Route path="/mis-objetos" element={isAuthenticated ? <MisObjetos /> : <Navigate to="/login" />} />
        <Route path="/buscar-objetos" element={isAuthenticated ? <BuscarObjetos /> : <Navigate to="/login" />} />
        <Route path="/coincidencias" element={isAuthenticated ? <Coincidencias /> : <Navigate to="/login" />} />
        <Route path="/objeto/:id" element={isAuthenticated ? <DetalleObjeto /> : <Navigate to="/login" />} />
        <Route path="/perfil" element={isAuthenticated ? <MiPerfil user={user} /> : <Navigate to="/login" />} />
        <Route path="/verificacion/:id" element={isAuthenticated ? <VerificacionPertenencia /> : <Navigate to="/login" />} />
        <Route path="/mensajeria" element={isAuthenticated ? <Mensajeria /> : <Navigate to="/login" />} />
        <Route path="/administracion" element={isAuthenticated && user?.role === 'admin' ? <Administracion /> : <Navigate to="/dashboard" />} />

        {/* Ruta raíz */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  )
}

export default App
