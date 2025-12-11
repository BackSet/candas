import { useEffect, useRef, useCallback } from 'react'

/**
 * Selectores de elementos focusables
 */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]',
  'audio[controls]',
  'video[controls]',
  'details > summary:first-of-type',
].join(', ')

/**
 * Hook para atrapar el foco dentro de un contenedor (modal, dialog, etc.)
 * @param {boolean} isActive - Si la trampa está activa
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.autoFocus - Auto-focus al primer elemento
 * @param {boolean} options.restoreFocus - Restaurar foco al cerrar
 * @param {string} options.initialFocusSelector - Selector del elemento inicial
 * @returns {React.RefObject} Ref para el contenedor
 */
export const useFocusTrap = (isActive = false, options = {}) => {
  const {
    autoFocus = true,
    restoreFocus = true,
    initialFocusSelector = null,
  } = options

  const containerRef = useRef(null)
  const previousActiveElement = useRef(null)

  /**
   * Obtiene todos los elementos focusables dentro del contenedor
   */
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return []
    
    const elements = containerRef.current.querySelectorAll(FOCUSABLE_SELECTORS)
    return Array.from(elements).filter(el => {
      // Verificar que el elemento es visible
      const style = window.getComputedStyle(el)
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             el.offsetParent !== null
    })
  }, [])

  /**
   * Maneja la navegación con Tab
   */
  const handleKeyDown = useCallback((event) => {
    if (!isActive || event.key !== 'Tab') return

    const focusableElements = getFocusableElements()
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    const activeElement = document.activeElement

    // Shift + Tab: ir al último si estamos en el primero
    if (event.shiftKey) {
      if (activeElement === firstElement || !containerRef.current?.contains(activeElement)) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab: ir al primero si estamos en el último
      if (activeElement === lastElement || !containerRef.current?.contains(activeElement)) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }, [isActive, getFocusableElements])

  /**
   * Efecto para guardar el elemento activo anterior
   */
  useEffect(() => {
    if (isActive && restoreFocus) {
      previousActiveElement.current = document.activeElement
    }
  }, [isActive, restoreFocus])

  /**
   * Efecto para auto-focus
   */
  useEffect(() => {
    if (!isActive || !autoFocus) return

    // Pequeño delay para asegurar que el contenedor está renderizado
    const timeoutId = setTimeout(() => {
      if (!containerRef.current) return

      let elementToFocus = null

      // Buscar elemento inicial por selector
      if (initialFocusSelector) {
        elementToFocus = containerRef.current.querySelector(initialFocusSelector)
      }

      // Si no hay selector o no se encontró, usar el primer elemento focusable
      if (!elementToFocus) {
        const focusableElements = getFocusableElements()
        elementToFocus = focusableElements[0]
      }

      // Hacer focus si se encontró un elemento
      if (elementToFocus) {
        elementToFocus.focus()
      }
    }, 50)

    return () => clearTimeout(timeoutId)
  }, [isActive, autoFocus, initialFocusSelector, getFocusableElements])

  /**
   * Efecto para restaurar foco al desactivar
   */
  useEffect(() => {
    if (!isActive && restoreFocus && previousActiveElement.current) {
      const elementToRestore = previousActiveElement.current
      
      // Pequeño delay para evitar conflictos
      setTimeout(() => {
        if (elementToRestore && typeof elementToRestore.focus === 'function') {
          elementToRestore.focus()
        }
      }, 50)
      
      previousActiveElement.current = null
    }
  }, [isActive, restoreFocus])

  /**
   * Efecto para manejar Tab
   */
  useEffect(() => {
    if (!isActive) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive, handleKeyDown])

  return containerRef
}

/**
 * Hook para focus en el primer elemento al montar
 * @param {boolean} shouldFocus - Si debe hacer focus
 * @returns {React.RefObject} Ref para el elemento
 */
export const useAutoFocus = (shouldFocus = true) => {
  const elementRef = useRef(null)

  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      elementRef.current.focus()
    }
  }, [shouldFocus])

  return elementRef
}

export default useFocusTrap

