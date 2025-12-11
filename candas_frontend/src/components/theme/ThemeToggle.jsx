import { useTheme } from '../../contexts/ThemeContext'

const ThemeToggle = ({ className = '' }) => {
  const { toggleTheme, isDark } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center p-2 sm:p-2.5 rounded-lg 
        transition-all duration-300 ease-in-out touch-target
        bg-gray-100 dark:bg-gray-700
        hover:bg-gray-200 dark:hover:bg-gray-600
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 
        dark:focus:ring-offset-gray-800
        shadow-sm hover:shadow-md
        ${className}`}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {/* Icono de Sol (modo claro) */}
      <svg
        className={`w-5 h-5 transition-all duration-500 text-yellow-500 dark:text-gray-400 ${
          isDark ? 'rotate-90 scale-0 absolute opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>

      {/* Icono de Luna (modo oscuro) */}
      <svg
        className={`w-5 h-5 transition-all duration-500 text-gray-400 dark:text-blue-400 ${
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 absolute opacity-0'
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </button>
  )
}

export default ThemeToggle
