import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import reportsService from '../../services/reportsService'
import { Card, Button, LoadingSpinner, StatCard } from '../../components'
import { LineChartComponent, PieChartComponent, BarChartComponent } from '../../components/charts'

const ReportsDashboard = () => {
  const navigate = useNavigate()
  const [chartData, setChartData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [daysPeriod, setDaysPeriod] = useState(30)

  useEffect(() => {
    loadChartData()
  }, [daysPeriod])

  const loadChartData = async () => {
    try {
      setLoading(true)
      const data = await reportsService.getChartData(daysPeriod)
      setChartData(data)
    } catch (error) {
      console.error('Error al cargar datos de gráficos:', error)
      toast.error('Error al cargar datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Cargando dashboard..." />
  }

  if (!chartData) {
    return <div className="text-red-500">Error al cargar datos</div>
  }

  // Calcular totales
  const totalPackages = chartData.packages_by_day?.reduce((sum, item) => sum + item.count, 0) || 0
  const totalByStatus = chartData.packages_by_status?.reduce((sum, item) => sum + item.value, 0) || 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-chart-line text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Dashboard de Reportes
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Visualiza estadísticas y genera reportes personalizados
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={daysPeriod}
              onChange={(e) => setDaysPeriod(Number(e.target.value))}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>Últimos 7 días</option>
              <option value={30}>Últimos 30 días</option>
              <option value={90}>Últimos 90 días</option>
            </select>
            <Button
              variant="primary"
              onClick={() => navigate('/reports/generate')}
              className="w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <i className="fas fa-plus mr-2"></i>
              Generar Reporte
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon="fas fa-box"
          value={totalPackages}
          label="Total Paquetes"
          color="blue"
        />
        <StatCard
          icon="fas fa-check-circle"
          value={chartData.packages_by_status?.find(s => s.name.toLowerCase().includes('entregado'))?.value || 0}
          label="Entregados"
          color="green"
        />
        <StatCard
          icon="fas fa-truck-moving"
          value={chartData.top_agencies?.length || 0}
          label="Agencias Activas"
          color="orange"
        />
        <StatCard
          icon="fas fa-map-marker-alt"
          value={chartData.top_destinations?.length || 0}
          label="Destinos"
          color="purple"
        />
      </div>

      {/* Acceso Rápido a Tipos de Reporte */}
      <Card className="border-l-4 border-blue-400">
        <div className="p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <i className="fas fa-file-alt mr-2 text-blue-500"></i>
            Tipos de Reportes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/reports/generate?type=packages')}
              className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border-2 border-blue-200 dark:border-blue-700 hover:shadow-lg transition-all hover:scale-105"
            >
              <i className="fas fa-box text-3xl text-blue-600 dark:text-blue-400 mb-2"></i>
              <h3 className="font-semibold text-gray-900 dark:text-white">Paquetes</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Reporte detallado de paquetes
              </p>
            </button>

            <button
              onClick={() => navigate('/reports/generate?type=statistics')}
              className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border-2 border-purple-200 dark:border-purple-700 hover:shadow-lg transition-all hover:scale-105"
            >
              <i className="fas fa-chart-pie text-3xl text-purple-600 dark:text-purple-400 mb-2"></i>
              <h3 className="font-semibold text-gray-900 dark:text-white">Estadísticas</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Estadísticas generales
              </p>
            </button>

            <button
              onClick={() => navigate('/reports/generate?type=agencies')}
              className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border-2 border-green-200 dark:border-green-700 hover:shadow-lg transition-all hover:scale-105"
            >
              <i className="fas fa-truck text-3xl text-green-600 dark:text-green-400 mb-2"></i>
              <h3 className="font-semibold text-gray-900 dark:text-white">Agencias</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Rendimiento de agencias
              </p>
            </button>

            <button
              onClick={() => navigate('/reports/generate?type=destinations')}
              className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border-2 border-orange-200 dark:border-orange-700 hover:shadow-lg transition-all hover:scale-105"
            >
              <i className="fas fa-map-marker-alt text-3xl text-orange-600 dark:text-orange-400 mb-2"></i>
              <h3 className="font-semibold text-gray-900 dark:text-white">Destinos</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Distribución por destinos
              </p>
            </button>
          </div>
        </div>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paquetes por Día */}
        <Card>
          <div className="p-5">
            <LineChartComponent
              data={chartData.packages_by_day || []}
              xKey="date"
              lines={[{ dataKey: 'count', stroke: '#3b82f6', name: 'Paquetes' }]}
              height={300}
              title="Paquetes por Día"
            />
          </div>
        </Card>

        {/* Distribución por Estado */}
        <Card>
          <div className="p-5">
            <PieChartComponent
              data={chartData.packages_by_status || []}
              nameKey="name"
              dataKey="value"
              height={300}
              title="Distribución por Estado"
            />
          </div>
        </Card>

        {/* Top Agencias */}
        <Card>
          <div className="p-5">
            <BarChartComponent
              data={chartData.top_agencies?.slice(0, 10) || []}
              xKey="name"
              bars={[{ dataKey: 'value', fill: '#10b981', name: 'Paquetes' }]}
              height={300}
              title="Top 10 Agencias"
              horizontal={true}
            />
          </div>
        </Card>

        {/* Top Destinos */}
        <Card>
          <div className="p-5">
            <BarChartComponent
              data={chartData.top_destinations?.slice(0, 10) || []}
              xKey="name"
              bars={[{ dataKey: 'value', fill: '#f59e0b', name: 'Paquetes' }]}
              height={300}
              title="Top 10 Destinos"
            />
          </div>
        </Card>
      </div>

      {/* Reportes Recientes */}
      <Card className="border-l-4 border-indigo-400">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              <i className="fas fa-history mr-2 text-indigo-500"></i>
              Reportes Recientes
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/reports')}
            >
              Ver todos
              <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          </div>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <i className="fas fa-inbox text-4xl mb-3 opacity-50"></i>
            <p>No hay reportes recientes</p>
            <p className="text-sm mt-1">Genera tu primer reporte personalizado</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ReportsDashboard
