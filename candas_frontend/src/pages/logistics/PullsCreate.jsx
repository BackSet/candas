import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import pullsService from '../../services/pullsService'
import transportAgenciesService from '../../services/transportAgenciesService'
import batchesService from '../../services/batchesService'
import { Card, Button, FormField, PackageSelector, LoadingSpinner } from '../../components'

const PullsCreate = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    common_destiny: '',
    size: '',
    transport_agency: '',
    guide_number: '',
    batch: '',
    initial_status: '', // Estado inicial para los paquetes
  })
  const [selectedPackages, setSelectedPackages] = useState([])
  const [loading, setLoading] = useState(false)
  const [pullType, setPullType] = useState('individual') // 'individual' o 'in_batch'
  const [agencies, setAgencies] = useState([])
  const [batches, setBatches] = useState([])
  const [batchInfo, setBatchInfo] = useState(null)
  const [loadingData, setLoadingData] = useState(true)

  // Opciones de estado de paquetes
  const PACKAGE_STATUS_OPTIONS = [
    { value: '', label: 'Mantener estado actual' },
    { value: 'NO_RECEPTADO', label: 'No Receptado' },
    { value: 'EN_BODEGA', label: 'En Bodega' },
    { value: 'EN_TRANSITO', label: 'En Tránsito' },
    { value: 'ENTREGADO', label: 'Entregado' },
    { value: 'DEVUELTO', label: 'Devuelto' },
    { value: 'RETENIDO', label: 'Retenido' },
  ]

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (formData.batch) {
      loadBatchInfo(formData.batch)
      // Limpiar campos de agencia y guía si hay lote
      setFormData(prev => ({
        ...prev,
        transport_agency: '',
        guide_number: ''
      }))
    } else {
      setBatchInfo(null)
    }
  }, [formData.batch])

  const fetchInitialData = async () => {
    try {
      setLoadingData(true)
      const [agenciesData, batchesData] = await Promise.all([
        transportAgenciesService.getActive(),
        batchesService.list()
      ])
      // Asegurar que siempre sean arrays
      const agenciesList = agenciesData?.results ?? agenciesData ?? []
      const batchesList = batchesData?.results ?? batchesData ?? []
      setAgencies(Array.isArray(agenciesList) ? agenciesList : [])
      setBatches(Array.isArray(batchesList) ? batchesList : [])
      console.log('Agencias cargadas:', agenciesList.length)
    } catch (error) {
      console.error('Error cargando datos:', error)
      console.error('Error response:', error.response?.data)
      toast.error('Error al cargar datos del formulario')
      setAgencies([])
      setBatches([])
    } finally {
      setLoadingData(false)
    }
  }

  const loadBatchInfo = async (batchId) => {
    try {
      const data = await batchesService.get(batchId)
      setBatchInfo(data)
    } catch (error) {
      console.error('Error cargando lote:', error)
      setBatchInfo(null)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.common_destiny || !formData.size) {
      toast.error('Completa todos los campos obligatorios')
      return
    }

    setLoading(true)
    try {
      const packageIds = selectedPackages.map((p) => p.id)
      const data = {
        common_destiny: formData.common_destiny,
        size: formData.size,
        transport_agency: pullType === 'individual' ? (formData.transport_agency || null) : null,
        guide_number: pullType === 'individual' ? formData.guide_number : '',
        batch: pullType === 'in_batch' ? formData.batch : null,
        package_ids: packageIds,
      }
      const createdPull = await pullsService.create(data)
      
      // Si se especificó un estado inicial, cambiar el estado de todos los paquetes
      if (formData.initial_status && createdPull.id) {
        try {
          const result = await pullsService.changePackagesStatus(createdPull.id, formData.initial_status)
          const statusLabel = PACKAGE_STATUS_OPTIONS.find(s => s.value === formData.initial_status)?.label || formData.initial_status
          toast.success(
            `Saca creada correctamente. ${result.updated_count || packageIds.length} paquete(s) actualizado(s) a "${statusLabel}"`
          )
        } catch (statusError) {
          console.error('Error al cambiar estado de paquetes:', statusError)
          toast.warning('Saca creada, pero hubo un error al cambiar el estado de los paquetes')
        }
      } else {
        toast.success('Saca creada correctamente')
      }
      
      navigate('/logistica/pulls')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al crear la saca')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return <LoadingSpinner message="Cargando datos del formulario..." />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-boxes text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                Crear Saca
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Agrupa paquetes para envío
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card header={
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tipo de Saca
          </h2>
        }>
          <div className="flex items-center justify-center gap-4 p-4">
            <button
              type="button"
              onClick={() => {
                setPullType('individual')
                setFormData({...formData, batch: ''})
                setBatchInfo(null)
              }}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                pullType === 'individual'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <i className="fas fa-box mr-2"></i>
              Saca Individual
            </button>
            
            <button
              type="button"
              onClick={() => {
                setPullType('in_batch')
                setFormData({...formData, transport_agency: '', guide_number: ''})
              }}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                pullType === 'in_batch'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <i className="fas fa-layer-group mr-2"></i>
              Parte de un Lote
            </button>
          </div>
          
          <div className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">
            {pullType === 'individual' 
              ? 'Esta saca tendrá su propia agencia y número de guía'
              : 'Esta saca heredará datos del lote seleccionado'
            }
          </div>
        </Card>

        <Card header={
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Información Básica
          </h2>
        }>
          <div className="space-y-4">
            <FormField
              label="Destino Común"
              name="common_destiny"
              value={formData.common_destiny}
              onChange={handleInputChange}
              required
              placeholder="Ej: QUITO - PICHINCHA"
            />
          </div>
        </Card>

        {pullType === 'individual' && (
          <Card header={
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Información de Transporte
            </h2>
          }>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Agencia de Transporte
                  <span className="text-gray-500 ml-1">(Opcional)</span>
                </label>
                <select
                name="transport_agency"
                value={formData.transport_agency}
                onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">-- Sin agencia asignada --</option>
                  {agencies.map((agency) => (
                    <option key={agency.id} value={agency.id}>
                      {agency.name} {agency.phone_number ? `- ${agency.phone_number}` : ''}
                    </option>
                  ))}
                </select>
                {agencies.length === 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    <i className="fas fa-exclamation-triangle mr-1"></i>
                    No hay agencias activas
                  </p>
                )}
              </div>

              <FormField
                label="Número de Guía"
                name="guide_number"
                value={formData.guide_number}
                onChange={handleInputChange}
                placeholder="Ej: SACA-2025-001"
                helpText="Número de guía para esta saca (opcional)"
              />
            </div>
          </Card>
        )}

        {pullType === 'in_batch' && (
          <Card header={
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Selección de Lote
            </h2>
          }>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lote
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  name="batch"
                  value={formData.batch}
                  onChange={handleInputChange}
                  required={pullType === 'in_batch'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">-- Seleccionar lote --</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.destiny} ({batch.id.slice(0, 8)}...)
                    </option>
                  ))}
                </select>
              </div>

              {batchInfo && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <h4 className="font-semibold mb-2 text-amber-900 dark:text-amber-100">
                    <i className="fas fa-layer-group mr-2"></i>
                    Datos Heredados del Lote:
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-amber-800 dark:text-amber-200">
                      <strong>Destino:</strong> {batchInfo.destiny}
                    </p>
                    <p className="text-amber-800 dark:text-amber-200">
                      <strong>Agencia:</strong> {batchInfo.transport_agency_name || 'Sin asignar'}
                    </p>
                    <p className="text-amber-800 dark:text-amber-200">
                      <strong>Número de Guía:</strong> {batchInfo.guide_number || 'Sin asignar'}
                    </p>
                  </div>
                </div>
              )}
          </div>
        </Card>
        )}

        <Card header={
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tamaño de la Saca
          </h2>
        }>
          <FormField
            label="Tamaño"
            name="size"
            type="select"
            value={formData.size}
            onChange={handleInputChange}
            required
            options={[
              { value: 'PEQUENO', label: 'Pequeño' },
              { value: 'MEDIANO', label: 'Mediano' },
              { value: 'GRANDE', label: 'Grande' },
            ]}
          />
        </Card>

        <Card header={
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Agregar Paquetes
          </h2>
        }>
          <PackageSelector
            selectedPackages={selectedPackages}
            onPackagesChange={setSelectedPackages}
            filterAvailable={true}
            allowBarcode={true}
            allowDropdown={true}
          />
        </Card>

        {selectedPackages.length > 0 && (
          <Card header={
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-exchange-alt text-white text-sm"></i>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Estado Inicial de Paquetes
              </h2>
            </div>
          }>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Opcionalmente, puedes establecer un estado inicial para los <strong>{selectedPackages.length} paquete(s)</strong> que se agregarán a esta saca.
              </p>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estado Inicial
                  <span className="text-gray-500 ml-1">(Opcional)</span>
                </label>
                <select
                  name="initial_status"
                  value={formData.initial_status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                             focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             transition-colors"
                >
                  {PACKAGE_STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <i className="fas fa-info-circle mr-1"></i>
                  Si seleccionas un estado, todos los paquetes de la saca se actualizarán a ese estado después de crearla. Si dejas "Mantener estado actual", los paquetes conservarán su estado actual.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/logistica/pulls')}
            disabled={loading}
            className="w-auto px-6 py-3"
          >
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
            {loading ? 'Creando...' : 'Crear Saca'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default PullsCreate
