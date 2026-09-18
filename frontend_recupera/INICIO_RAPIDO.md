# 🚀 INICIO RÁPIDO - Recupera+ Frontend

## En 5 Minutos Tendrás Todo Funcionando

### Paso 1: Descargar los Archivos

1. Ve a `/home/claude/recupera_frontend_code/`
2. Copia TODA la carpeta a tu VS Code en: `C:\Users\{tuUsuario}\OneDrive\Desktop\Frontend_Sando` (o donde tengas tu proyecto)

O usando terminal:
```bash
# Si estás en Windows PowerShell
Copy-Item -Path "C:\home\claude\recupera_frontend_code\*" -Destination "C:\Users\{tu usuario}\Desktop\Frontend_Sando" -Recurse -Force
```

### Paso 2: Instalar Dependencias

Abre terminal en VS Code (Ctrl + ñ) y escribe:

```bash
npm install
```

Espera a que termine (toma 2-3 minutos).

### Paso 3: Crear Archivo .env

En la raíz del proyecto (mismo nivel que `package.json`), crea un archivo llamado `.env`:

Contenido:
```
REACT_APP_API_URL=http://localhost:3001/api
```

### Paso 4: Ejecutar el Proyecto

En la terminal, escribe:

```bash
npm run dev
```

Deberías ver algo como:
```
VITE v5.0.0  ready in 456 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### Paso 5: Abrir en el Navegador

Ve a: **http://localhost:5173/**

¡Verás la pantalla de Login!

### Paso 6: Probar el Login

Usa estas credenciales (datos mock por ahora):
- **Email**: `santiago.perez@intec.edu.do`
- **Contraseña**: `password123`

O regístrate con una nueva cuenta.

## 📋 Lo Que Ya Está Funcional

✅ **Login** - Inicia sesión
✅ **Registro** - Crea nueva cuenta
✅ **Dashboard** - Panel principal con estadísticas
✅ **Reportar Objeto Perdido** - Crear reporte con foto
✅ **Reportar Objeto Encontrado** - Registrar objeto encontrado
✅ **Navegación** - Barra de navegación completa
✅ **Protección de Rutas** - Solo usuarios autenticados pueden acceder

## 📝 Lo Que Falta Completar

Las siguientes páginas son **STUBS** (estructuras básicas):
- Mis Objetos
- Buscar Objetos
- Coincidencias
- Detalles de Objeto
- Mi Perfil
- Verificación de Pertenencia
- Mensajería
- Administración

Para completarlas, **lee la `GUIA_DESARROLLO.md`** - tiene ejemplos listos para copiar y pegar.

## 🔌 Conectar con el Backend

Cuando tengas tu backend corriendo en `http://localhost:3001`, simplemente:

1. Asegúrate que el backend esté ejecutándose
2. Verifica que `REACT_APP_API_URL` en `.env` es correcto
3. El frontend automáticamente enviará peticiones al backend

Lee `API_REFERENCE.md` para ver exactamente qué endpoints espera el backend.

## 🛠️ Comandos Útiles

```bash
# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm build

# Vista previa de build
npm run preview

# Linting (verificar código)
npm run lint
```

## 📁 Estructura de Carpetas Importante

Después de `npm install`, verás:

```
frontend_recupera/
├── node_modules/          # Librerías (no tocar)
├── src/                   # TU CÓDIGO
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── ...
├── package.json           # Dependencias
├── .env                   # Variables de entorno
└── vite.config.js         # Configuración
```

**Solo modifica la carpeta `src/`**

## 🔍 Dónde Editar Para Agregar Características

### Para agregar una página nueva:
1. Crea `src/pages/MiPagina.jsx`
2. Añade la ruta en `src/App.jsx`
3. Agrega el link en `src/components/Navigation.jsx`

### Para agregar un nuevo endpoint:
1. Abre `src/services/api.js`
2. Agrégalo en la sección correspondiente
3. Úsalo en tus componentes con `import { tuServicio } from '../services/api'`

### Para cambiar colores:
1. Abre `src/index.css`
2. Modifica las variables CSS en la sección `:root`
3. Los cambios son automáticos en todo el app

## 🐛 Errores Comunes y Soluciones

### Error: `ENOENT: no such file or directory`
```bash
# Solución: reinstalar node_modules
rm -r node_modules
npm install
```

### Error: `Port 5173 already in use`
```bash
# El puerto está en uso, usa otro:
npm run dev -- --port 5174
```

### Error: `Cannot find module 'react'`
```bash
# Falta instalar dependencias:
npm install
```

### El backend no responde
- Verificar que el backend está corriendo en `http://localhost:3001`
- Verificar que CORS está habilitado en el backend
- Revisar la consola del navegador (F12 > Console)

## 📱 Probar en Móvil

### En la misma red:
1. Obtén tu IP local: `ipconfig` (Windows) o `ifconfig` (Mac/Linux)
2. Abre en tu móvil: `http://{tu-ip}:5173`

### Con ngrok (acceso público):
```bash
npm install -g ngrok
ngrok http 5173
```

## 🎯 Next Steps

1. **Completar stubs**: Usa `GUIA_DESARROLLO.md`
2. **Conectar backend**: Implementa los endpoints de `API_REFERENCE.md`
3. **Testing**: Prueba todas las funcionalidades
4. **Deploy**: Sube a producción (Vercel, Netlify, etc.)

## 📚 Documentación Disponible

Lee estos archivos en orden:
1. `README.md` - Visión general
2. `GUIA_DESARROLLO.md` - Cómo completar las páginas
3. `API_REFERENCE.md` - Qué endpoints necesita tu backend
4. `RESUMEN_PROYECTO.md` - Resumen de lo que se creó

## ✅ Checklist

- [ ] Copié todos los archivos al proyecto
- [ ] Ejecuté `npm install`
- [ ] Creé el archivo `.env`
- [ ] Ejecuté `npm run dev`
- [ ] Abrí `http://localhost:5173` en el navegador
- [ ] La página de login aparece correctamente
- [ ] Intenté registrarme o hacer login
- [ ] Veré el dashboard si todo funciona

## 🎉 ¡Listo!

Si llegaste hasta aquí, tu frontend está correctamente configurado.

**Próxima tarea**: Leer `GUIA_DESARROLLO.md` para completar las páginas restantes.

---

**Tiempo estimado para completar el proyecto**: 8-10 horas (incluyendo backend)

**Soporte**: Si tienes problemas, verifica que los puertos 3001 (backend) y 5173 (frontend) estén disponibles.

¡Que disfrutes desarrollando Recupera+! 🚀
