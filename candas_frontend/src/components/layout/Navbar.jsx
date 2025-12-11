import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Navbar as FlowbiteNavbar, NavbarBrand } from 'flowbite-react'
import ThemeToggle from '../theme/ThemeToggle'
import Button from '../ui/Button'

/**
 * Componente Navbar que usa Flowbite React
 * Mantiene compatibilidad con la estructura existente
 */
const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <FlowbiteNavbar 
      fluid 
      className="sticky top-0 z-40 border-b shadow-sm backdrop-blur-sm bg-white/95 dark:bg-gray-800/95"
    >
      <NavbarBrand>
        <span className="self-center whitespace-nowrap text-base sm:text-xl font-semibold text-gray-900 dark:text-white">
          <span className="hidden sm:inline">Sistema de Logística</span>
          <span className="sm:hidden">Candas</span>
        </span>
      </NavbarBrand>
      
      <div className="flex items-center gap-2 sm:gap-3 md:order-2">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Info - Solo desktop */}
        {user && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700">
            <i className="fas fa-user text-gray-600 dark:text-gray-300 text-sm"></i>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 max-w-[120px] truncate">
              {user.username ?? 'Usuario'}
            </span>
          </div>
        )}

        {/* Logout Button */}
        <Button
          variant="danger"
          size="sm"
          onClick={handleLogout}
          icon={<i className="fas fa-sign-out-alt"></i>}
          className="touch-target"
        >
          <span className="hidden sm:inline">Salir</span>
        </Button>
      </div>
    </FlowbiteNavbar>
  )
}

export default Navbar
