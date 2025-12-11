import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Intentar obtener tema guardado en localStorage
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      return savedTheme
    }
    
    // Si no hay tema guardado, detectar preferencia del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const [systemTheme, setSystemTheme] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  // Escuchar cambios en la preferencia del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      const newSystemTheme = e.matches ? 'dark' : 'light'
      setSystemTheme(newSystemTheme)
      
      // Si el tema actual es 'system', actualizar el tema aplicado
      const currentTheme = localStorage.getItem('theme')
      if (currentTheme === 'system' || !currentTheme) {
        applyTheme(newSystemTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Aplicar tema al documento
  const applyTheme = useCallback((newTheme) => {
    const root = window.document.documentElement
    
    // Remover clases previas
    root.classList.remove('light', 'dark')
    
    // Aplicar nueva clase
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.add('light')
    }
  }, [])

  // Aplicar tema cuando cambie
  useEffect(() => {
    const effectiveTheme = theme === 'system' ? systemTheme : theme
    applyTheme(effectiveTheme)
    
    // Guardar en localStorage solo si el tema cambió realmente
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme !== theme) {
      localStorage.setItem('theme', theme)
    }
  }, [theme, systemTheme, applyTheme])

  const setLightTheme = () => setTheme('light')
  const setDarkTheme = () => setTheme('dark')
  const useSystemTheme = () => setTheme('system')
  
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      if (prevTheme === 'light') return 'dark'
      if (prevTheme === 'dark') return 'light'
      return systemTheme === 'dark' ? 'light' : 'dark'
    })
  }

  const effectiveTheme = theme === 'system' ? systemTheme : theme

  const value = {
    theme,
    effectiveTheme,
    systemTheme,
    setLightTheme,
    setDarkTheme,
    useSystemTheme,
    toggleTheme,
    isDark: effectiveTheme === 'dark',
    isLight: effectiveTheme === 'light',
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export default ThemeContext
