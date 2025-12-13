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
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/e032b260-3761-424c-8962-a2f280305add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeContext.jsx:13',message:'ThemeProvider RENDER',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  }
  // #endregion
  const [theme, setTheme] = useState(() => {
    try {
      // Intentar obtener tema guardado en localStorage
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        return savedTheme
      }
      
      // Si no hay tema guardado, detectar preferencia del sistema
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } catch (error) {
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/e032b260-3761-424c-8962-a2f280305add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeContext.jsx:23',message:'ThemeProvider useState ERROR',data:{errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      }
      // #endregion
      return 'light'
    }
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
