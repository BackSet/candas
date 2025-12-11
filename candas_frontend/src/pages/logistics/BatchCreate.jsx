import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import batchesService from '../../services/batchesService'
import transportAgenciesService from '../../services/transportAgenciesService'
import { Card, Button, FormField, PullSelector, LoadingSpinner } from '../../components'

const BatchCreate = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    destiny: '',
    transport_agency: '',
    guide_number: '',
    initial_status: '', // Estado inicial para los paquetes
  })
  const [selectedPulls, setSelectedPulls] = useState([])
  const [loading, setLoading] = useState(false)
  const [agencies, setAgencies] = useState([])
  const [loadingAgencies, setLoadingAgencies] = useState(true)

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

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.destiny) {
      toast.error('El destino es obligatorio')
      return
    }

    if (selectedPulls.length === 0) {
      toast.error('Debes agregar al menos una saca al lote')
      return
    }

    setLoading(true)
    try {
      const pullIds = selectedPulls.map((p) => p.id)
      const data = {
        destiny: formData.destiny,
        transport_agency: formData.transport_agency || null,
        guide_number: formData.guide_number || '',
        pull_ids: pullIds,
      }
      
      const createdBatch = await batchesService.create(data)
      
      // Si se especificó un estado inicial, cambiar el estado de todos los paquetes del lote
      if (formData.initial_status && createdBatch.id) {
        try {
          const result = await batchesService.changePackagesStatus(createdBatch.id, formData.initial_status)
          const statusLabel = PACKAGE_STATUS_OPTIONS.find(s => s.value === formData.initial_status)?.label || formData.initial_status
          toast.success(
            `Lote creado correctamente. ${result.updated_count || 0} paquete(s) actualizado(s) a "${statusLabel}" en ${result.pulls_affected || selectedPulls.length} saca(s)`
          )
        } catch (statusError) {
          console.error('Error al cambiar estado de paquetes:', statusError)
          toast.warning('Lote creado, pero hubo un error al cambiar el estado de los paquetes')
        }
      } else {
        toast.success('Lote creado correctamente')
      }
      
      navigate('/logistica/batches')
    } catch (error) {
      console.error('Error al crear lote:', error)
      toast.error(error.response?.data?.detail || 'Error al crear el lote')
    } finally {
      setLoading(false)
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
                Crear Lote
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Agrupa sacas con características comunes
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card header={
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
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
              value={formData.destiny}
              onChange={handleInputChange}
              required
              placeholder="Ej: QUITO - PICHINCHA"
              helpText="Todas las sacas del lote deben tener este destino"
            />
            
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Las sacas del lote heredarán esta agencia si no tienen una propia
              </p>
              {agencies.length === 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  <i className="fas fa-exclamation-triangle mr-1"></i>
                  No hay agencias activas. Puedes crear una en Catálogo → Agencias de Transporte
                </p>
              )}
            </div>
            
            <FormField
              label="Número de Guía del Lote"
              name="guide_number"
              value={formData.guide_number}
              onChange={handleInputChange}
              placeholder="Ej: LOTE-2025-001"
              helpText="Las sacas del lote heredarán este número de guía si no tienen uno propio"
            />
            
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <i className="fas fa-lightbulb mr-2"></i>
                <strong>Jerarquía de datos:</strong> Los datos del lote (destino, agencia, guía) serán heredados por las sacas que no tengan valores propios definidos.
              </p>
            </div>
          </div>
        </Card>

        <Card header={
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Agregar Sacas al Lote
          </h2>
        }>
          <PullSelector
            selectedPulls={selectedPulls}
            onPullsChange={setSelectedPulls}
            filterAvailable={true}
            label="Seleccionar Sacas"
          />
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <i className="fas fa-info-circle mr-2"></i>
              Las sacas seleccionadas se agruparán en este lote. Asegúrate de que todas tengan el mismo destino.
            </p>
          </div>
        </Card>

        {selectedPulls.length > 0 && (
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
                Opcionalmente, puedes establecer un estado inicial para <strong>todos los paquetes</strong> de las <strong>{selectedPulls.length} saca(s)</strong> que se agregarán a este lote.
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
                  Si seleccionas un estado, todos los paquetes de todas las sacas del lote se actualizarán a ese estado después de crearlo. Si dejas "Mantener estado actual", los paquetes conservarán su estado actual.
                </p>
              </div>
            </div>
          </Card>
        )}

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
            {loading ? 'Creando...' : 'Crear Lote'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default BatchCreate
