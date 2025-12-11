import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import batchesService from '../../services/batchesService'
import transportAgenciesService from '../../services/transportAgenciesService'
import { Card, Button, FormField, PullsListBuilder, AutoDistributionConfig, LoadingSpinner } from '../../components'

const BatchWithPullsCreate = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('manual') // 'manual' o 'auto'
  
  // Información del Lote
  const [batchData, setBatchData] = useState({
    destiny: '',
    transport_agency: '',
    guide_number: '',
  })

  // Modo Manual
  const [manualPulls, setManualPulls] = useState([])

  // Modo Automático
  const [autoPackages, setAutoPackages] = useState([])
  const [autoPullsConfig, setAutoPullsConfig] = useState([])
  const [distributionPreview, setDistributionPreview] = useState([])

  // Agencias de transporte
  const [agencies, setAgencies] = useState([])
  const [loadingAgencies, setLoadingAgencies] = useState(true)

  useEffect(() => {
    fetchAgencies()
  }, [])

  const fetchAgencies = async () => {
    try {
      setLoadingAgencies(true)
      const data = await transportAgenciesService.getActive()
      setAgencies(data.results || data)
    } catch (error) {
      console.error('Error cargando agencias:', error)
      toast.error('Error al cargar las agencias de transporte')
      setAgencies([])
    } finally {
      setLoadingAgencies(false)
    }
  }

  const handleBatchInputChange = (e) => {
    setBatchData({
      ...batchData,
      [e.target.name]: e.target.value,
    })
  }

  // Validar formulario
  const isFormValid = () => {
    if (!batchData.destiny) {
      toast.error('El destino es obligatorio')
      return false
    }

    if (activeTab === 'manual') {
      if (manualPulls.length === 0) {
        toast.error('Debes agregar al menos una saca')
        return false
      }

      const pullsWithoutSize = manualPulls.filter(p => !p.size)
      if (pullsWithoutSize.length > 0) {
        toast.error('Todas las sacas deben tener un tamaño asignado')
        return false
      }

      const totalPackages = manualPulls.reduce((sum, p) => sum + p.packages.length, 0)
      if (totalPackages === 0) {
        toast.warning('No hay paquetes asignados a las sacas')
      }
    } else {
      // Modo automático
      if (autoPackages.length === 0) {
        toast.error('Debes seleccionar paquetes para distribuir')
        return false
      }

      if (autoPullsConfig.length === 0) {
        toast.error('Debes configurar al menos una saca')
        return false
      }

      const configsWithoutSize = autoPullsConfig.filter(c => !c.size)
      if (configsWithoutSize.length > 0) {
        toast.error('Todas las configuraciones de saca deben tener un tamaño')
        return false
      }

      const totalCapacity = autoPullsConfig.reduce((sum, c) => sum + (parseInt(c.max_packages) || 0), 0)
      if (totalCapacity < autoPackages.length) {
        toast.error('La capacidad total de las sacas es insuficiente para los paquetes seleccionados')
        return false
      }
    }

    return true
  }

  const handleSubmitManual = async () => {
    if (!isFormValid()) return

    setLoading(true)
    try {
      const data = {
        destiny: batchData.destiny,
        transport_agency: batchData.transport_agency || null,
        guide_number: batchData.guide_number || '',
        pulls: manualPulls.map(pull => ({
          size: pull.size,
          package_ids: pull.package_ids
        }))
      }

      const response = await batchesService.createWithPulls(data)
      toast.success(`Lote creado con ${response.pulls_count} saca(s)`)
      navigate('/logistica/batches')
    } catch (error) {
      console.error('Error al crear lote:', error)
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.detail ||
                      Object.values(error.response?.data || {}).flat().join(', ') ||
                      'Error al crear el lote'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAuto = async () => {
    if (!isFormValid()) return

    setLoading(true)
    try {
      const data = {
        destiny: batchData.destiny,
        transport_agency: batchData.transport_agency || null,
        guide_number: batchData.guide_number || '',
        package_ids: autoPackages.map(p => p.id),
        pulls_config: autoPullsConfig.map(config => ({
          size: config.size,
          max_packages: parseInt(config.max_packages) || 0
        }))
      }

      const response = await batchesService.autoDistribute(data)
      toast.success(
        `Lote creado con ${response.pulls_count} saca(s) y ${response.distributed_packages} paquete(s) distribuidos`
      )
      navigate('/logistica/batches')
    } catch (error) {
      console.error('Error al crear lote:', error)
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.detail ||
                      Object.values(error.response?.data || {}).flat().join(', ') ||
                      'Error al crear el lote'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (activeTab === 'manual') {
      handleSubmitManual()
    } else {
      handleSubmitAuto()
    }
  }

  // Calcular totales para resumen
  const getTotalPackages = () => {
    if (activeTab === 'manual') {
      return manualPulls.reduce((sum, p) => sum + p.packages.length, 0)
    } else {
      return autoPackages.length
    }
  }

  const getTotalPulls = () => {
    if (activeTab === 'manual') {
      return manualPulls.length
    } else {
      return autoPullsConfig.length
    }
  }

  if (loadingAgencies) {
    return <LoadingSpinner message="Cargando datos del formulario..." />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-layer-group text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Crear Lote con Sacas
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Crea múltiples sacas con el mismo destino y agrúpalas automáticamente en un lote
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Lote */}
        <Card header={
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            <i className="fas fa-info-circle mr-2"></i>
            Información del Lote
          </h2>
        }>
          <div className="space-y-4">
            {/* ID Auto-generado - Solo informativo */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                <i className="fas fa-info-circle mr-2"></i>
                <strong>ID del Lote:</strong> Se generará automáticamente al crear el lote
              </p>
            </div>

            <FormField
              label="Destino Común"
              name="destiny"
              value={batchData.destiny}
              onChange={handleBatchInputChange}
              required
              placeholder="Ej: QUITO - PICHINCHA"
              helpText="Este destino será asignado a todas las sacas del lote"
            />
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Agencia de Transporte
                <span className="text-gray-500 ml-1">(Opcional)</span>
              </label>
              <select
                name="transport_agency"
                value={batchData.transport_agency}
                onChange={handleBatchInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">-- Sin agencia asignada --</option>
                {agencies.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name} {agency.phone_number ? `- ${agency.phone_number}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Todas las sacas heredarán esta agencia si no tienen una propia
              </p>
              {agencies.length === 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  <i className="fas fa-exclamation-triangle mr-1"></i>
                  No hay agencias activas
                </p>
              )}
            </div>

            <FormField
              label="Número de Guía del Lote"
              name="guide_number"
              value={batchData.guide_number}
              onChange={handleBatchInputChange}
              placeholder="Ej: LOTE-2025-001"
              helpText="Si se proporciona, todas las sacas heredarán este número de guía"
            />
          </div>
        </Card>

        {/* Tabs para Modo Manual vs Automático */}
        <Card>
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'manual'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <i className="fas fa-hand-pointer mr-2"></i>
                Configuración Manual
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('auto')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'auto'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <i className="fas fa-magic mr-2"></i>
                Distribución Automática
              </button>
            </nav>
          </div>

          <div className="mt-6">
            {activeTab === 'manual' ? (
              <div>
                <div className="mb-4">
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">
                    Configuración Manual de Sacas
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Agrega sacas individualmente y asigna paquetes a cada una manualmente
                  </p>
                </div>
                <PullsListBuilder
                  pulls={manualPulls}
                  onPullsChange={setManualPulls}
                />
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">
                    Distribución Automática
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Selecciona paquetes y configura sacas. Los paquetes se distribuirán automáticamente
                  </p>
                </div>
                <AutoDistributionConfig
                  selectedPackages={autoPackages}
                  onPackagesChange={setAutoPackages}
                  pullsConfig={autoPullsConfig}
                  onPullsConfigChange={setAutoPullsConfig}
                  onDistributionPreview={setDistributionPreview}
                />
              </div>
            )}
          </div>
        </Card>

        {/* Resumen */}
        {(getTotalPackages() > 0 || getTotalPulls() > 0) && (
          <Card header={
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              <i className="fas fa-chart-bar mr-2"></i>
              Resumen
            </h2>
          }>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <i className="fas fa-layer-group text-2xl text-blue-600 dark:text-blue-400"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total de Sacas
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {getTotalPulls()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <i className="fas fa-box text-2xl text-green-600 dark:text-green-400"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total de Paquetes
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {getTotalPackages()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <i className="fas fa-map-marker-alt text-2xl text-purple-600 dark:text-purple-400"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Destino
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                      {batchData.destiny || 'Sin definir'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {activeTab === 'manual' && manualPulls.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Distribución por Saca:
                </h4>
                <div className="space-y-2">
                  {manualPulls.map((pull, index) => (
                    <div 
                      key={pull.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600 dark:text-gray-400">
                        Saca #{index + 1} - {pull.size || 'Sin tamaño'}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {pull.packages.length} paquete(s)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'auto' && distributionPreview.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Distribución Automática:
                </h4>
                <div className="space-y-2">
                  {distributionPreview.map((pullPreview) => (
                    <div 
                      key={pullPreview.pullNumber}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600 dark:text-gray-400">
                        Saca #{pullPreview.pullNumber} - {pullPreview.size}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {pullPreview.packages} paquete(s)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Botones de Acción */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/logistica/batches')}
            disabled={loading}
            className="w-auto px-6 py-3"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            loading={loading}
            icon={!loading && <i className="fas fa-save"></i>}
            className="w-auto px-6 py-3"
          >
            {loading ? 'Creando...' : 'Crear Lote con Sacas'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default BatchWithPullsCreate
