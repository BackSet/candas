import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sidebar as FlowbiteSidebar, SidebarItems, SidebarItemGroup } from 'flowbite-react'

const Sidebar = () => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
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
      icon: 'fas fa-chart-line',
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
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 p-4 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors touch-target"
        aria-label="Menú"
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
      </button>

      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <FlowbiteSidebar
        aria-label="Navegación principal"
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 min-h-screen transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg shadow-sm">
              <i className="fas fa-truck text-white"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Candas
            </h2>
          </div>
        </div>

        {/* Navigation */}
        <SidebarItems className="p-3 sm:p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          <SidebarItemGroup>
            {menuSections.map((section) => {
            if (section.type === 'single') {
              // Item individual (Dashboard)
              return (
                <Link
                  key={section.path}
                  to={section.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group touch-target ${
                    isActive(section.path)
                      ? 'bg-blue-600 text-white shadow-md font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <i className={`${section.icon} w-5 text-center ${
                    isActive(section.path) 
                      ? 'text-white' 
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                  }`}></i>
                  <span className="font-medium">{section.label}</span>
                </Link>
              )
            }

            // Sección con submódulos
            const isExpanded = expandedSections[section.id]
            const hasActiveItem = isSectionActive(section.items)

            return (
              <div key={section.id} className="space-y-1">
                {/* Encabezado de sección */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 group touch-target ${
                    hasActiveItem
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <i className={`${section.icon} w-5 text-center ${
                      hasActiveItem
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                    }`}></i>
                    <span className="font-medium">{section.label}</span>
                  </div>
                  <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  } ${hasActiveItem ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}></i>
                </button>

                {/* Submódulos */}
                {isExpanded && (
                  <div className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-1">
                    {section.items.map((item) => {
                      // Si es una subsección
                      if (item.type === 'subsection') {
                        const isSubExpanded = expandedSections[item.id]
                        const hasActiveSubItem = isSectionActive(item.items)
                        
                        return (
                          <div key={item.id} className="space-y-1">
                            {/* Encabezado de subsección */}
                            <button
                              onClick={() => toggleSection(item.id)}
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm touch-target ${
                                hasActiveSubItem
                                  ? 'bg-primary-50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <i className={`${item.icon} w-4 text-center text-xs ${
                                  hasActiveSubItem ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                                }`}></i>
                                <span className="font-medium">{item.label}</span>
                              </div>
                              <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${
                                isSubExpanded ? 'rotate-180' : ''
                              }`}></i>
                            </button>
                            
                            {/* Items de subsección */}
                            {isSubExpanded && (
                              <div className="ml-3 pl-3 border-l-2 border-gray-100 dark:border-gray-700 space-y-1">
                                {item.items.map((subItem) => (
                                  <Link
                                    key={subItem.path}
                                    to={subItem.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm touch-target ${
                                      isActive(subItem.path)
                                        ? 'bg-blue-600 text-white shadow-md font-semibold'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                  >
                                    <i className={`${subItem.icon} w-4 text-center text-xs ${
                                      isActive(subItem.path) ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                                    }`}></i>
                                    <span>{subItem.label}</span>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      }
                      
                      // Item regular
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group text-sm touch-target ${
                            isActive(item.path)
                              ? 'bg-blue-600 text-white shadow-md font-semibold'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <i className={`${item.icon} w-4 text-center text-xs ${
                            isActive(item.path) 
                              ? 'text-white' 
                              : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                          }`}></i>
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
            })}
          </SidebarItemGroup>
        </SidebarItems>

        {/* Footer info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            v1.0.0
          </p>
        </div>
      </FlowbiteSidebar>
    </>
  )
}

export default Sidebar
