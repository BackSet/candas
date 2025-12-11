# Frontend React - Candas

Frontend desarrollado con React + Vite para el sistema de logística Candas.

## Requisitos

- Node.js 18+ 
- npm o yarn

## Instalación

```bash
# Instalar dependencias
npm install

# O con yarn
yarn install
```

## Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# El frontend estará disponible en http://localhost:3000
```

## Build para Producción

```bash
# Compilar para producción
npm run build

# Los archivos compilados se generarán en ../static/react/
```

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/      # Componentes reutilizables
│   ├── contexts/        # Context API (Auth, etc.)
│   ├── pages/           # Páginas/Views
│   ├── services/        # Servicios API
│   ├── App.jsx         # Componente principal
│   └── main.jsx        # Punto de entrada
├── index.html
├── package.json
└── vite.config.js
```

## Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del frontend:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Tecnologías

- **React 18**: Framework de UI
- **Vite**: Build tool y dev server
- **React Router**: Navegación
- **Axios**: Cliente HTTP
- **Tailwind CSS**: Framework CSS
- **Flowbite React**: Componentes UI basados en Tailwind
- **React Toastify**: Notificaciones
- **Font Awesome**: Iconos

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Compila para producción
- `npm run preview`: Previsualiza el build de producción
- `npm run lint`: Ejecuta el linter
