import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Navbar as FlowbiteNavbar, Dropdown, Avatar } from 'flowbite-react'
import ThemeToggle from '../theme/ThemeToggle'

const Navbar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <FlowbiteNavbar fluid className="fixed top-0 z-40 w-full h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 lg:pl-64">
      <div className="flex items-center justify-between w-full h-full px-3 py-2 lg:px-6">
        {/* Mobile menu button */}
        <button
          type="button"
          className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="sr-only">Open sidebar</span>
          <svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path clipRule="evenodd" fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
          </svg>
        </button>

        {/* Spacer for desktop - logo is in sidebar */}
        <div className="hidden lg:block"></div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <div className="flex items-center">
            <ThemeToggle className="w-10 h-10" />
          </div>

          {/* Separator */}
          <div className="hidden lg:block h-6 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />

          {/* User dropdown */}
          {user && (
            <Dropdown
              arrowIcon={false}
              inline
              label={
                <Avatar
                  alt="User settings"
                  img=""
                  rounded
                  className="ring-2 ring-primary-500"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600">
                    <i className="fas fa-user text-xs text-white"></i>
                  </div>
                </Avatar>
              }
            >
              <Dropdown.Header>
                <span className="block text-sm font-semibold">
                  {user.username ?? 'Usuario'}
                </span>
                <span className="block truncate text-sm font-medium">
                  {user.email ?? ''}
                </span>
              </Dropdown.Header>
              <Dropdown.Item onClick={handleLogout}>
                <div className="flex items-center gap-2">
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Salir</span>
                </div>
              </Dropdown.Item>
            </Dropdown>
          )}
        </div>
      </div>
    </FlowbiteNavbar>
  )
}

export default Navbar
