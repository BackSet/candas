import { useEffect, useCallback, useRef } from 'react'

/**
 * Hook para manejar atajos de teclado globales
 * @param {Object} shortcuts - Objeto con atajos { key: callback }
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.enabled - Si los atajos están habilitados
 * @param {boolean} options.preventDefault - Si debe prevenir el comportamiento por defecto
 * @param {string[]} options.ignoredTags - Tags HTML a ignorar (input, textarea, etc.)
 */
export const useKeyboardShortcuts = (shortcuts = {}, options = {}) => {
  const {
    enabled = true,
    preventDefault = true,
    ignoredTags = ['INPUT', 'TEXTAREA', 'SELECT'],
  } = options

  const shortcutsRef = useRef(shortcuts)

  // Actualizar ref cuando cambien los shortcuts
  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return

    // Ignorar si el foco está en un elemento de entrada
    const activeElement = document.activeElement
    const tagName = activeElement?.tagName?.toUpperCase()
    
    if (ignoredTags.includes(tagName)) {
      // Solo permitir Escape en elementos de entrada
      if (event.key !== 'Escape') return
    }

    // Construir la tecla con modificadores
    const key = buildKeyString(event)
    
    // Buscar el atajo
    const callback = shortcutsRef.current[key] || shortcutsRef.current[event.key]
    
    if (callback && typeof callback === 'function') {
      if (preventDefault) {
        event.preventDefault()
        event.stopPropagation()
      }
      callback(event)
    }
  }, [enabled, preventDefault, ignoredTags])

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])
}

/**
 * Construye una cadena de tecla con modificadores
 * Ej: "Ctrl+Shift+S", "Alt+N"
 */
const buildKeyString = (event) => {
  const parts = []
  
  if (event.ctrlKey || event.metaKey) parts.push('Ctrl')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')
  
  // Normalizar tecla
  let key = event.key
  if (key === ' ') key = 'Space'
  if (key.length === 1) key = key.toUpperCase()
  
  parts.push(key)
  
  return parts.join('+')
}

/**
 * Hook simplificado para un solo atajo
 * @param {string} key - Tecla o combinación
 * @param {Function} callback - Función a ejecutar
 * @param {Object} options - Opciones
 */
export const useKeyPress = (key, callback, options = {}) => {
  useKeyboardShortcuts({ [key]: callback }, options)
}

/**
 * Hook para cerrar con Escape
 * @param {Function} onClose - Función a ejecutar al presionar Escape
 * @param {boolean} enabled - Si está habilitado
 */
export const useEscapeKey = (onClose, enabled = true) => {
  useKeyPress('Escape', onClose, { 
    enabled, 
    ignoredTags: [] // Escape siempre funciona
  })
}

export default useKeyboardShortcuts

