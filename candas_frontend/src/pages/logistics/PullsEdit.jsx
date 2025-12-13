import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import pullsService from '../../services/pullsService'
import transportAgenciesService from '../../services/transportAgenciesService'
import batchesService from '../../services/batchesService'
import { Card, Button, FormField, LoadingSpinner } from '../../components'

const PullsEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pullType, setPullType] = useState('individual') // 'individual' o 'in_batch'
  const [formData, setFormData] = useState({
    common_destiny: '',
    size: '',
    transport_agency: '',
    guide_number: '',
    batch: '',
  })
  const [agencies, setAgencies] = useState([])
  const [batches, setBatches] = useState([])
  const [batchInfo, setBatchInfo] = useState(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    fetchInitialData()
    loadPull()
  }, [id])

  useEffect(() => {
    if (formData.batch) {
      loadBatchInfo(formData.batch)
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

  const loadPull = async () => {
    try {
      setLoading(true)
      const data = await pullsService.get(id)
      
      // Determinar tipo de saca
      const type = data.batch ? 'in_batch' : 'individual'
      setPullType(type)
      
      setFormData({
        common_destiny: data.common_destiny || '',
        size: data.size || '',
        transport_agency: data.transport_agency || '',
        guide_number: data.guide_number || '',
        batch: data.batch || '',
      })
      
      // Cargar batch info si tiene uno asignado
      if (data.batch) {
        loadBatchInfo(data.batch)
      }
    } catch (error) {
      toast.error('Error al cargar la saca')
      console.error(error)
      navigate('/logistica/pulls')
    } finally {
      setLoading(false)
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

    setSaving(true)
    try {
      const dataToSend = {
        common_destiny: formData.common_destiny,
        size: formData.size,
        transport_agency: pullType === 'individual' ? (formData.transport_agency || null) : null,
        guide_number: pullType === 'individual' ? formData.guide_number : '',
        batch: pullType === 'in_batch' ? formData.batch : null,
      }
      await pullsService.update(id, dataToSend)
      toast.success('Saca actualizada correctamente')
      navigate(`/logistica/pulls/${id}`)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al actualizar la saca')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  if (loading || loadingData) {
    return <LoadingSpinner message="Cargando saca..." />
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
                Editar Saca
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Modifica la información de la saca
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

            <FormField
              label="Tamaño"
              name="size"
              type="select"
              value={formData.size}
              onChange={handleInputChange}
              required
              options={[
                { value: '', label: 'Selecciona un tamaño' },
                { value: 'PEQUENO', label: 'Pequeño' },
                { value: 'MEDIANO', label: 'Mediano' },
                { value: 'GRANDE', label: 'Grande' },
              ]}
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
                helpText="Número de guía para esta saca"
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

        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(`/logistica/pulls/${id}`)}
            disabled={saving}
            className="w-auto px-6 py-3"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            loading={saving}
            icon={!saving && <i className="fas fa-save"></i>}
            className="w-auto px-6 py-3"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default PullsEdit
