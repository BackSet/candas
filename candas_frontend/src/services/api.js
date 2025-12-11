import axios from 'axios'
import logger from '../utils/logger'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  withCredentials: true, // Importante para cookies de sesión de Django
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos de timeout
})

// Interceptor para agregar CSRF token a las peticiones
api.interceptors.request.use(
  async (config) => {
    // Obtener CSRF token de las cookies
    const csrftoken = getCookie('csrftoken')
    if (csrftoken) {
      config.headers['X-CSRFToken'] = csrftoken
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Solo loggear errores críticos
    if (error.response?.status >= 500) {
      logger.error('Error del servidor:', error.response?.status, error.response?.data)
    } else if (error.response?.status === 401) {
      // No loggear 401 ya que es esperado cuando no hay sesión
      // No redirigir automáticamente, dejar que el AuthContext lo maneje
    } else if (error.code === 'ECONNABORTED') {
      logger.error('Timeout en petición:', error.config?.url)
    }
    
    return Promise.reject(error)
  }
)

// Función auxiliar para obtener cookies usando métodos modernos de array
function getCookie(name) {
  if (!document.cookie) return null
  
  const cookie = document.cookie
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith(`${name}=`))
  
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null
}

export default api
