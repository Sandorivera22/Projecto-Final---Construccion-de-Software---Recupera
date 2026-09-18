import axios from 'axios'

// Configurar la URL base del API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar el token en cada solicitud
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ===== AUTENTICACIÓN =====
export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
}

// ===== USUARIOS =====
export const users = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  deleteAccount: () => api.delete('/users/profile'),
}

// ===== OBJETOS PERDIDOS =====
export const objetosPerdidos = {
  crear: (data) => api.post('/objetos-perdidos', data),
  obtenerTodos: (params) => api.get('/objetos-perdidos', { params }),
  obtenerPorId: (id) => api.get(`/objetos-perdidos/${id}`),
  actualizar: (id, data) => api.put(`/objetos-perdidos/${id}`, data),
  eliminar: (id) => api.delete(`/objetos-perdidos/${id}`),
  marcarRecuperado: (id) => api.patch(`/objetos-perdidos/${id}/recuperado`),
  obtenerMios: () => api.get('/objetos-perdidos/mis-reportes/mis-reportes'),
}

// ===== OBJETOS ENCONTRADOS =====
export const objetosEncontrados = {
  crear: (data) => api.post('/objetos-encontrados', data),
  obtenerTodos: (params) => api.get('/objetos-encontrados', { params }),
  obtenerPorId: (id) => api.get(`/objetos-encontrados/${id}`),
  actualizar: (id, data) => api.put(`/objetos-encontrados/${id}`, data),
  eliminar: (id) => api.delete(`/objetos-encontrados/${id}`),
  marcarEntregado: (id) => api.patch(`/objetos-encontrados/${id}/entregado`),
  obtenerMios: () => api.get('/objetos-encontrados/mis-reportes/mis-reportes'),
}

// ===== COINCIDENCIAS =====
export const coincidencias = {
  obtenerTodas: () => api.get('/coincidencias'),
  obtenerPorId: (id) => api.get(`/coincidencias/${id}`),
  obtenerMias: () => api.get('/coincidencias/mis-coincidencias/mis-coincidencias'),
}

// ===== RECLAMACIONES =====
export const reclamaciones = {
  crear: (data) => api.post('/reclamaciones', data),
  obtenerTodas: () => api.get('/reclamaciones'),
  obtenerPorId: (id) => api.get(`/reclamaciones/${id}`),
  obtenerMias: () => api.get('/reclamaciones/mis-reclamaciones/mis-reclamaciones'),
  enviarVerificacion: (id, data) => api.post(`/reclamaciones/${id}/verificacion`, data),
  verificarPertenencia: (id, data) => api.post(`/reclamaciones/${id}/verificar`, data),
}

// ===== MENSAJERÍA =====
export const mensajeria = {
  obtenerConversaciones: () => api.get('/mensajes/conversaciones'),
  obtenerMensajes: (conversacionId) => api.get(`/mensajes/conversaciones/${conversacionId}`),
  enviarMensaje: (conversacionId, mensaje) => api.post(`/mensajes/conversaciones/${conversacionId}`, { mensaje }),
  crearConversacion: (usuarioId) => api.post('/mensajes/conversaciones', { usuarioId }),
}

// ===== ADMINISTRACIÓN =====
export const administracion = {
  obtenerReportes: (params) => api.get('/admin/reportes', { params }),
  desactivarReporte: (id) => api.patch(`/admin/reportes/${id}/desactivar`),
  obtenerUsuarios: (params) => api.get('/admin/usuarios', { params }),
  desactivarUsuario: (id) => api.patch(`/admin/usuarios/${id}/desactivar`),
  obtenerEstadisticas: () => api.get('/admin/estadisticas'),
}

// ===== BÚSQUEDA Y FILTRADO =====
export const busqueda = {
  buscar: (query, params) => api.get('/busqueda', { params: { q: query, ...params } }),
  filtrar: (params) => api.get('/objetos/filtrados', { params }),
}

export default api
