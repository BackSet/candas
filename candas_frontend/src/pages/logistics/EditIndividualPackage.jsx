import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import packagesService from '../../services/packagesService'
import catalogService from '../../services/catalogService'
import { Card, Button, LoadingSpinner, Badge } from '../../components'

const EditIndividualPackage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [packageData, setPackageData] = useState(null)
  const [transportAgencies, setTransportAgencies] = useState([])
  const [formData, setFormData] = useState({
    status: '',
    transport_agency: '',
    agency_guide_number: ''
  })
  const [errors, setErrors] = useState({})

  const STATUS_CHOICES = [
    { value: 'NO_RECEPTADO', label: 'No Receptado' },
    { value: 'EN_BODEGA', label: 'En Bodega' },
    { value: 'EN_TRANSITO', label: 'En Tránsito' },
    { value: 'ENTREGADO', label: 'Entregado' },
    { value: 'DEVUELTO', label: 'Devuelto' },
    { value: 'RETENIDO', label: 'Retenido' },
  ]

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setInitialLoading(true)
      const [packageResponse, agencies] = await Promise.all([
        packagesService.get(id),
        catalogService.getTransportAgencies()
      ])
      
      setPackageData(packageResponse)
      setTransportAgencies(agencies)
      setFormData({
        status: packageResponse.status || '',
        transport_agency: packageResponse.transport_agency || '',
        agency_guide_number: packageResponse.agency_guide_number || ''
      })
    } catch (error) {
      toast.error('Error al cargar el paquete')
      console.error(error)
      navigate('/logistica/individuales')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.status) {
      newErrors.status = 'El estado es requerido'
    }
    if (!formData.transport_agency) {
      newErrors.transport_agency = 'La agencia de transporte es requerida'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    try {
      setLoading(true)
      
      const dataToSend = {
        status: formData.status,
        transport_agency: formData.transport_agency,
        agency_guide_number: formData.agency_guide_number || null
      }
      
      await packagesService.partialUpdate(id, dataToSend)
      toast.success('Paquete actualizado correctamente')
      navigate('/logistica/individuales')
    } catch (error) {
      if (error.response?.data) {
        const serverErrors = error.response.data
        if (typeof serverErrors === 'object') {
          setErrors(serverErrors)
          Object.values(serverErrors).forEach(err => {
            toast.error(Array.isArray(err) ? err[0] : err)
          })
        } else {
          toast.error('Error al actualizar el paquete')
        }
      } else {
        toast.error('Error al actualizar el paquete')
      }
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status) => {
    const statusVariants = {
      NO_RECEPTADO: 'default',
      EN_BODEGA: 'info',
      EN_TRANSITO: 'warning',
      ENTREGADO: 'success',
      DEVUELTO: 'danger',
      RETENIDO: 'secondary',
    }
    return statusVariants[status] || 'default'
  }

  if (initialLoading) {
    return <LoadingSpinner />
  }

  if (!packageData) {
    return null
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-shipping-fast text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Modificar Paquete Individual
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Actualiza el estado y la información de transporte del paquete
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Paquete (Solo Lectura) */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              <i className="fas fa-info-circle mr-2"></i>
              Información del Paquete
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Número de Guía
                </label>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {packageData.guide_number}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Número Master
                </label>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {packageData.nro_master || '-'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Destinatario
                </label>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {packageData.name}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Teléfono
                </label>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {packageData.phone_number || '-'}
                </p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Dirección
                </label>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {packageData.address}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Ciudad
                </label>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {packageData.city}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Provincia
                </label>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {packageData.province}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Campos Editables */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              <i className="fas fa-edit mr-2"></i>
              Información Editable
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estado <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Selecciona un estado</option>
                  {STATUS_CHOICES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                {errors.status && <p className="text-sm text-red-600 dark:text-red-400">{errors.status}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estado Actual
                </label>
                <div className="flex items-center h-10">
                  <Badge variant={getStatusBadgeVariant(packageData.status)}>
                    {packageData.status_display || packageData.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Agencia de Transporte <span className="text-red-500">*</span>
                </label>
                <select
                  name="transport_agency"
                  value={formData.transport_agency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Selecciona una agencia</option>
                  {transportAgencies.map(agency => (
                    <option key={agency.id} value={agency.id}>
                      {agency.name}
                    </option>
                  ))}
                </select>
                {errors.transport_agency && <p className="text-sm text-red-600 dark:text-red-400">{errors.transport_agency}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Número de Guía de la Agencia
                </label>
                <input
                  type="text"
                  name="agency_guide_number"
                  value={formData.agency_guide_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ej: AG-12345"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Número de guía asignado por la agencia de transporte (opcional)
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/logistica/individuales')}
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
            icon={loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
            className="w-auto px-6 py-3"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default EditIndividualPackage
