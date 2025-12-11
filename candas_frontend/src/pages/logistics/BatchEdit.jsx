import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import batchesService from '../../services/batchesService'
import transportAgenciesService from '../../services/transportAgenciesService'
import pullsService from '../../services/pullsService'
import { Card, Button, FormField, LoadingSpinner } from '../../components'

const BatchEdit = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [batch, setBatch] = useState(null)
  const [transportAgencies, setTransportAgencies] = useState([])
  const [availablePulls, setAvailablePulls] = useState([])
  
  const [formData, setFormData] = useState({
    destiny: '',
    transport_agency: '',
    guide_number: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadBatch()
    loadTransportAgencies()
    loadAvailablePulls()
  }, [id])

  const loadBatch = async () => {
    try {
      setInitialLoading(true)
      const data = await batchesService.get(id)
      setBatch(data)
      setFormData({
        destiny: data.destiny || '',
        transport_agency: data.transport_agency || '',
        guide_number: data.guide_number || '',
      })
    } catch (error) {
      console.error('Error cargando lote:', error)
      toast.error('Error al cargar el lote')
      navigate('/logistica/batches')
    } finally {
      setInitialLoading(false)
    }
  }

  const loadTransportAgencies = async () => {
    try {
      const data = await transportAgenciesService.getActive()
      setTransportAgencies(data.results || data)
    } catch (error) {
      console.error('Error cargando agencias:', error)
    }
  }

  const loadAvailablePulls = async () => {
    try {
      const data = await pullsService.list({ batch__isnull: 'true' })
      setAvailablePulls(data.results || data)
    } catch (error) {
      console.error('Error cargando sacas:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setHasChanges(true)
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.destiny.trim()) {
      setErrors({ destiny: 'El destino es requerido' })
      toast.error('El destino es requerido')
      return
    }

    setLoading(true)
    try {
      const updateData = {
        destiny: formData.destiny,
        transport_agency: formData.transport_agency || null,
        guide_number: formData.guide_number || null,
      }

      await batchesService.partialUpdate(id, updateData)
      toast.success('Lote actualizado correctamente')
      setHasChanges(false)
      navigate(`/logistica/batches/${id}`)
    } catch (error) {
      console.error('Error actualizando lote:', error)
      const errorData = error.response?.data
      if (errorData) {
        setErrors(errorData)
        toast.error(errorData.detail || 'Error al actualizar el lote')
      } else {
        toast.error('Error al actualizar el lote')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddPull = async (pullId) => {
    try {
      await batchesService.addPull(id, pullId)
      toast.success('Saca agregada al lote')
      loadBatch()
      loadAvailablePulls()
    } catch (error) {
      console.error('Error agregando saca:', error)
      toast.error(error.response?.data?.error || 'Error al agregar la saca')
    }
  }

  const handleRemovePull = async (pullId) => {
    if (!window.confirm('¿Está seguro de quitar esta saca del lote?')) return

    try {
      await batchesService.removePull(id, pullId)
      toast.success('Saca quitada del lote')
      loadBatch()
      loadAvailablePulls()
    } catch (error) {
      console.error('Error quitando saca:', error)
      toast.error('Error al quitar la saca')
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (!window.confirm('Tienes cambios sin guardar. ¿Estás seguro de salir?')) {
        return
      }
    }
    navigate(`/logistica/batches/${id}`)
  }

  if (initialLoading) {
    return <LoadingSpinner message="Cargando lote..." />
  }

  if (!batch) {
    return <div className="text-red-500">Lote no encontrado</div>
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
                Editar Lote
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Modifica la información del lote
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <Card className="border-l-4 border-orange-400">
          <div className="p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <i className="fas fa-info-circle text-orange-500 mr-2"></i>
              Información Básica
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Destino"
                name="destiny"
                value={formData.destiny}
                onChange={handleInputChange}
                required
                error={errors.destiny}
                placeholder="Ej: GUAYAQUIL - ECUADOR"
              />

              <FormField
                label="Agencia de Transporte"
                name="transport_agency"
                type="select"
                value={formData.transport_agency}
                onChange={handleInputChange}
                error={errors.transport_agency}
                options={[
                  { value: '', label: 'Sin agencia' },
                  ...transportAgencies.map(agency => ({
                    value: agency.id,
                    label: agency.name
                  }))
                ]}
              />

              <div className="md:col-span-2">
                <FormField
                  label="Número de Guía"
                  name="guide_number"
                  value={formData.guide_number}
                  onChange={handleInputChange}
                  error={errors.guide_number}
                  placeholder="Ej: LOTE-2025-001"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Gestión de Sacas */}
        <Card className="border-l-4 border-purple-400">
          <div className="p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <i className="fas fa-boxes text-purple-500 mr-2"></i>
              Sacas del Lote ({batch.pulls_list?.length || 0})
            </h2>

            {/* Sacas Actuales */}
            <div className="space-y-2 mb-6">
              {batch.pulls_list && batch.pulls_list.length > 0 ? (
                batch.pulls_list.map(pull => (
                  <div key={pull.id} className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {pull.common_destiny}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {pull.packages_count || 0} paquetes • {pull.size || 'MEDIANO'}
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemovePull(pull.id)}
                    >
                      <i className="fas fa-minus mr-1"></i>
                      Quitar
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <i className="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                  <p>No hay sacas en este lote</p>
                </div>
              )}
            </div>

            {/* Sacas Disponibles */}
            {availablePulls.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                  Agregar Sacas Disponibles
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availablePulls
                    .filter(pull => pull.common_destiny === formData.destiny)
                    .map(pull => (
                      <div key={pull.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {pull.common_destiny}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {pull.packages_count || 0} paquetes • {pull.size || 'MEDIANO'}
                          </div>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAddPull(pull.id)}
                        >
                          <i className="fas fa-plus mr-1"></i>
                          Agregar
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Botones de Acción */}
        <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={loading}
            className="w-auto px-6 py-3"
          >
            <i className="fas fa-times mr-2"></i>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-auto px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default BatchEdit
