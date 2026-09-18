# API Reference - Recupera+ Backend

## Base URL
```
http://localhost:3001/api
```

## Autenticación
Todos los endpoints (excepto login/register) requieren header:
```
Authorization: Bearer {token}
Content-Type: application/json
```

---

## 🔐 AUTENTICACIÓN

### POST /auth/login
Inicia sesión con credenciales.

**Request:**
```json
{
  "email": "usuario@intec.edu.do",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "nombre": "Santiago Pérez",
    "email": "usuario@intec.edu.do",
    "role": "user",
    "matricula": "1104256"
  }
}
```

### POST /auth/register
Registra un nuevo usuario.

**Request:**
```json
{
  "nombre": "Santiago Pérez",
  "email": "usuario@intec.edu.do",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

### POST /auth/logout
Cierra la sesión del usuario.

---

## 👤 USUARIOS

### GET /users/profile
Obtiene el perfil del usuario autenticado.

**Response (200):**
```json
{
  "id": "uuid",
  "nombre": "Santiago Pérez",
  "email": "usuario@intec.edu.do",
  "role": "user",
  "matricula": "1104256",
  "carrera": "Ingeniería de Software",
  "createdAt": "2026-08-15T10:00:00Z"
}
```

### PUT /users/profile
Actualiza el perfil del usuario.

**Request:**
```json
{
  "nombre": "Santiago Pérez",
  "telefono": "+1 (809) 567-9226"
}
```

### DELETE /users/profile
Elimina la cuenta del usuario.

---

## 📌 OBJETOS PERDIDOS

### POST /objetos-perdidos
Crear nuevo reporte de objeto perdido.

**Request:**
```json
{
  "nombre": "Laptop Dell Vostro",
  "categoria": "Tecnología",
  "ubicacionDetallada": "Edificio FD - Nivel 2",
  "fechaExtraviado": "2026-10-15T14:30:00Z",
  "descripcionFisica": "Laptop gris oscuro con sticker de INTEC...",
  "informacionContacto": "santiago.perez@intec.edu.do"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "nombre": "Laptop Dell Vostro",
  "estado": "Activo",
  "usuarioId": "uuid",
  "createdAt": "2026-10-15T15:00:00Z"
}
```

### GET /objetos-perdidos
Lista objetos perdidos con filtros opcionales.

**Query Parameters:**
- `categoria`: string
- `ubicacion`: string
- `estado`: "Activo" | "Recuperado"
- `page`: number
- `limit`: number

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "nombre": "Laptop Dell Vostro",
      "categoria": "Tecnología",
      "estado": "Activo",
      "ubicacionDetallada": "Edificio FD - Nivel 2",
      "fechaExtraviado": "2026-10-15T14:30:00Z"
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 10
}
```

### GET /objetos-perdidos/:id
Obtiene detalles de un objeto perdido específico.

### PUT /objetos-perdidos/:id
Actualiza un objeto perdido (solo el dueño).

### DELETE /objetos-perdidos/:id
Elimina un objeto perdido (solo el dueño).

### PATCH /objetos-perdidos/:id/recuperado
Marca un objeto como recuperado.

### GET /objetos-perdidos/mis-reportes/mis-reportes
Obtiene los reportes de objetos perdidos del usuario actual.

---

## ✅ OBJETOS ENCONTRADOS

Los endpoints son similares a objetos perdidos, con base `/objetos-encontrados`.

### POST /objetos-encontrados
Crear nuevo reporte de objeto encontrado.

### GET /objetos-encontrados
Lista objetos encontrados.

### GET /objetos-encontrados/:id
Obtiene detalles de un objeto encontrado.

### PUT /objetos-encontrados/:id
Actualiza un objeto encontrado.

### DELETE /objetos-encontrados/:id
Elimina un objeto encontrado.

### PATCH /objetos-encontrados/:id/entregado
Marca un objeto como entregado.

---

## ⚡ COINCIDENCIAS

### GET /coincidencias
Lista todas las coincidencias detectadas por el sistema.

**Response (200):**
```json
{
  "data": [
    {
      "id": "#MC-001",
      "objetoPerdido": {
        "id": "uuid",
        "nombre": "Laptop Dell Vostro 3400"
      },
      "objetoEncontrado": {
        "id": "uuid",
        "nombre": "Laptop Dell Gris"
      },
      "porcentajeSimilitud": 95,
      "estado": "Activa",
      "razonCoincidencia": ["categoria", "ubicacion", "fecha"]
    }
  ]
}
```

### GET /coincidencias/:id
Obtiene detalles de una coincidencia.

### GET /coincidencias/mis-coincidencias/mis-coincidencias
Obtiene las coincidencias relacionadas con los reportes del usuario.

---

## 📋 RECLAMACIONES

### POST /reclamaciones
Crea una reclamación de un usuario sobre un objeto encontrado.

**Request:**
```json
{
  "objetoEncontradoId": "uuid",
  "motivo": "Creo que este es mi objeto"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "objetoEncontradoId": "uuid",
  "usuarioId": "uuid",
  "estado": "En revisión",
  "createdAt": "2026-10-22T10:00:00Z"
}
```

### GET /reclamaciones
Lista todas las reclamaciones (admin only).

### GET /reclamaciones/mis-reclamaciones/mis-reclamaciones
Obtiene las reclamaciones del usuario actual.

### POST /reclamaciones/:id/verificacion
Envía información de verificación de pertenencia.

**Request:**
```json
{
  "respuestas": [
    {
      "preguntaId": "uuid",
      "respuesta": "Tiene un sticker de INTEC en la esquina derecha"
    }
  ],
  "evidencia": "archivo.pdf"
}
```

### POST /reclamaciones/:id/verificar
Verifica la pertenencia (admin only).

**Request:**
```json
{
  "aprobado": true,
  "comentarios": "Información verificada correctamente"
}
```

---

## 💬 MENSAJERÍA

### GET /mensajes/conversaciones
Lista todas las conversaciones del usuario.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "usuarioOtro": {
      "id": "uuid",
      "nombre": "Otro Usuario"
    },
    "ultimoMensaje": "¿Sigue disponible?",
    "fechaUltimo": "2026-10-22T14:30:00Z"
  }
]
```

### GET /mensajes/conversaciones/:id
Obtiene mensajes de una conversación específica.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "conversacionId": "uuid",
    "remitente": "uuid",
    "contenido": "Hola, ¿sigue disponible el objeto?",
    "createdAt": "2026-10-22T14:30:00Z"
  }
]
```

### POST /mensajes/conversaciones/:id
Envía un mensaje en una conversación.

**Request:**
```json
{
  "mensaje": "Hola, ¿sigue disponible?"
}
```

### POST /mensajes/conversaciones
Crea una nueva conversación.

**Request:**
```json
{
  "usuarioId": "uuid"
}
```

---

## ⚙️ ADMINISTRACIÓN

### GET /admin/reportes
Lista todos los reportes (admin only).

**Query Parameters:**
- `tipo`: "perdido" | "encontrado"
- `estado`: "activo" | "inactivo"
- `page`: number

### PATCH /admin/reportes/:id/desactivar
Desactiva un reporte por incumplimiento.

**Request:**
```json
{
  "razon": "Contenido ofensivo"
}
```

### GET /admin/usuarios
Lista todos los usuarios (admin only).

### PATCH /admin/usuarios/:id/desactivar
Desactiva una cuenta de usuario.

### GET /admin/estadisticas
Obtiene estadísticas del sistema.

**Response (200):**
```json
{
  "totalUsuarios": 150,
  "totalReportesPerdidos": 45,
  "totalReportesEncontrados": 38,
  "tasaRecuperacion": 85,
  "coincidenciasActivas": 12
}
```

---

## 🔍 BÚSQUEDA Y FILTRADO

### GET /busqueda
Búsqueda general de objetos.

**Query Parameters:**
- `q`: string (término de búsqueda)
- `tipo`: "perdido" | "encontrado" | "ambos"
- `categoria`: string
- `ubicacion`: string

### GET /objetos/filtrados
Obtiene objetos con filtros avanzados.

**Query Parameters:**
- `categoria`: string
- `ubicacion`: string
- `estado`: string
- `fechaDesde`: date
- `fechaHasta`: date

---

## ⚠️ Error Responses

Todos los errores devuelven el siguiente formato:

```json
{
  "error": "Error message",
  "status": 400,
  "details": "Additional details if available"
}
```

### Códigos de Error Comunes

- `400 Bad Request`: Datos inválidos
- `401 Unauthorized`: Token inválido o expirado
- `403 Forbidden`: No tienes permiso
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Duplicado o conflicto
- `500 Internal Server Error`: Error del servidor

---

## 📝 Notas para el Backend

1. **Autenticación**: Usar JWT con secreto seguro
2. **Coincidencias**: Algoritmo que compara categoría, ubicación, fecha y descripción
3. **Privacidad**: Ocultar emails y teléfonos completos en respuestas públicas
4. **Validación**: Validar que emails terminen con @intec.edu.do
5. **Rate Limiting**: Implementar limites para prevenir abuso

---

**Última actualización**: Septiembre 2026
**Versión API**: 1.0
