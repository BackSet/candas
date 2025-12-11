import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import ThemeToggle from '../theme/ThemeToggle'

const Sidebar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const location = useLocation()
  const { user } = useAuth()
  const [expandedSections, setExpandedSections] = useState({
    logistics: true,
    'logistics-pulls': false,
    'logistics-batches': false,
    'logistics-individual': false,
    'logistics-dispatches': false,
    packages: false,
    'packages-management': false,
    'packages-tools': false,
    'packages-hierarchy': false,
    reports: false,
    'reports-queries': false,
    'reports-config': false,
    config: false,
  })

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    if (mobileMenuOpen && setMobileMenuOpen) {
      setMobileMenuOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const menuSections = [
    {
      id: 'dashboard',
      type: 'single',
      path: '/',
      icon: 'fas fa-home',
      label: 'Dashboard',
    },
    {
      id: 'packages',
      type: 'section',
      icon: 'fas fa-box',
      label: 'Paquetes',
      items: [
        {
          id: 'packages-management',
          type: 'subsection',
          icon: 'fas fa-tasks',
          label: 'Gestión',
          items: [
            { path: '/paquetes', icon: 'fas fa-list', label: 'Lista de Paquetes' },
            { path: '/paquetes/crear', icon: 'fas fa-plus-circle', label: 'Crear Paquete' },
          ]
        },
        {
          id: 'packages-tools',
          type: 'subsection',
          icon: 'fas fa-tools',
          label: 'Herramientas',
          items: [
            { path: '/paquetes/scanner', icon: 'fas fa-barcode', label: 'Búsqueda Rápida' },
            { path: '/paquetes/exportar', icon: 'fas fa-file-export', label: 'Exportar' },
            { path: '/paquetes/importar', icon: 'fas fa-file-import', label: 'Importar' },
            { path: '/paquetes/herramientas/cambio-lotes', icon: 'fas fa-edit', label: 'Cambio en Lotes' },
          ]
        },
        {
          id: 'packages-hierarchy',
          type: 'subsection',
          icon: 'fas fa-sitemap',
          label: 'Clementina',
          items: [
            { path: '/paquetes?clementina=true', icon: 'fas fa-list', label: 'Gestión de Jerarquías' },
          ]
        }
      ]
    },
    {
      id: 'logistics',
      type: 'section',
      icon: 'fas fa-truck',
      label: 'Logística',
      items: [
        {
          id: 'logistics-pulls',
          type: 'subsection',
          icon: 'fas fa-boxes',
          label: 'Sacas',
          items: [
            { path: '/logistica/pulls', icon: 'fas fa-list', label: 'Lista de Sacas' },
            { path: '/logistica/pulls/crear', icon: 'fas fa-plus-square', label: 'Crear Saca' },
          ]
        },
        {
          id: 'logistics-batches',
          type: 'subsection',
          icon: 'fas fa-layer-group',
          label: 'Lotes',
          items: [
            { path: '/logistica/batches', icon: 'fas fa-list', label: 'Lista de Lotes' },
            { path: '/logistica/batches/crear', icon: 'fas fa-folder-plus', label: 'Crear Lote' },
            { path: '/logistica/batches/wizard', icon: 'fas fa-magic', label: 'Wizard de Lote' },
            { path: '/logistica/batches/crear-con-sacas', icon: 'fas fa-wand-magic-sparkles', label: 'Lote con Sacas' },
          ]
        },
        {
          id: 'logistics-individual',
          type: 'subsection',
          icon: 'fas fa-shipping-fast',
          label: 'Paquetes Individuales',
          items: [
            { path: '/logistica/individuales', icon: 'fas fa-list', label: 'Paquetes sin Asignar' },
            { path: '/logistica/individuales/crear', icon: 'fas fa-exchange-alt', label: 'Convertir a Individual' },
          ]
        },
        {
          id: 'logistics-dispatches',
          type: 'subsection',
          icon: 'fas fa-truck-loading',
          label: 'Despachos',
          items: [
            { path: '/logistica/dispatches', icon: 'fas fa-list', label: 'Lista de Despachos' },
            { path: '/logistica/dispatches/crear', icon: 'fas fa-calendar-plus', label: 'Crear Despacho' },
          ]
        }
      ]
    },
    {
      id: 'reports',
      type: 'section',
      icon: 'fas fa-chart-bar',
      label: 'Reportes',
      items: [
        {
          id: 'reports-queries',
          type: 'subsection',
          icon: 'fas fa-search',
          label: 'Consultas',
          items: [
            { path: '/reports/dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
            { path: '/reports/generate', icon: 'fas fa-magic', label: 'Generar Reporte' },
            { path: '/reports', icon: 'fas fa-list-alt', label: 'Ver Todos' },
          ]
        },
        {
          id: 'reports-config',
          type: 'subsection',
          icon: 'fas fa-cog',
          label: 'Configuración',
          items: [
            { path: '/reports/create', icon: 'fas fa-file-medical', label: 'Crear Diario/Mensual' },
            { path: '/reports/scheduled', icon: 'fas fa-clock', label: 'Programados' },
          ]
        }
      ]
    },
    {
      id: 'config',
      type: 'section',
      icon: 'fas fa-cogs',
      label: 'Configuración',
      items: [
        { path: '/catalogo/agencias-transporte', icon: 'fas fa-truck-moving', label: 'Agencias de Transporte' },
      ]
    },
  ]

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const isSectionActive = (items) => {
    return items?.some(item => {
      if (item.type === 'subsection') {
        return isSectionActive(item.items)
      }
      return isActive(item.path)
    })
  }

  return (
    <>
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/80 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 transition-transform flex flex-col
          bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
              <i className="fas fa-truck text-sm text-white"></i>
            </div>
            <span className="self-center whitespace-nowrap text-xl font-semibold text-gray-900 dark:text-white">
              Candas
            </span>
          </Link>
          <ThemeToggle className="w-9 h-9" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
          <div className="space-y-1">
            {menuSections.map((section) => {
              if (section.type === 'single') {
                const active = isActive(section.path)
                return (
                  <Link
                    key={section.path}
                    to={section.path}
                    onClick={() => setMobileMenuOpen?.(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${active
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      }
                    `}
                  >
                    <i className={`${section.icon} w-5 text-center`}></i>
                    <span>{section.label}</span>
                  </Link>
                )
              }

              const isExpanded = expandedSections[section.id]
              const hasActiveItem = isSectionActive(section.items)

              return (
                <div key={section.id}>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={`
                      flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${hasActiveItem
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      }
                    `}
                  >
                    <i className={`${section.icon} w-5 text-center`}></i>
                    <span className="flex-1 text-left">{section.label}</span>
                    <i className={`fas fa-chevron-up text-xs transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}></i>
                  </button>

                  {isExpanded && (
                    <div className="mt-1 space-y-1">
                      {section.items.map((item) => {
                        if (item.type === 'subsection') {
                          const isSubExpanded = expandedSections[item.id]
                          const hasActiveSubItem = isSectionActive(item.items)
                          
                          return (
                            <div key={item.id}>
                              <button
                                onClick={() => toggleSection(item.id)}
                                className={`
                                  flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors
                                  ${hasActiveSubItem
                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-300'
                                  }
                                `}
                              >
                                <i className={`${item.icon} w-4 text-center`}></i>
                                <span className="flex-1 text-left">{item.label}</span>
                                <i className={`fas fa-chevron-up text-xs transition-transform ${
                                  isSubExpanded ? 'rotate-180' : ''
                                }`}></i>
                              </button>
                              
                              {isSubExpanded && (
                                <div className="mt-1 ml-4 space-y-1">
                                  {item.items.map((subItem) => {
                                    const subActive = isActive(subItem.path)
                                    return (
                                      <Link
                                        key={subItem.path}
                                        to={subItem.path}
                                        onClick={() => setMobileMenuOpen?.(false)}
                                        className={`
                                          flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                                          ${subActive
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-300'
                                          }
                                        `}
                                      >
                                        <i className={`${subItem.icon} w-4 text-center`}></i>
                                        <span>{subItem.label}</span>
                                      </Link>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        }
                        
                        const active = isActive(item.path)
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileMenuOpen?.(false)}
                            className={`
                              flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                              ${active
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-300'
                              }
                            `}
                          >
                            <i className={`${item.icon} w-4 text-center`}></i>
                            <span>{item.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* User Profile */}
        {user && (
          <div className="mt-auto shrink-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 shrink-0">
                <i className="fas fa-user text-xs text-white"></i>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user.username ?? 'Usuario'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email ?? ''}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Sidebar
