import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import packagesService from '../../services/packagesService'
import catalogService from '../../services/catalogService'
import { Card, Button, LoadingSpinner, Badge } from '../../components'
import { PackageListItem, PackageDisplayConfigModal } from '../../components/domain/packages'
import usePackageDisplayConfig from '../../hooks/usePackageDisplayConfig'
import logger from '../../utils/logger'

const CreateIndividualPackage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [transportAgencies, setTransportAgencies] = useState([])
  const [loadingCatalogs, setLoadingCatalogs] = useState(true)
  const [allPackages, setAllPackages] = useState([])
  const [displayedPackages, setDisplayedPackages] = useState([])
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [formData, setFormData] = useState({
    transport_agency: '',
    agency_guide_number: ''
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [showConfigModal, setShowConfigModal] = useState(false)

  const {
    visibleFields,
    dropdownFormat,
    listFormat,
    setVisibleFields,
    setDropdownFormat,
    setListFormat,
  } = usePackageDisplayConfig()

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoadingCatalogs(true)
      setLoadingPackages(true)
      setError(null)
      
      const [agenciesResponse, packagesData] = await Promise.all([
        catalogService.getTransportAgencies(),
        packagesService.list({
          shipment_type: 'sin_envio',
          page_size: 100
        })
      ])
      
      // Manejar tanto respuesta paginada como array directo
      const agencies = agenciesResponse?.results || agenciesResponse || []
      
      logger.log('Agencias cargadas:', agencies)
      
      setTransportAgencies(Array.isArray(agencies) ? agencies : [])
      setAllPackages(packagesData.results || [])
      setDisplayedPackages(packagesData.results || [])
    } catch (error) {
      logger.error('Error al cargar datos:', error)
      setError(error.message || 'Error al cargar los datos')
      toast.error('Error al cargar los datos')
      
      // Asegurarse de que los arrays están inicializados
      setTransportAgencies([])
      setAllPackages([])
      setDisplayedPackages([])
    } finally {
      setLoadingCatalogs(false)
      setLoadingPackages(false)
    }
  }

  const handleSearch = () => {
    const term = searchTerm.trim().toLowerCase()
    
    if (!term) {
      // Si no hay término de búsqueda, mostrar todos
      setDisplayedPackages(allPackages)
      return
    }

    const filtered = allPackages.filter(pkg => 
      pkg.guide_number?.toLowerCase().includes(term) ||
      pkg.nro_master?.toLowerCase().includes(term) ||
      pkg.name?.toLowerCase().includes(term) ||
      pkg.city?.toLowerCase().includes(term)
    )
    
    setDisplayedPackages(filtered)
    
    if (filtered.length === 0) {
      toast.info('No se encontraron paquetes con ese término')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const handlePackageSelect = (pkg) => {
    try {
      logger.log('Paquete seleccionado:', pkg)
      setSelectedPackage(pkg)
      setFormData({
        transport_agency: '',
        agency_guide_number: ''
      })
      setErrors({})
    } catch (error) {
      logger.error('Error al seleccionar paquete:', error)
      toast.error('Error al seleccionar el paquete')
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
    
    if (!selectedPackage) {
      newErrors.package = 'Debes seleccionar un paquete'
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
        transport_agency: formData.transport_agency,
        agency_guide_number: formData.agency_guide_number || null
      }
      
      await packagesService.partialUpdate(selectedPackage.id, dataToSend)
      toast.success('Paquete convertido a individual correctamente')
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
          toast.error('Error al convertir el paquete')
        }
      } else {
        toast.error('Error al convertir el paquete')
      }
      logger.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loadingCatalogs || loadingPackages) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                <i className="fas fa-shipping-fast text-2xl text-white"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Convertir a Envío Individual
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Busca o selecciona un paquete sin asignar y asígnale una agencia de transporte
                </p>
              </div>
            </div>
          </div>
        </div>
        <Card>
          <div className="p-8 text-center">
            <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Error al Cargar Datos
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={loadInitialData} variant="primary">
              <i className="fas fa-redo mr-2"></i>
              Reintentar
            </Button>
          </div>
        </Card>
      </div>
    )
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
                Convertir a Envío Individual
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Busca o selecciona un paquete sin asignar y asígnale una agencia de transporte
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Busqueda y Lista de Paquetes */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <i className="fas fa-search text-cyan-500"></i>
              Paquetes Disponibles
            </h2>
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Configurar visualizacion"
            >
              <i className="fas fa-sliders-h"></i>
              <span>Configurar</span>
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Sin Saca, Sin Lote
          </p>
          <div className="space-y-4">
            {/* Campo de busqueda */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-barcode text-gray-400"></i>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    if (e.target.value === '') {
                      setDisplayedPackages(allPackages)
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 border-2 border-cyan-400 dark:border-cyan-500 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  placeholder="Filtrar por guia, master, nombre o ciudad..."
                />
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={handleSearch}
                icon={<i className="fas fa-search"></i>}
              >
                Buscar
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Mostrando {displayedPackages.length} de {allPackages.length} paquetes disponibles
            </p>

            {/* Lista de paquetes */}
            <div className="mt-4">
              {displayedPackages.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <i className="fas fa-inbox text-4xl text-gray-300 dark:text-gray-600 mb-3"></i>
                  <p className="text-gray-500 dark:text-gray-400">No hay paquetes sin asignar disponibles</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {displayedPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => handlePackageSelect(pkg)}
                      className={`relative cursor-pointer transition-all ${
                        selectedPackage?.id === pkg.id
                          ? 'ring-2 ring-cyan-500 ring-offset-2 dark:ring-offset-gray-900 rounded-xl'
                          : ''
                      }`}
                    >
                      <PackageListItem
                        package={pkg}
                        showRemove={false}
                        showStatus={true}
                        className={selectedPackage?.id === pkg.id ? 'bg-cyan-50 dark:bg-cyan-900/20' : ''}
                      />
                      {selectedPackage?.id === pkg.id && (
                        <div className="absolute top-3 right-3">
                          <i className="fas fa-check-circle text-xl text-cyan-600 dark:text-cyan-400"></i>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Modal de configuracion */}
      <PackageDisplayConfigModal
        show={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        visibleFields={visibleFields}
        dropdownFormat={dropdownFormat}
        listFormat={listFormat}
        onSave={({ visibleFields: newFields, dropdownFormat: newFormat, listFormat: newListFormat }) => {
          setVisibleFields(newFields)
          setDropdownFormat(newFormat)
          setListFormat(newListFormat)
          toast.success('Configuracion guardada')
        }}
      />

      {/* Formulario de Asignación - Solo se muestra si hay paquete seleccionado */}
      {selectedPackage && (
        <form onSubmit={handleSubmit} className="space-y-6">

          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                <i className="fas fa-shipping-fast mr-2"></i>
                Asignar Agencia de Transporte
              </h2>
              
              {/* Info del paquete seleccionado */}
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Paquete Seleccionado
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Guía:</span>{' '}
                    <span className="font-medium text-gray-900 dark:text-white">{selectedPackage.guide_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Master:</span>{' '}
                    <span className="font-medium text-gray-900 dark:text-white">{selectedPackage.nro_master || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Destinatario:</span>{' '}
                    <span className="font-medium text-gray-900 dark:text-white">{selectedPackage.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Ciudad:</span>{' '}
                    <span className="font-medium text-gray-900 dark:text-white">{selectedPackage.city}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <option value="">Selecciona una agencia ({transportAgencies.length} disponibles)</option>
                    {Array.isArray(transportAgencies) && transportAgencies.length > 0 ? (
                      transportAgencies.map(agency => (
                        <option key={agency.id} value={agency.id}>
                          {agency.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No hay agencias disponibles</option>
                    )}
                  </select>
                  {errors.transport_agency && <p className="text-sm text-red-600 dark:text-red-400">{errors.transport_agency}</p>}
                  {transportAgencies.length === 0 && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      <i className="fas fa-exclamation-triangle mr-1"></i>
                      No se cargaron agencias de transporte. Intenta recargar la página.
                    </p>
                  )}
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
              icon={loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-exchange-alt"></i>}
              className="w-auto px-6 py-3"
            >
              {loading ? 'Convirtiendo...' : 'Convertir a Individual'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

export default CreateIndividualPackage
