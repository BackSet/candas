import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Layout, Card, Button, DataTable, Badge, LoadingSpinner, EmptyState, StatCard } from '../../components'
import reportsService from '../../services/reportsService'

function ReportsList() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all, daily, monthly
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [isGeneratingDispatch, setIsGeneratingDispatch] = useState(false)
  const [isGeneratingReception, setIsGeneratingReception] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [filter])

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {}
      if (filter === 'daily') {
        // Incluir todos los tipos de reportes diarios
        params.report_type__in = 'DAILY,DAILY_DISPATCH,DAILY_RECEPTION'
      }
      if (filter === 'monthly') params.report_type = 'MONTHLY'
      
      const data = await reportsService.list(params)
      setReports(data.results || data)
    } catch (err) {
      console.error('Error cargando informes:', err)
      setError('Error al cargar los informes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este informe?')) return

    try {
      await reportsService.delete(id)
      fetchReports()
    } catch (err) {
      console.error('Error eliminando informe:', err)
      alert('Error al eliminar el informe')
    }
  }

  const handleGenerateDispatchReport = async () => {
    try {
      setIsGeneratingDispatch(true)
      const response = await reportsService.generateDailyDispatchReport(selectedDate)
      toast.success(response.message || 'Reporte de despachos generado exitosamente')
      fetchReports()
    } catch (error) {
      console.error('Error generando reporte de despachos:', error)
      toast.error(error.response?.data?.error || 'Error al generar reporte de despachos')
    } finally {
      setIsGeneratingDispatch(false)
    }
  }

  const handleGenerateReceptionReport = async () => {
    try {
      setIsGeneratingReception(true)
      const response = await reportsService.generateDailyReceptionReport(selectedDate)
      toast.success(response.message || 'Reporte de recepciones generado exitosamente')
      fetchReports()
    } catch (error) {
      console.error('Error generando reporte de recepciones:', error)
      toast.error(error.response?.data?.error || 'Error al generar reporte de recepciones')
    } finally {
      setIsGeneratingReception(false)
    }
  }

  const handleDownloadPDF = async (report) => {
    try {
      await reportsService.downloadPDF(report.id)
    } catch (err) {
      console.error('Error descargando PDF:', err)
      alert('Error al descargar el PDF')
    }
  }

  const handleDownloadExcel = async (report) => {
    try {
      const blob = await downloadReportExcel(report.id)
      downloadBlob(blob, `${report.filename_base}.xlsx`)
    } catch (err) {
      console.error('Error descargando Excel:', err)
      alert('Error al descargar el Excel')
    }
  }

  const handleDownloadJSON = async (report) => {
    try {
      const data = await reportsService.get(report.id)
      const blob = new Blob([JSON.stringify(data.json_data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${report.filename_base}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error descargando JSON:', err)
      alert('Error al descargar el JSON')
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
        return 'secondary'
    }
  }

  const columns = [
    {
      header: 'Tipo',
      accessor: 'report_type_display',
      cell: (row) => {
        const variant = row.report_type.startsWith('DAILY') ? 'primary' : 'info'
        return (
          <Badge variant={variant}>
            {row.report_type_display}
          </Badge>
        )
      },
    },
    {
      header: 'Fecha',
      accessor: 'report_date',
      cell: (row) => new Date(row.report_date).toLocaleDateString('es-ES'),
    },
    {
      header: 'Estado',
      accessor: 'status_display',
      cell: (row) => (
        <Badge variant={getStatusBadgeColor(row.status)}>
          {row.status_display}
        </Badge>
      ),
    },
    {
      header: 'Paquetes',
      accessor: 'total_packages',
      cell: (row) => row.total_packages.toLocaleString(),
    },
    {
      header: 'Sacas',
      accessor: 'total_sacas',
      cell: (row) => row.total_sacas.toLocaleString(),
    },
    {
      header: 'Lotes',
      accessor: 'total_lotes',
      cell: (row) => row.total_lotes.toLocaleString(),
    },
    {
      header: 'Automático',
      accessor: 'is_automatic',
      cell: (row) => (
        <Badge variant={row.is_automatic ? 'secondary' : 'primary'}>
          {row.is_automatic ? 'Sí' : 'No'}
        </Badge>
      ),
    },
    {
      header: 'Acciones',
      accessor: 'id',
      cell: (row) => (
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/reports/${row.id}`)}
          >
            Ver
          </Button>
          
          {row.has_pdf && (
            <Button
              variant="success"
              size="sm"
              onClick={() => handleDownloadPDF(row)}
            >
              PDF
            </Button>
          )}
          
          {row.has_excel && (
            <Button
              variant="success"
              size="sm"
              onClick={() => handleDownloadExcel(row)}
            >
              Excel
            </Button>
          )}
          
          {row.has_json && (
            <Button
              variant="info"
              size="sm"
              onClick={() => handleDownloadJSON(row)}
            >
              JSON
            </Button>
          )}
          
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(row.id)}
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ]

  if (loading) return <LoadingSpinner />
  if (error) return <div className="text-red-500">{error}</div>

  // Calcular estadísticas (solo de los reportes cargados actualmente)
  const totalReports = reports.length
  const dailyReports = reports.filter(r => r.report_type?.startsWith('DAILY')).length
  const monthlyReports = reports.filter(r => r.report_type === 'MONTHLY').length
  const completedReports = reports.filter(r => r.status === 'COMPLETED').length

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header Mejorado */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                <i className="fas fa-chart-bar text-2xl text-white"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Informes
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Gestiona y genera reportes del sistema
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => navigate('/reports/create')}
                className="w-auto px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              >
                <i className="fas fa-plus mr-2"></i>
                Generar Nuevo Informe
              </Button>
            </div>
          </div>
        </div>

        {/* Estadísticas Globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon="fas fa-chart-bar"
            value={totalReports}
            label="Total Reportes"
            color="orange"
          />
          <StatCard
            icon="fas fa-calendar-day"
            value={dailyReports}
            label="Diarios"
            color="blue"
          />
          <StatCard
            icon="fas fa-calendar-alt"
            value={monthlyReports}
            label="Mensuales"
            color="indigo"
          />
          <StatCard
            icon="fas fa-check-circle"
            value={completedReports}
            label="Completados"
            color="green"
          />
        </div>

        {/* Sección de Generación Rápida de Reportes Diarios */}
        <Card>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <i className="fas fa-calendar-day text-primary-600 text-xl"></i>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Generar Reporte Diario
              </h2>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 mt-1"></i>
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-medium mb-1">Reportes basados en cambios de estado</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li><strong>Despachos:</strong> Paquetes que cambiaron de EN_BODEGA → EN_TRANSITO</li>
                    <li><strong>Recepciones:</strong> Paquetes que cambiaron de NO_RECEPTADO → EN_BODEGA</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha del Reporte
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <Button
                variant="primary"
                onClick={handleGenerateDispatchReport}
                disabled={isGeneratingDispatch || isGeneratingReception}
                className="min-w-[200px]"
              >
                {isGeneratingDispatch ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Generando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-shipping-fast mr-2"></i>
                    Reporte de Despachos
                  </>
                )}
              </Button>
              
              <Button
                variant="success"
                onClick={handleGenerateReceptionReport}
                disabled={isGeneratingDispatch || isGeneratingReception}
                className="min-w-[200px]"
              >
                {isGeneratingReception ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Generando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-inbox mr-2"></i>
                    Reporte de Recepciones
                  </>
                )}
              </Button>
            </div>

            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Los archivos PDF y Excel se generarán automáticamente en segundo plano
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              onClick={() => setFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={filter === 'daily' ? 'primary' : 'secondary'}
              onClick={() => setFilter('daily')}
            >
              Diarios
            </Button>
            <Button
              variant={filter === 'monthly' ? 'primary' : 'secondary'}
              onClick={() => setFilter('monthly')}
            >
              Mensuales
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={reports}
            loading={loading}
            emptyTitle="No hay informes"
            emptyDescription="Genera tu primer informe para comenzar"
            emptyActionLabel="Generar Informe"
            onEmptyAction={() => navigate('/reports/create')}
          />
        </Card>
      </div>
    </Layout>
  )
}

export default ReportsList
