import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Card, Button, FormField } from '../../components'
import reportsService from '../../services/reportsService'

function ReportsCreate() {
  const navigate = useNavigate()
  const [reportType, setReportType] = useState('daily')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Para informes diarios
  const [reportDate, setReportDate] = useState('')
  
  // Para informes mensuales
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  
  const [generateFiles, setGenerateFiles] = useState(true)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let result
      
      if (reportType === 'daily') {
        if (!reportDate) {
          setError('Debe seleccionar una fecha')
          setLoading(false)
          return
        }
        
        result = await generateDailyReport({
          report_date: reportDate,
          generate_files: generateFiles,
        })
      } else {
        result = await reportsService.generateMonthly({
          year: parseInt(year),
          month: parseInt(month),
          generate_files: generateFiles,
        })
      }

      alert('Informe generado exitosamente')
      navigate(`/reports/${result.id}`)
    } catch (err) {
      console.error('Error generando informe:', err)
      setError(err.response?.data?.detail || 'Error al generar el informe')
    } finally {
      setLoading(false)
    }
  }

  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Header Mejorado */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                <i className="fas fa-chart-bar text-2xl text-white"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Generar Nuevo Informe
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Crea reportes diarios o mensuales del sistema
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="Tipo de Informe" required>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="daily"
                    checked={reportType === 'daily'}
                    onChange={(e) => setReportType(e.target.value)}
                    className="mr-2"
                  />
                  <span>Diario</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="monthly"
                    checked={reportType === 'monthly'}
                    onChange={(e) => setReportType(e.target.value)}
                    className="mr-2"
                  />
                  <span>Mensual</span>
                </label>
              </div>
            </FormField>

            {reportType === 'daily' ? (
              <FormField
                label="Fecha del Informe"
                required
                error={error && !reportDate ? 'Este campo es requerido' : null}
              >
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </FormField>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Año" required>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Mes" required>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            )}

            <FormField>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={generateFiles}
                  onChange={(e) => setGenerateFiles(e.target.checked)}
                  className="mr-2"
                />
                <span>Generar archivos PDF y Excel automáticamente</span>
              </label>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Si se desmarca, los archivos se pueden generar posteriormente
              </p>
            </FormField>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Generando...' : 'Generar Informe'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/reports')}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Información
          </h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong>Informe Diario:</strong> Genera un informe de todos los paquetes, sacas y lotes enviados en una fecha específica.
            </p>
            <p>
              <strong>Informe Mensual:</strong> Genera un informe consolidado de todo el mes seleccionado.
            </p>
            <p>
              Los informes incluyen:
            </p>
            <ul className="list-disc list-inside ml-4">
              <li>Resumen general de cantidades</li>
              <li>Desglose por agencia de transporte</li>
              <li>Desglose por destino</li>
              <li>Desglose por estado de paquetes</li>
              <li>Listado detallado de paquetes, sacas y lotes</li>
            </ul>
          </div>
        </Card>
      </div>
    </Layout>
  )
}

export default ReportsCreate
