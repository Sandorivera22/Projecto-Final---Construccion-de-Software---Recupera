# Recupera+ Frontend

Frontend en React + Bootstrap del Sistema de Gestión de Objetos Perdidos para INTEC.

## 📋 Descripción del Proyecto

Recupera+ es una plataforma que facilita el registro, búsqueda y recuperación de objetos perdidos y encontrados dentro del campus de INTEC. El sistema utiliza un algoritmo automático para detectar coincidencias entre objetos perdidos y encontrados.

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + Vite
- **UI Framework**: Bootstrap 5
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **CSS**: Bootstrap + Custom CSS

## 📦 Requisitos Previos

- Node.js (v16 o superior)
- npm o yarn
- Git

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/Sandorivera22/Proyecto-Final-Recupera.git
cd frontend_recupera
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env` en la raíz del proyecto:

```env
REACT_APP_API_URL=http://localhost:3001/api
```

### 4. Ejecutar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   └── Navigation.jsx  # Barra de navegación
├── pages/              # Páginas principales
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── ReportarPerdido.jsx
│   ├── ReportarEncontrado.jsx
│   ├── MisObjetos.jsx
│   ├── BuscarObjetos.jsx
│   ├── Coincidencias.jsx
│   ├── DetalleObjeto.jsx
│   ├── MiPerfil.jsx
│   ├── VerificacionPertenencia.jsx
│   ├── Mensajeria.jsx
│   └── Administracion.jsx
├── services/
│   └── api.js          # Configuración de Axios y endpoints
├── App.jsx             # Componente raíz
├── main.jsx            # Punto de entrada
└── index.css           # Estilos globales
```

## 🔌 Integración con Backend

### URL del API

Por defecto, el cliente intenta conectarse a `http://localhost:3001/api`. Puedes cambiar esto en `.env`.

### Endpoints Configurados

El archivo `src/services/api.js` contiene todas las funciones para comunicarse con el backend:

```javascript
// Autenticación
auth.login(email, password)
auth.register(data)
auth.logout()

// Usuarios
users.getProfile()
users.updateProfile(data)

// Objetos Perdidos
objetosPerdidos.crear(data)
objetosPerdidos.obtenerTodos(params)
objetosPerdidos.obtenerPorId(id)
objetosPerdidos.actualizar(id, data)
objetosPerdidos.eliminar(id)
objetosPerdidos.marcarRecuperado(id)

// Objetos Encontrados
objetosEncontrados.crear(data)
objetosEncontrados.obtenerTodos(params)
// ... más métodos

// Coincidencias
coincidencias.obtenerTodas()
coincidencias.obtenerMias()

// Reclamaciones
reclamaciones.crear(data)
reclamaciones.obtenerMias()
reclamaciones.enviarVerificacion(id, data)

// Mensajería
mensajeria.obtenerConversaciones()
mensajeria.enviarMensaje(conversacionId, mensaje)

// Administración
administracion.obtenerReportes(params)
administracion.desactivarReporte(id)
```

## 🎨 Personalización de Estilos

### Colores Principales

```css
--primary-color: #E63946;      /* Rojo principal */
--secondary-color: #457B9D;    /* Azul */
--success-color: #2A9D8F;      /* Verde */
--warning-color: #F4A261;      /* Naranja */
--danger-color: #E76F51;       /* Rojo peligro */
--light-bg: #F1FAEE;           /* Fondo claro */
```

Los estilos se pueden modificar en `src/index.css`.

## 📱 Páginas Implementadas

### Implementadas Completamente
- ✅ Login
- ✅ Register
- ✅ Dashboard
- ✅ Reportar Objeto Perdido
- ✅ Reportar Objeto Encontrado

### En Desarrollo (Stubs)
- 📝 Mis Objetos
- 📝 Buscar Objetos
- 📝 Coincidencias
- 📝 Detalles de Objeto
- 📝 Mi Perfil
- 📝 Verificación de Pertenencia
- 📝 Mensajería
- 📝 Administración

## 🔐 Autenticación

El sistema usa JWT (JSON Web Tokens) para autenticación:

1. Login/Register envía credenciales al backend
2. El backend retorna un token JWT y datos del usuario
3. El token se guarda en `localStorage`
4. Se envía en cada petición en el header `Authorization: Bearer {token}`
5. Si el token expira, el usuario es redirigido a login

## 🧪 Datos de Prueba para Login

```
Email: santiago.perez@intec.edu.do
Contraseña: password123
```

## 📝 Guía para Completar las Páginas

### Para cada página stub, sigue este patrón:

```jsx
import { useState, useEffect } from 'react'
import { Container } from 'react-bootstrap'
import { tuServicio } from '../services/api'

export default function TuPagina() {
  const [datos, setDatos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const { data } = await tuServicio.obtenerTodos()
        setDatos(data)
      } catch (err) {
        setError('Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }
    cargarDatos()
  }, [])

  // Tu JSX aquí
}
```

## 🐛 Troubleshooting

### Error: "Cannot find module 'bootstrap'"
```bash
npm install
```

### Error: "API connection refused"
- Verificar que el backend está corriendo en puerto 3001
- Verificar la variable `REACT_APP_API_URL` en `.env`

### Token expirado
- El usuario será redirigido a login automáticamente

## 📚 Documentación Adicional

- [Requerimientos Funcionales](./docs/REQUERIMIENTOS.md)
- [High Level Design](./docs/HIGH_LEVEL_DESIGN.pdf)
- [Figma Prototypes](https://figma.com/proyecto-recupera)

## 👥 Team

- Gabriel Rivera
- Juan Rafael Ramírez Montero
- Ángel Gabriel Guzman
- Enmanuel Marty
- Steven Manzueta

## 📄 Licencia

Este proyecto es propiedad de INTEC.

## 📞 Contacto

Para soporte o preguntas sobre el desarrollo, contactar al equipo de desarrollo.

---

**Última actualización**: Septiembre 2026
**Estado del Proyecto**: En desarrollo
