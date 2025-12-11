import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook para navegación con flechas en listas o galerías
 * @param {Object} options - Opciones de configuración
 * @param {number} options.itemCount - Número total de elementos
 * @param {string} options.orientation - 'vertical' | 'horizontal' | 'grid'
 * @param {number} options.columnsCount - Número de columnas (solo para grid)
 * @param {boolean} options.loop - Si debe hacer loop al llegar al final
 * @param {Function} options.onSelect - Callback al presionar Enter
 * @param {Function} options.onChange - Callback cuando cambia el índice
 * @param {number} options.initialIndex - Índice inicial
 * @returns {Object} { activeIndex, setActiveIndex, containerProps, getItemProps }
 */
export const useArrowNavigation = (options = {}) => {
  const {
    itemCount = 0,
    orientation = 'vertical',
    columnsCount = 1,
    loop = true,
    onSelect = null,
    onChange = null,
    initialIndex = 0,
  } = options

  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const containerRef = useRef(null)
  const itemRefs = useRef([])

  /**
   * Actualiza el índice activo con validación
   */
  const updateIndex = useCallback((newIndex) => {
    if (itemCount === 0) return

    let finalIndex = newIndex

    if (loop) {
      // Loop: ir al otro extremo
      if (finalIndex < 0) finalIndex = itemCount - 1
      if (finalIndex >= itemCount) finalIndex = 0
    } else {
      // Sin loop: limitar al rango
      finalIndex = Math.max(0, Math.min(itemCount - 1, finalIndex))
    }

    if (finalIndex !== activeIndex) {
      setActiveIndex(finalIndex)
      onChange?.(finalIndex)
      
      // Scroll al elemento si es necesario
      const itemElement = itemRefs.current[finalIndex]
      if (itemElement) {
        itemElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [activeIndex, itemCount, loop, onChange])

  /**
   * Maneja las teclas de navegación
   */
  const handleKeyDown = useCallback((event) => {
    const { key } = event

    // Navegación vertical
    if (orientation === 'vertical' || orientation === 'grid') {
      if (key === 'ArrowUp') {
        event.preventDefault()
        const step = orientation === 'grid' ? columnsCount : 1
        updateIndex(activeIndex - step)
        return
      }
      if (key === 'ArrowDown') {
        event.preventDefault()
        const step = orientation === 'grid' ? columnsCount : 1
        updateIndex(activeIndex + step)
        return
      }
    }

    // Navegación horizontal
    if (orientation === 'horizontal' || orientation === 'grid') {
      if (key === 'ArrowLeft') {
        event.preventDefault()
        updateIndex(activeIndex - 1)
        return
      }
      if (key === 'ArrowRight') {
        event.preventDefault()
        updateIndex(activeIndex + 1)
        return
      }
    }

    // Inicio y fin
    if (key === 'Home') {
      event.preventDefault()
      updateIndex(0)
      return
    }
    if (key === 'End') {
      event.preventDefault()
      updateIndex(itemCount - 1)
      return
    }

    // Seleccionar con Enter o Space
    if (key === 'Enter' || key === ' ') {
      event.preventDefault()
      onSelect?.(activeIndex)
      return
    }
  }, [activeIndex, itemCount, orientation, columnsCount, updateIndex, onSelect])

  /**
   * Props para el contenedor de la lista
   */
  const containerProps = {
    ref: containerRef,
    role: orientation === 'horizontal' ? 'tablist' : 'listbox',
    'aria-orientation': orientation === 'grid' ? undefined : orientation,
    tabIndex: 0,
    onKeyDown: handleKeyDown,
  }

  /**
   * Genera props para cada item de la lista
   * @param {number} index - Índice del elemento
   * @returns {Object} Props para el elemento
   */
  const getItemProps = useCallback((index) => ({
    ref: (el) => { itemRefs.current[index] = el },
    role: orientation === 'horizontal' ? 'tab' : 'option',
    'aria-selected': activeIndex === index,
    tabIndex: activeIndex === index ? 0 : -1,
    onClick: () => {
      setActiveIndex(index)
      onChange?.(index)
      onSelect?.(index)
    },
    onFocus: () => {
      if (activeIndex !== index) {
        setActiveIndex(index)
        onChange?.(index)
      }
    },
  }), [activeIndex, orientation, onChange, onSelect])

  /**
   * Resetear cuando cambie el número de items
   */
  useEffect(() => {
    if (itemCount > 0 && activeIndex >= itemCount) {
      setActiveIndex(0)
    }
  }, [itemCount, activeIndex])

  return {
    activeIndex,
    setActiveIndex,
    containerProps,
    getItemProps,
  }
}

/**
 * Hook simplificado para listas verticales
 */
export const useVerticalNavigation = (itemCount, options = {}) => {
  return useArrowNavigation({
    itemCount,
    orientation: 'vertical',
    ...options,
  })
}

/**
 * Hook simplificado para listas horizontales (tabs, carouseles)
 */
export const useHorizontalNavigation = (itemCount, options = {}) => {
  return useArrowNavigation({
    itemCount,
    orientation: 'horizontal',
    ...options,
  })
}

/**
 * Hook simplificado para grids
 */
export const useGridNavigation = (itemCount, columnsCount = 3, options = {}) => {
  return useArrowNavigation({
    itemCount,
    orientation: 'grid',
    columnsCount,
    ...options,
  })
}

export default useArrowNavigation

