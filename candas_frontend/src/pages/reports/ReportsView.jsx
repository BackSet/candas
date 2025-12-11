import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Card, Button, Badge, LoadingSpinner } from '../../components'
import { PieChartComponent, BarChartComponent } from '../../components/charts'
import reportsService from '../../services/reportsService'

const ReportsView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [regenerating, setRegenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('table') // 'table', 'charts', 'summary'

  useEffect(() => {
    fetchReport()
  }, [id])

  const fetchReport = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reportsService.get(id)
      setReport(data)
    } catch (err) {
      console.error('Error cargando informe:', err)
      setError('Error al cargar el informe')
      toast.error('Error al cargar el informe')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (type) => {
    try {
      if (type === 'pdf') {
        await reportsService.downloadPDF(id)
      } else if (type === 'excel') {
        await reportsService.downloadExcel(id)
      }
      toast.success('Descarga iniciada')
    } catch (err) {
      console.error('Error descargando:', err)
      toast.error('Error al descargar el archivo')
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'success'
      case 'GENERATING':
        return 'warning'
      case 'FAILED':
        return 'danger'
      default:
        return 'info'
    }
  }

  if (loading) return <LoadingSpinner message="Cargando informe..." />
  if (error) return <div className="text-red-500">{error}</div>
  if (!report) return <div>Informe no encontrado</div>

  const byAgencyData = report.json_data?.by_agency || {}
  const byDestinationData = report.json_data?.by_destination || {}
  const byStatusData = report.json_data?.by_status || {}

  // Preparar datos para gráficos
  const agencyChartData = Object.entries(byAgencyData).map(([name, data]) => ({
    name: name.substring(0, 20),
    value: data.packages_count || 0
  })).slice(0, 10)

  const destinationChartData = Object.entries(byDestinationData)
    .sort((a, b) => (b[1].packages_count || 0) - (a[1].packages_count || 0))
    .slice(0, 10)
    .map(([name, data]) => ({
      name,
      value: data.packages_count || 0
    }))

  const statusChartData = Object.entries(byStatusData).map(([name, data]) => ({
    name,
    value: data.count || 0
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-file-alt text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {report.report_type_display || 'Informe'}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant={getStatusBadgeColor(report.status)}>
                  {report.status_display || report.status}
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(report.report_date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: report.report_type === 'DAILY' ? 'numeric' : undefined,
                  })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/reports')}
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Volver
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <div className="p-5 text-center">
            <i className="fas fa-box text-4xl text-blue-600 dark:text-blue-400 mb-2"></i>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {report.total_packages?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Paquetes</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <div className="p-5 text-center">
            <i className="fas fa-cube text-4xl text-green-600 dark:text-green-400 mb-2"></i>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {report.total_individual_packages?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Individuales</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <div className="p-5 text-center">
            <i className="fas fa-boxes text-4xl text-purple-600 dark:text-purple-400 mb-2"></i>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {report.total_sacas?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Sacas</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <div className="p-5 text-center">
            <i className="fas fa-layer-group text-4xl text-orange-600 dark:text-orange-400 mb-2"></i>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {report.total_lotes?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Lotes</div>
          </div>
        </Card>
      </div>

      {/* Tabs de Contenido */}
      <div>
        {/* Navegación de Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('table')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'table'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <i className="fas fa-table mr-2"></i>
            Datos Tabulares
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'charts'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <i className="fas fa-chart-pie mr-2"></i>
            Gráficos
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'summary'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <i className="fas fa-info-circle mr-2"></i>
            Resumen
          </button>
        </div>

        {/* Contenido de Tabs */}
        {activeTab === 'table' && (
          <div className="space-y-4">
            {/* Desglose por Agencia */}
            {Object.keys(byAgencyData).length > 0 && (
              <Card>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    <i className="fas fa-truck text-green-500 mr-2"></i>
                    Desglose por Agencia de Transporte
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Agencia</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Paquetes</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Sacas</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Lotes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {Object.entries(byAgencyData).map(([agency, data]) => (
                          <tr key={agency} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{agency}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{data.packages_count || 0}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{data.sacas_count || 0}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{data.lotes_count || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            )}

            {/* Desglose por Destino */}
            {Object.keys(byDestinationData).length > 0 && (
              <Card>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    <i className="fas fa-map-marker-alt text-orange-500 mr-2"></i>
                    Desglose por Destino (Top 10)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Destino</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Paquetes</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Sacas</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Lotes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {Object.entries(byDestinationData)
                          .sort((a, b) => (b[1].packages_count || 0) - (a[1].packages_count || 0))
                          .slice(0, 10)
                          .map(([destination, data]) => (
                            <tr key={destination} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{destination}</td>
                              <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{data.packages_count || 0}</td>
                              <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{data.sacas_count || 0}</td>
                              <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{data.lotes_count || 0}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            )}

            {/* Desglose por Estado */}
            {Object.keys(byStatusData).length > 0 && (
              <Card>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    <i className="fas fa-tasks text-blue-500 mr-2"></i>
                    Desglose por Estado de Paquetes
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Estado</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Total</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Individuales</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">En Sacas</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {Object.entries(byStatusData).map(([status, data]) => (
                          <tr key={status} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{status}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{data.count || 0}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{data.individual_count || 0}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{data.in_pull_count || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico por Agencia */}
            {agencyChartData.length > 0 && (
              <Card>
                <div className="p-5">
                  <BarChartComponent
                    data={agencyChartData}
                    xKey="name"
                    bars={[{ dataKey: 'value', fill: '#10b981', name: 'Paquetes' }]}
                    height={350}
                    title="Paquetes por Agencia"
                    horizontal={true}
                  />
                </div>
              </Card>
            )}

            {/* Gráfico por Destino */}
            {destinationChartData.length > 0 && (
              <Card>
                <div className="p-5">
                  <BarChartComponent
                    data={destinationChartData}
                    xKey="name"
                    bars={[{ dataKey: 'value', fill: '#f59e0b', name: 'Paquetes' }]}
                    height={350}
                    title="Paquetes por Destino"
                  />
                </div>
              </Card>
            )}

            {/* Gráfico por Estado */}
            {statusChartData.length > 0 && (
              <Card className="lg:col-span-2">
                <div className="p-5">
                  <PieChartComponent
                    data={statusChartData}
                    nameKey="name"
                    dataKey="value"
                    height={350}
                    title="Distribución por Estado"
                  />
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-4">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Información del Reporte
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Estado
                    </label>
                    <Badge variant={getStatusBadgeColor(report.status)}>
                      {report.status_display || report.status}
                    </Badge>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Tipo de Generación
                    </label>
                    <div className="text-gray-900 dark:text-white">
                      {report.is_automatic ? 'Automático' : 'Manual'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Generado por
                    </label>
                    <div className="text-gray-900 dark:text-white">
                      {report.generated_by_username || 'Sistema'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Fecha de Creación
                    </label>
                    <div className="text-gray-900 dark:text-white">
                      {new Date(report.created_at).toLocaleString('es-ES')}
                    </div>
                  </div>

                  {report.updated_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Última Actualización
                      </label>
                      <div className="text-gray-900 dark:text-white">
                        {new Date(report.updated_at).toLocaleString('es-ES')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Acciones de Descarga */}
            <Card className="border-l-4 border-indigo-400">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  <i className="fas fa-download text-indigo-500 mr-2"></i>
                  Descargas Disponibles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {report.has_pdf !== false && (
                    <button
                      onClick={() => handleDownload('pdf')}
                      className="p-4 border-2 border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 rounded-lg hover:shadow-lg transition-all hover:scale-105"
                    >
                      <i className="fas fa-file-pdf text-3xl text-red-600 dark:text-red-400 mb-2"></i>
                      <div className="font-semibold text-gray-900 dark:text-white">Descargar PDF</div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Formato portable</p>
                    </button>
                  )}

                  {report.has_excel !== false && (
                    <button
                      onClick={() => handleDownload('excel')}
                      className="p-4 border-2 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 rounded-lg hover:shadow-lg transition-all hover:scale-105"
                    >
                      <i className="fas fa-file-excel text-3xl text-green-600 dark:text-green-400 mb-2"></i>
                      <div className="font-semibold text-gray-900 dark:text-white">Descargar Excel</div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Para análisis</p>
                    </button>
                  )}

                  <button
                    onClick={() => window.print()}
                    className="p-4 border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:shadow-lg transition-all hover:scale-105"
                  >
                    <i className="fas fa-print text-3xl text-blue-600 dark:text-blue-400 mb-2"></i>
                    <div className="font-semibold text-gray-900 dark:text-white">Imprimir</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Vista actual</p>
                  </button>
                </div>
              </div>
            </Card>

            {report.error_message && (
              <Card className="border-l-4 border-red-500">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    Error en Generación
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">{report.error_message}</p>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportsView
