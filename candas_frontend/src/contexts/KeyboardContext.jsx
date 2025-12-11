import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

/**
 * Contexto para gestión global de atajos de teclado
 */
const KeyboardContext = createContext(null)

/**
 * Atajos globales por defecto
 */
const DEFAULT_SHORTCUTS = {
  '/': {
    key: '/',
    description: 'Ir a búsqueda de paquetes',
    category: 'Navegación',
  },
  'Escape': {
    key: 'Escape',
    description: 'Cerrar modal o menú',
    category: 'General',
  },
  '?': {
    key: '?',
    description: 'Mostrar atajos de teclado',
    category: 'Ayuda',
  },
  'g+h': {
    key: 'g h',
    description: 'Ir al Dashboard',
    category: 'Navegación',
  },
  'g+p': {
    key: 'g p',
    description: 'Ir a Paquetes',
    category: 'Navegación',
  },
  'g+l': {
    key: 'g l',
    description: 'Ir a Logística',
    category: 'Navegación',
  },
  'g+r': {
    key: 'g r',
    description: 'Ir a Reportes',
    category: 'Navegación',
  },
  'n': {
    key: 'n',
    description: 'Nuevo elemento',
    category: 'Acciones',
  },
}

/**
 * Provider del contexto de teclado
 */
export const KeyboardProvider = ({ children }) => {
  const [shortcuts, setShortcuts] = useState(DEFAULT_SHORTCUTS)
  const [showHelp, setShowHelp] = useState(false)
  const [isEnabled, setIsEnabled] = useState(true)
  const [pendingKey, setPendingKey] = useState(null)
  
  const handlersRef = useRef({})
  const pendingKeyTimeoutRef = useRef(null)

  /**
   * Registra un handler para un atajo
   */
  const registerShortcut = useCallback((key, handler, options = {}) => {
    const { description = '', category = 'General' } = options
    
    handlersRef.current[key] = handler
    
    setShortcuts(prev => ({
      ...prev,
      [key]: { key, description, category },
    }))

    // Retorna función para desregistrar
    return () => {
      delete handlersRef.current[key]
      setShortcuts(prev => {
        const newShortcuts = { ...prev }
        delete newShortcuts[key]
        return newShortcuts
      })
    }
  }, [])

  /**
   * Desregistra un atajo
   */
  const unregisterShortcut = useCallback((key) => {
    delete handlersRef.current[key]
    setShortcuts(prev => {
      const newShortcuts = { ...prev }
      delete newShortcuts[key]
      return newShortcuts
    })
  }, [])

  /**
   * Ejecuta un handler si existe
   */
  const executeShortcut = useCallback((key) => {
    const handler = handlersRef.current[key]
    if (handler && typeof handler === 'function') {
      handler()
      return true
    }
    return false
  }, [])

  /**
   * Detecta si hay un modal abierto
   */
  const isModalOpen = useCallback(() => {
    // Buscar modales de Flowbite abiertos
    const flowbiteModal = document.querySelector('[data-testid="flowbite-modal"]')
    const modalBackdrop = document.querySelector('[class*="fixed"][class*="inset-0"][class*="z-50"]')
    return !!(flowbiteModal || modalBackdrop || showHelp)
  }, [showHelp])

  /**
   * Maneja eventos de teclado global
   */
  const handleKeyDown = useCallback((event) => {
    if (!isEnabled) return

    // Ignorar si está en input/textarea (excepto Escape y ?)
    const activeElement = document.activeElement
    const tagName = activeElement?.tagName?.toUpperCase()
    const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName)
    const isContentEditable = activeElement?.isContentEditable
    
    // Si hay un modal abierto, solo permitir Escape y ?
    const modalOpen = isModalOpen()
    
    if (isInputFocused || isContentEditable) {
      if (event.key !== 'Escape' && !(event.key === '?' && event.shiftKey)) {
        return
      }
    }

    // Atajos especiales que siempre funcionan
    if (event.key === '?' && event.shiftKey) {
      event.preventDefault()
      setShowHelp(prev => !prev)
      return
    }

    if (event.key === 'Escape') {
      // Cerrar help si está abierto
      if (showHelp) {
        event.preventDefault()
        setShowHelp(false)
        return
      }
      // Ejecutar handler de Escape si existe (para cerrar otros modales)
      if (executeShortcut('Escape')) {
        event.preventDefault()
      }
      return
    }

    // Si hay un modal abierto, no procesar otros atajos
    if (modalOpen) {
      return
    }

    // Construir la tecla
    let key = event.key
    
    // Manejar secuencias (ej: g + h)
    if (pendingKey) {
      key = `${pendingKey}+${event.key.toLowerCase()}`
      clearTimeout(pendingKeyTimeoutRef.current)
      setPendingKey(null)
      
      if (executeShortcut(key)) {
        event.preventDefault()
        return
      }
    }

    // Detectar inicio de secuencia (tecla 'g')
    if (event.key === 'g' && !event.ctrlKey && !event.altKey && !event.metaKey) {
      setPendingKey('g')
      pendingKeyTimeoutRef.current = setTimeout(() => {
        setPendingKey(null)
      }, 1000) // 1 segundo para completar la secuencia
      return
    }

    // Buscar y ejecutar atajo
    if (event.key === '/') {
      event.preventDefault()
      executeShortcut('/')
      return
    }

    if (event.key === 'n' && !event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault()
      executeShortcut('n')
      return
    }
  }, [isEnabled, pendingKey, executeShortcut, showHelp, isModalOpen])

  /**
   * Efecto para listeners globales
   */
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (pendingKeyTimeoutRef.current) {
        clearTimeout(pendingKeyTimeoutRef.current)
      }
    }
  }, [handleKeyDown])

  /**
   * Obtiene atajos agrupados por categoría
   */
  const getShortcutsByCategory = useCallback(() => {
    const categories = {}
    
    Object.values(shortcuts).forEach(shortcut => {
      const category = shortcut.category || 'General'
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(shortcut)
    })
    
    return categories
  }, [shortcuts])

  const value = {
    shortcuts,
    showHelp,
    setShowHelp,
    isEnabled,
    setIsEnabled,
    registerShortcut,
    unregisterShortcut,
    executeShortcut,
    getShortcutsByCategory,
    pendingKey,
  }

  return (
    <KeyboardContext.Provider value={value}>
      {children}
    </KeyboardContext.Provider>
  )
}

KeyboardProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

/**
 * Hook para usar el contexto de teclado
 */
export const useKeyboard = () => {
  const context = useContext(KeyboardContext)
  if (!context) {
    throw new Error('useKeyboard debe usarse dentro de un KeyboardProvider')
  }
  return context
}

/**
 * Hook para registrar un atajo de forma declarativa
 * @param {string} key - Tecla o combinación
 * @param {Function} handler - Función a ejecutar
 * @param {Object} options - Opciones { description, category }
 * @param {Array} deps - Dependencias del handler
 */
export const useShortcut = (key, handler, options = {}, deps = []) => {
  const { registerShortcut } = useKeyboard()

  useEffect(() => {
    const unregister = registerShortcut(key, handler, options)
    return unregister
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, registerShortcut, ...deps])
}

export default KeyboardContext

