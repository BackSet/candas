import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import reportsService from '../../services/reportsService'
import transportAgenciesService from '../../services/transportAgenciesService'
import { Card, Button, LoadingSpinner } from '../../components'

const ReportGenerator = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [transportAgencies, setTransportAgencies] = useState([])
  
  const [formData, setFormData] = useState({
    // Paso 1: Tipo de reporte
    reportType: searchParams.get('type') || 'packages',
    
    // Paso 2: Filtros
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    statusChangeDate: new Date().toISOString().split('T')[0], // Fecha por defecto: hoy
    status: '',
    transportAgency: '',
    shipmentType: '',
    city: '',
    province: '',
    
    // Paso 3: Configuración
    columns: ['guide_number', 'name', 'city', 'status', 'shipment_type_display'],
    format: 'excel',
    includeCharts: true,
    groupBy: '',
    
    // Paso 4: Vista previa
    previewData: null,
  })

  useEffect(() => {
    loadTransportAgencies()
  }, [])

  const loadTransportAgencies = async () => {
    try {
      const data = await transportAgenciesService.list()
      setTransportAgencies(data.results || data)
    } catch (error) {
      console.error('Error cargando agencias:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleColumnToggle = (column) => {
    setFormData(prev => ({
      ...prev,
      columns: prev.columns.includes(column)
        ? prev.columns.filter(c => c !== column)
        : [...prev.columns, column]
    }))
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handlePreview = async () => {
    setLoading(true)
    try {
      const filters = {
        date_from: formData.dateFrom,
        date_to: formData.dateTo,
      }
      
      // Agregar filtro de fecha de cambio de estado si es reporte de paquetes
      if (formData.reportType === 'packages' && formData.statusChangeDate) {
        filters.status_change_date = formData.statusChangeDate
      }
      
      if (formData.status) filters.status = formData.status
      if (formData.transportAgency) filters.transport_agency = formData.transportAgency
      if (formData.shipmentType) filters.shipment_type = formData.shipmentType
      
      const result = await reportsService.packagesReport(filters, 'json')
      setFormData(prev => ({ ...prev, previewData: result }))
      toast.success('Vista previa generada')
    } catch (error) {
      console.error('Error en vista previa:', error)
      toast.error('Error al generar vista previa')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const filters = {
        date_from: formData.dateFrom,
        date_to: formData.dateTo,
      }
      
      // Agregar filtro de fecha de cambio de estado si es reporte de paquetes
      if (formData.reportType === 'packages' && formData.statusChangeDate) {
        filters.status_change_date = formData.statusChangeDate
      }
      
      if (formData.status) filters.status = formData.status
      if (formData.transportAgency) filters.transport_agency = formData.transportAgency
      if (formData.shipmentType) filters.shipment_type = formData.shipmentType
      
      if (formData.reportType === 'packages') {
        await reportsService.packagesReport(filters, formData.format)
        toast.success('Reporte generado y descargado')
      } else if (formData.reportType === 'statistics') {
        const result = await reportsService.statisticsReport(formData.dateFrom, formData.dateTo)
        console.log('Estadísticas:', result)
        toast.success('Reporte estadístico generado')
      } else if (formData.reportType === 'agencies') {
        const result = await reportsService.agenciesPerformance(formData.dateFrom, formData.dateTo)
        console.log('Rendimiento agencias:', result)
        toast.success('Reporte de agencias generado')
      }
      
      setTimeout(() => navigate('/reports/dashboard'), 1500)
    } catch (error) {
      console.error('Error generando reporte:', error)
      toast.error('Error al generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  const availableColumns = [
    { key: 'guide_number', label: 'Número de Guía' },
    { key: 'name', label: 'Nombre' },
    { key: 'city', label: 'Ciudad' },
    { key: 'province', label: 'Provincia' },
    { key: 'status', label: 'Estado' },
    { key: 'shipment_type_display', label: 'Tipo de Envío' },
    { key: 'agency', label: 'Agencia' },
    { key: 'created_at', label: 'Fecha de Creación' },
  ]

  const steps = [
    { number: 1, title: 'Tipo de Reporte' },
    { number: 2, title: 'Filtros' },
    { number: 3, title: 'Configuración' },
    { number: 4, title: 'Vista Previa' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <i className="fas fa-magic text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Generar Reporte
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Wizard de generación paso a paso
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      currentStep >= step.number
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <i className="fas fa-check"></i>
                    ) : (
                      step.number
                    )}
                  </div>
                  <span className={`text-sm mt-2 ${
                    currentStep >= step.number 
                      ? 'text-blue-600 dark:text-blue-400 font-semibold' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-4 rounded transition-all ${
                    currentStep > step.number
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Step Content */}
      <Card>
        <div className="p-6">
          {/* Paso 1: Tipo de Reporte */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Selecciona el tipo de reporte
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { type: 'packages', icon: 'fa-box', label: 'Paquetes', description: 'Reporte detallado de paquetes', color: 'blue' },
                  { type: 'statistics', icon: 'fa-chart-pie', label: 'Estadísticas', description: 'Estadísticas generales del sistema', color: 'purple' },
                  { type: 'agencies', icon: 'fa-truck', label: 'Agencias', description: 'Rendimiento de agencias de transporte', color: 'green' },
                  { type: 'destinations', icon: 'fa-map-marker-alt', label: 'Destinos', description: 'Distribución por destinos', color: 'orange' },
                ].map(({ type, icon, label, description, color }) => (
                  <button
                    key={type}
                    onClick={() => handleInputChange('reportType', type)}
                    className={`p-6 rounded-lg border-2 transition-all text-left ${
                      formData.reportType === type
                        ? `border-${color}-500 bg-${color}-50 dark:bg-${color}-900/20`
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <i className={`fas ${icon} text-3xl text-${color}-600 dark:text-${color}-400 mb-3`}></i>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{label}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
                    {formData.reportType === type && (
                      <div className="mt-3">
                        <i className={`fas fa-check-circle text-${color}-600 dark:text-${color}-400 mr-2`}></i>
                        <span className={`text-${color}-600 dark:text-${color}-400 text-sm font-medium`}>Seleccionado</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paso 2: Filtros */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Configura los filtros
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.reportType === 'packages' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha de Cambio de Estado (EN_BODEGA → EN_TRANSITO)
                    </label>
                    <input
                      type="date"
                      value={formData.statusChangeDate}
                      onChange={(e) => handleInputChange('statusChangeDate', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Filtra paquetes que cambiaron de EN_BODEGA a EN_TRANSITO en esta fecha
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha Desde
                  </label>
                  <input
                    type="date"
                    value={formData.dateFrom}
                    onChange={(e) => handleInputChange('dateFrom', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha Hasta
                  </label>
                  <input
                    type="date"
                    value={formData.dateTo}
                    onChange={(e) => handleInputChange('dateTo', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                {formData.reportType === 'packages' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Agencia de Transporte
                      </label>
                      <select
                        value={formData.transportAgency}
                        onChange={(e) => handleInputChange('transportAgency', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="">Todas las agencias</option>
                        {transportAgencies.map(agency => (
                          <option key={agency.id} value={agency.id}>{agency.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo de Envío
                      </label>
                      <select
                        value={formData.shipmentType}
                        onChange={(e) => handleInputChange('shipmentType', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="">Todos los tipos</option>
                        <option value="individual">Envío Individual</option>
                        <option value="saca">Envío en Saca</option>
                        <option value="lote">Envío en Lote</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Paso 3: Configuración */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Configura el reporte
              </h2>
              
              {formData.reportType === 'packages' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Columnas a incluir
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableColumns.map(col => (
                      <label key={col.key} className="flex items-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                        <input
                          type="checkbox"
                          checked={formData.columns.includes(col.key)}
                          onChange={() => handleColumnToggle(col.key)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-900 dark:text-white">{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formato de Salida
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'excel', icon: 'fa-file-excel', label: 'Excel', color: 'green' },
                    { value: 'pdf', icon: 'fa-file-pdf', label: 'PDF', color: 'red' },
                    { value: 'csv', icon: 'fa-file-csv', label: 'CSV', color: 'blue' },
                  ].map(({ value, icon, label, color }) => (
                    <button
                      key={value}
                      onClick={() => handleInputChange('format', value)}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        formData.format === value
                          ? `border-${color}-500 bg-${color}-50 dark:bg-${color}-900/20`
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <i className={`fas ${icon} text-2xl text-${color}-600 dark:text-${color}-400 mb-2`}></i>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Paso 4: Vista Previa */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Vista Previa
                </h2>
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  disabled={loading}
                >
                  <i className="fas fa-sync mr-2"></i>
                  Actualizar Vista Previa
                </Button>
              </div>

              {loading && <LoadingSpinner size="sm" />}

              {formData.previewData && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Total de registros: <span className="font-bold text-blue-600 dark:text-blue-400">{formData.previewData.count || 0}</span>
                  </p>
                  <div className="max-h-96 overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                        <tr>
                          {formData.columns.slice(0, 5).map(col => (
                            <th key={col} className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                              {availableColumns.find(c => c.key === col)?.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {formData.previewData.data?.slice(0, 10).map((row, idx) => (
                          <tr key={idx}>
                            {formData.columns.slice(0, 5).map(col => (
                              <td key={col} className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                                {row[col] || '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {!formData.previewData && !loading && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <i className="fas fa-search text-4xl mb-3 opacity-50"></i>
                  <p>Haz clic en "Actualizar Vista Previa" para ver los datos</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Anterior
        </Button>

        <div className="flex gap-3">
          {currentStep < 4 ? (
            <Button
              variant="primary"
              onClick={nextStep}
              className="w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Siguiente
              <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={loading}
              className="w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Generando...
                </>
              ) : (
                <>
                  <i className="fas fa-download mr-2"></i>
                  Generar Reporte
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportGenerator
