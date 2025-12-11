import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import logger from '../utils/logger'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const checkAuth = useCallback(async () => {
    try {
      // Intentar obtener información del usuario desde Django
      const response = await api.get('/api/v1/auth/user/', {
        withCredentials: true  // Asegurar que las cookies se envían
      })
      logger.log('checkAuth response:', response.data)
      if (response.data && !response.data.error) {
        setUser(response.data)
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch (error) {
      // No loggear errores 401 ya que son esperados cuando no hay sesión
      if (error.response?.status !== 401) {
        logger.error('Error en checkAuth:', error.response?.status, error.response?.data)
      }
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Verificar si el usuario está autenticado
    checkAuth()
  }, [checkAuth])

  const login = async (username, password) => {
    try {
      setLoading(true)
      
      // Django usa CSRF token, necesitamos obtenerlo primero
      const csrfResponse = await api.get('/api/v1/auth/csrf/')
      const csrftoken = csrfResponse.data.csrftoken
      
      // Login con Django session
      const response = await api.post('/api/v1/auth/login/', {
        username,
        password
      }, {
        headers: {
          'X-CSRFToken': csrftoken
        },
        withCredentials: true
      })

      logger.log('Login response:', response.data)

      if (response.data?.success) {
        // Actualizar el estado inmediatamente con los datos del usuario
        const userData = response.data.user ?? {
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
          is_staff: response.data.is_staff,
        }
        
        logger.log('Setting user data:', userData)
        setUser(userData)
        setIsAuthenticated(true)
        setLoading(false)
        
        // Verificar autenticación para asegurar que todo está bien
        try {
          await checkAuth()
        } catch (err) {
          // Si checkAuth falla, aún así mantenemos la autenticación
          logger.warn('checkAuth falló después del login:', err)
        }
        
        return { success: true }
      }
      setLoading(false)
      return { success: false, error: 'Credenciales inválidas' }
    } catch (error) {
      logger.error('Error en login:', error)
      setLoading(false)
      return { 
        success: false, 
        error: error.response?.data?.error ?? error.message ?? 'Error al iniciar sesión' 
      }
    }
  }

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout/', {}, { withCredentials: true })
    } catch (error) {
      logger.error('Error al cerrar sesión:', error)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      login,
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
