import { Link } from 'react-router-dom'
import { Card } from '../components'

const Dashboard = () => {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/e032b260-3761-424c-8962-a2f280305add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.jsx:4',message:'Dashboard RENDER',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  }
  // #endregion
  const stats = [
    {
      title: 'Total Paquetes',
      value: '0',
      icon: 'fa-box',
      color: 'bg-blue-500',
      link: '/paquetes',
    },
    {
      title: 'Sacas Activas',
      value: '0',
      icon: 'fa-boxes',
      color: 'bg-green-500',
      link: '/logistica/pulls',
    },
    {
      title: 'En Tránsito',
      value: '0',
      icon: 'fa-truck',
      color: 'bg-yellow-500',
      link: '/paquetes',
    },
    {
      title: 'Entregados',
      value: '0',
      icon: 'fa-check-circle',
      color: 'bg-purple-500',
      link: '/paquetes',
    },
  ]

  const quickActions = [
    {
      title: 'Gestionar Paquetes',
      description: 'Ver, crear y editar paquetes',
      icon: 'fa-box',
      link: '/paquetes',
      iconColorClass: 'text-primary-600 dark:text-primary-400',
    },
    {
      title: 'Gestionar Sacas',
      description: 'Organizar paquetes en sacas',
      icon: 'fa-boxes',
      link: '/logistica/pulls',
      iconColorClass: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Crear Nueva Saca',
      description: 'Agrupar paquetes para envío',
      icon: 'fa-plus-circle',
      link: '/logistica/pulls/crear',
      iconColorClass: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Nuevo Paquete',
      description: 'Registrar un nuevo paquete',
      icon: 'fa-plus',
      link: '/paquetes/crear',
      iconColorClass: 'text-gray-600 dark:text-gray-400',
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-tachometer-alt text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Bienvenido al sistema de logística Candas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <Link key={index} to={stat.link}>
            <Card hoverable className="h-full transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 truncate">
                    {stat.title}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 sm:w-14 sm:h-14 ${stat.color} rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <i className={`fas ${stat.icon} text-xl sm:text-2xl text-white`}></i>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.link}>
              <Card hoverable className="h-full group transition-all hover:shadow-xl">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <i className={`fas ${action.icon} text-xl sm:text-2xl ${action.iconColorClass}`}></i>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {action.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    {action.description}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card 
        header={
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Actividad Reciente
          </h2>
        }
      >
        <div className="text-center py-8">
          <i className="fas fa-clock text-4xl text-gray-300 dark:text-gray-600 mb-3"></i>
          <p className="text-gray-500 dark:text-gray-300">
            No hay actividad reciente
          </p>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard
