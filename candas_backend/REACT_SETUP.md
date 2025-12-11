# Guía de Configuración React + Django REST Framework

Esta guía explica cómo configurar y usar el frontend React con el backend Django.

## 📋 Requisitos Previos

1. **Node.js 18+** instalado
2. **Python 3.10+** instalado
3. **PostgreSQL** configurado (o la base de datos que uses)

## 🚀 Pasos de Instalación

### 1. Instalar dependencias de Python

```bash
pip install -r requirements.txt
```

Esto instalará `django-cors-headers` que es necesario para permitir peticiones desde React.

### 2. Instalar dependencias de Node.js

```bash
cd frontend
npm install
```

### 3. Configurar CORS en Django

Ya está configurado en `config/settings/base.py`. Asegúrate de que:

- `corsheaders` esté en `INSTALLED_APPS`
- `CorsMiddleware` esté en `MIDDLEWARE` (antes de `CommonMiddleware`)
- `CORS_ALLOWED_ORIGINS` incluya `http://localhost:3000`

### 4. Ejecutar migraciones de Django

```bash
python manage.py migrate
```

## 🏃 Ejecutar el Proyecto

### Terminal 1: Backend Django

```bash
python manage.py runserver
```

El backend estará en `http://127.0.0.1:8000`

### Terminal 2: Frontend React

```bash
cd frontend
npm run dev
```

El frontend estará en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
candas/
├── frontend/              # Aplicación React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── contexts/       # Context API (Auth)
│   │   ├── pages/         # Páginas/Vistas
│   │   ├── services/       # Servicios API
│   │   └── ...
│   └── package.json
├── apps/
│   ├── core/
│   │   └── api/           # Endpoints de autenticación
│   ├── logistics/
│   │   └── api/           # API de Pulls
│   └── packages/
│       └── api/           # API de Paquetes
└── config/
    └── settings/          # Configuración Django
```

## 🔐 Autenticación

El sistema usa **Session Authentication** de Django:

1. El frontend obtiene el token CSRF desde `/api/v1/auth/csrf/`
2. Envía credenciales a `/api/v1/auth/login/` con el token CSRF
3. Django crea una sesión y devuelve cookies
4. Las siguientes peticiones incluyen automáticamente las cookies

## 🔌 Endpoints API Disponibles

### Autenticación
- `GET /api/v1/auth/csrf/` - Obtener token CSRF
- `POST /api/v1/auth/login/` - Iniciar sesión
- `POST /api/v1/auth/logout/` - Cerrar sesión
- `GET /api/v1/auth/user/` - Obtener usuario actual

### Pulls (Sacas)
- `GET /api/v1/logistics/pulls/` - Listar sacas
- `POST /api/v1/logistics/pulls/` - Crear saca
- `GET /api/v1/logistics/pulls/{id}/` - Detalle de saca
- `PATCH /api/v1/logistics/pulls/{id}/` - Actualizar saca
- `DELETE /api/v1/logistics/pulls/{id}/` - Eliminar saca

### Paquetes
- `GET /api/v1/packages/packages/` - Listar paquetes
- `GET /api/v1/packages/packages/{id}/` - Detalle de paquete
- `POST /paquetes/api/validate-for-pull/` - Validar paquete para pull

## 🛠️ Desarrollo

### Agregar una nueva página

1. Crear componente en `frontend/src/pages/`
2. Agregar ruta en `frontend/src/App.jsx`
3. Agregar link en `frontend/src/components/Sidebar.jsx` (si aplica)

### Agregar un nuevo servicio API

1. Crear archivo en `frontend/src/services/`
2. Importar y usar en los componentes

Ejemplo:

```javascript
// frontend/src/services/miServicio.js
import api from './api'

export const miServicio = {
  list: async () => {
    const response = await api.get('/api/v1/mi-endpoint/')
    return response.data
  }
}
```

## 🏗️ Build para Producción

### Frontend

```bash
cd frontend
npm run build
```

Los archivos compilados se generarán en `static/react/`

### Backend

```bash
python manage.py collectstatic
```

## 🐛 Solución de Problemas

### Error de CORS

- Verifica que `django-cors-headers` esté instalado
- Verifica que `CorsMiddleware` esté en `MIDDLEWARE`
- Verifica que `CORS_ALLOWED_ORIGINS` incluya tu URL de frontend

### Error 401 (No autenticado)

- Verifica que las cookies se estén enviando (`withCredentials: true` en axios)
- Verifica que el token CSRF se esté enviando en los headers

### Error 403 (CSRF)

- Asegúrate de obtener el token CSRF antes de hacer POST/PUT/DELETE
- Verifica que el header `X-CSRFToken` esté presente

## 📚 Recursos

- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)

## 🎯 Próximos Pasos

1. ✅ Configuración básica completada
2. ⏳ Migrar más páginas de Django templates a React
3. ⏳ Agregar más funcionalidades (búsqueda, filtros, paginación)
4. ⏳ Implementar manejo de errores más robusto
5. ⏳ Agregar tests unitarios
