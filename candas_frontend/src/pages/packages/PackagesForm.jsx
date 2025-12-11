import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import Select from 'react-select'
import packagesService from '../../services/packagesService'
import pullsService from '../../services/pullsService'
import transportAgenciesService from '../../services/transportAgenciesService'
import { FormField, LoadingSpinner, Card, Button, Badge } from '../../components'
import { PackageListItem, PackageDisplayConfigModal } from '../../components/domain/packages'
import usePackageDisplayConfig from '../../hooks/usePackageDisplayConfig'
import logger from '../../utils/logger'
import { getSelectStyles, getSelectTheme } from '../../utils/selectStyles'

const PackagesForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEdit)
  const [formData, setFormData] = useState({
    guide_number: '',
    nro_master: '',
    agency_guide_number: '',
    name: '',
    address: '',
    city: '',
    province: '',
    phone_number: '',
    status: 'NO_RECEPTADO',
    notes: '',
    hashtags: '',
    transport_agency: '',
    delivery_agency: '',
    pull: '',
    parent: '',
  })
  const [errors, setErrors] = useState({})
  const [packageType, setPackageType] = useState('unassigned') // 'individual', 'unassigned', 'in_pull'
  const [pulls, setPulls] = useState([])
  const [pullInfo, setPullInfo] = useState(null)
  const [agencies, setAgencies] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [availableParents, setAvailableParents] = useState([])
  const [parentInfo, setParentInfo] = useState(null)
  const [parentSearchCode, setParentSearchCode] = useState('')
  const [loadingParents, setLoadingParents] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const parentBarcodeRef = useRef(null)

  const {
    visibleFields,
    dropdownFormat,
    listFormat,
    setVisibleFields,
    setDropdownFormat,
    setListFormat,
    formatDropdownLabel,
  } = usePackageDisplayConfig()

  const STATUS_CHOICES = [
    { value: 'NO_RECEPTADO', label: 'No Receptado' },
    { value: 'EN_BODEGA', label: 'En Bodega' },
    { value: 'EN_TRANSITO', label: 'En Tránsito' },
    { value: 'ENTREGADO', label: 'Entregado' },
    { value: 'DEVUELTO', label: 'Devuelto' },
    { value: 'RETENIDO', label: 'Retenido' },
  ]

  useEffect(() => {
    loadInitialData()
    if (isEdit) {
      loadPackage()
    }
  }, [id])

  useEffect(() => {
    if (formData.pull && packageType === 'in_pull') {
      loadPullInfo(formData.pull)
    } else {
      setPullInfo(null)
    }
  }, [formData.pull, packageType])

  useEffect(() => {
    if (formData.parent) {
      loadParentInfo(formData.parent)
    } else {
      setParentInfo(null)
    }
  }, [formData.parent])

  // Recargar parents disponibles cuando cambia el ID (para excluir el actual)
  useEffect(() => {
    if (isEdit && id) {
      loadAvailableParents()
    }
  }, [id, isEdit])

  const loadInitialData = async () => {
    try {
      setLoadingData(true)
      const [pullsData, agenciesData] = await Promise.all([
        pullsService.list({ available: true }),
        transportAgenciesService.getActive()
      ])
      setPulls(pullsData.results ?? pullsData ?? [])
      setAgencies(agenciesData.results ?? agenciesData ?? [])
      await loadAvailableParents()
    } catch (error) {
      logger.error('Error cargando datos:', error)
      toast.error('Error al cargar datos del formulario')
    } finally {
      setLoadingData(false)
    }
  }

  const loadAvailableParents = async () => {
    try {
      setLoadingParents(true)
      // Cargar todos los paquetes excepto el actual (si está editando)
      const params = { page_size: 100 }
      const data = await packagesService.list(params)
      let packages = data.results ?? []
      
      // Si está editando, excluir el paquete actual
      if (isEdit && id) {
        packages = packages.filter(pkg => pkg.id !== id)
      }
      
      setAvailableParents(packages)
    } catch (error) {
      logger.error('Error cargando paquetes disponibles:', error)
      toast.error('Error al cargar paquetes disponibles para parent')
    } finally {
      setLoadingParents(false)
    }
  }

  const loadPullInfo = async (pullId) => {
    try {
      const data = await pullsService.get(pullId)
      setPullInfo(data)
    } catch (error) {
      logger.error('Error cargando información de saca:', error)
      setPullInfo(null)
    }
  }

  const loadParentInfo = async (parentId) => {
    try {
      const data = await packagesService.get(parentId)
      setParentInfo(data)
    } catch (error) {
      logger.error('Error cargando información de parent:', error)
      setParentInfo(null)
    }
  }

  const handleParentSearch = async (e) => {
    if (e) {
      e.preventDefault()
    }

    if (!parentSearchCode.trim()) {
      toast.warning('Ingrese un número de guía')
      return
    }

    try {
      setLoadingParents(true)
      // Buscar paquete por número de guía
      const params = { search: parentSearchCode.trim(), page_size: 1 }
      const data = await packagesService.list(params)
      const packages = data.results ?? []

      if (packages.length === 0) {
        toast.error('No se encontró ningún paquete con ese número de guía')
        setParentSearchCode('')
        if (parentBarcodeRef.current) {
          parentBarcodeRef.current.focus()
        }
        return
      }

      const packageFound = packages[0]

      // Validar que no sea el mismo paquete (solo en edición)
      if (isEdit && packageFound.id === id) {
        toast.error('Un paquete no puede ser su propio parent')
        setParentSearchCode('')
        if (parentBarcodeRef.current) {
          parentBarcodeRef.current.focus()
        }
        return
      }

      // Asignar como parent
      setFormData({
        ...formData,
        parent: packageFound.id
      })
      setParentInfo(packageFound)
      toast.success(`Parent asignado: ${packageFound.guide_number}`)
      setParentSearchCode('')
      
      // Re-enfocar para el siguiente escaneo
      setTimeout(() => {
        if (parentBarcodeRef.current) {
          parentBarcodeRef.current.focus()
        }
      }, 100)
    } catch (error) {
      logger.error('Error buscando parent:', error)
      toast.error('Error al buscar el paquete')
    } finally {
      setLoadingParents(false)
    }
  }

  const handleParentKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleParentSearch()
    }
  }

  const handleParentSelect = (selectedOption) => {
    if (selectedOption) {
      const packageId = selectedOption.value
      
      // Validar que no sea el mismo paquete (solo en edición)
      if (isEdit && packageId === id) {
        toast.error('Un paquete no puede ser su propio parent')
        return
      }
      
      setFormData({
        ...formData,
        parent: packageId
      })
    } else {
      setFormData({
        ...formData,
        parent: ''
      })
      setParentInfo(null)
    }
  }

  const loadPackage = async () => {
    try {
      setInitialLoading(true)
      const data = await packagesService.get(id)
      
      // Determinar tipo de paquete
      let type = 'unassigned'
      if (data.pull) {
        type = 'in_pull'
      } else if (data.transport_agency) {
        type = 'individual'
      }
      
      setPackageType(type)
      
      // Extraer IDs de ForeignKey (pueden venir como objetos o como IDs)
      const getForeignKeyId = (value) => {
        if (!value) return ''
        if (typeof value === 'string') return value
        if (typeof value === 'object' && value.id) return value.id
        return ''
      }
      
      setFormData({
        guide_number: data.guide_number ?? '',
        nro_master: data.nro_master ?? '',
        agency_guide_number: data.agency_guide_number ?? '',
        name: data.name ?? '',
        address: data.address ?? '',
        city: data.city ?? '',
        province: data.province ?? '',
        phone_number: data.phone_number ?? '',
        status: data.status ?? 'NO_RECEPTADO',
        notes: data.notes ?? '',
        hashtags: data.hashtags ?? '',
        transport_agency: getForeignKeyId(data.transport_agency),
        delivery_agency: getForeignKeyId(data.delivery_agency),
        pull: getForeignKeyId(data.pull),
        parent: getForeignKeyId(data.parent),
      })
      
      // Cargar información del parent si existe
      const parentId = getForeignKeyId(data.parent)
      if (parentId) {
        // Si tenemos parent_info, usarlo directamente
        if (data.parent_info) {
          setParentInfo(data.parent_info)
        } else {
          // Si no, cargar desde el servidor
          loadParentInfo(parentId)
        }
      }
    } catch (error) {
      toast.error('Error al cargar el paquete')
      logger.error(error)
      navigate('/paquetes')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    // Limpiar error del campo
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.guide_number.trim()) {
      newErrors.guide_number = 'El número de guía es requerido'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida'
    }

    if (!formData.province.trim()) {
      newErrors.province = 'La provincia es requerida'
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'El teléfono es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Por favor, completa todos los campos requeridos')
      return
    }

    setLoading(true)
    try {
      // Preparar datos para enviar, asegurando que todos los campos requeridos estén presentes
      const dataToSend = {
        guide_number: formData.guide_number,
        nro_master: formData.nro_master || '',
        agency_guide_number: packageType === 'individual' ? (formData.agency_guide_number || '') : '',
        name: formData.name,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        phone_number: formData.phone_number,
        status: formData.status,
        notes: formData.notes || '',
        hashtags: formData.hashtags || '',
        // Limpiar campos según el tipo
        transport_agency: packageType === 'individual' ? (formData.transport_agency || null) : null,
        delivery_agency: formData.delivery_agency || null,
        pull: packageType === 'in_pull' ? (formData.pull || null) : null,
        parent: formData.parent && formData.parent !== '' ? formData.parent : null,
      }
      
      // Remover campos null o vacíos que no son necesarios usando Object.entries
      const foreignKeyFields = ['transport_agency', 'delivery_agency', 'pull', 'parent']
      Object.entries(dataToSend).forEach(([key, value]) => {
        if (value === '' || value === null) {
          // Para PUT, necesitamos enviar null explícitamente para ForeignKeys
          if (foreignKeyFields.includes(key)) {
            dataToSend[key] = null
          } else if (value === '') {
            // Para campos de texto, mantener cadena vacía
            dataToSend[key] = ''
          }
        }
      })
      
      if (isEdit) {
        await packagesService.update(id, dataToSend)
        toast.success('Paquete actualizado correctamente')
      } else {
        await packagesService.create(dataToSend)
        toast.success('Paquete creado correctamente')
      }
      navigate('/paquetes')
    } catch (error) {
      logger.error('Error al guardar paquete:', error)
      logger.error('Error response:', error.response?.data)
      
      // Manejar errores de validación del backend usando métodos modernos
      if (error.response?.data) {
        const errorData = error.response.data
        const backendErrors = {}
        const errorMessages = []
        
        Object.entries(errorData).forEach(([key, errorValue]) => {
          // Si es un array, tomar el primer elemento
          const processedError = Array.isArray(errorValue) ? errorValue[0] : errorValue
          
          // Si es un objeto con mensajes anidados, extraerlos usando flatMap
          if (typeof processedError === 'object' && processedError !== null) {
            const nestedMessages = Object.values(processedError)
              .flatMap(msg => Array.isArray(msg) ? msg : [msg])
            errorMessages.push(...nestedMessages)
          } else {
            errorMessages.push(processedError)
            backendErrors[key] = processedError
          }
        })
        
        setErrors(backendErrors)
        
        // Mostrar todos los mensajes de error
        const errorMessage = errorMessages.length > 0 
          ? errorMessages.join('. ')
          : 'Error al guardar el paquete'
        toast.error(errorMessage)
      } else {
        const errorMessage = error.response?.data?.detail || 
                            error.response?.data?.message ||
                            error.message ||
                            'Error al guardar el paquete'
        toast.error(errorMessage)
      }
      
      logger.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading || loadingData) {
    return <LoadingSpinner message="Cargando datos del formulario..." />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-box text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {isEdit ? 'Editar Paquete' : 'Crear Paquete'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isEdit ? 'Modifica la información del paquete' : 'Registra un nuevo paquete'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card 
          header={
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Información del Paquete
            </h2>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Número de Guía"
                name="guide_number"
                value={formData.guide_number}
                onChange={handleInputChange}
                required
                error={errors.guide_number}
                disabled={isEdit}
                placeholder="Ej: EC001234567"
                helpText={isEdit ? 'El número de guía no se puede modificar' : ''}
              />
              <FormField
                label="Número Master"
                name="nro_master"
                value={formData.nro_master}
                onChange={handleInputChange}
                error={errors.nro_master}
                placeholder="Ej: MAST-2025-001"
              />
            </div>

            <FormField
              label="Estado"
              name="status"
              type="select"
              value={formData.status}
              onChange={handleInputChange}
              options={STATUS_CHOICES}
              required
              error={errors.status}
            />
          </div>
        </Card>

        <Card 
          header={
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Información del Destinatario
            </h2>
          }
        >
          <div className="space-y-4">
            <FormField
              label="Nombre del Destinatario"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              error={errors.name}
              placeholder="Ej: Juan Pérez"
            />

            <FormField
              label="Dirección"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              error={errors.address}
              placeholder="Ej: Av. 10 de Agosto y Orellana"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Ciudad"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
                error={errors.city}
                placeholder="Ej: QUITO"
              />
              <FormField
                label="Provincia"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                required
                error={errors.province}
                placeholder="Ej: PICHINCHA"
              />
            </div>

            <FormField
              label="Teléfono"
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleInputChange}
              required
              error={errors.phone_number}
              placeholder="Ej: 0991234567"
            />
          </div>
        </Card>

        <Card 
          header={
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Información Adicional
            </h2>
          }
        >
          <div className="space-y-4">
            <FormField
              label="Notas"
              name="notes"
              type="textarea"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              error={errors.notes}
              placeholder="Ej: Paquete frágil, entregar en horario de oficina"
              helpText="Información adicional sobre el paquete"
            />

            <FormField
              label="Hashtags"
              name="hashtags"
              value={formData.hashtags}
              onChange={handleInputChange}
              error={errors.hashtags}
              placeholder="Ej: #urgente #fragil #express"
              helpText="Etiquetas separadas por espacios"
            />
          </div>
        </Card>

        <Card 
          header={
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                <i className="fas fa-sitemap mr-2 text-cyan-500"></i>
                Paquete Parent (Opcional)
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
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <i className="fas fa-info-circle text-blue-500"></i>
              Asigne un paquete parent si este paquete es parte de otro paquete mayor.
            </p>
            
            {/* Busqueda por codigo de barras */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <i className="fas fa-barcode text-gray-400"></i>
                Buscar por Codigo de Barras
              </label>
              <form onSubmit={handleParentSearch} className="flex gap-2">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-qrcode text-gray-400"></i>
                  </div>
                  <input
                    ref={parentBarcodeRef}
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border-2 border-cyan-400 dark:border-cyan-500 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                    placeholder="Escanear o ingresar numero de guia del parent..."
                    value={parentSearchCode}
                    onChange={(e) => setParentSearchCode(e.target.value)}
                    onKeyDown={handleParentKeyDown}
                    disabled={loadingParents}
                  />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleParentSearch}
                  icon={<i className="fas fa-search"></i>}
                  disabled={loadingParents}
                  className="px-4"
                >
                  Buscar
                </Button>
              </form>
            </div>

            {/* Dropdown con busqueda */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                Seleccionar Parent desde Lista
              </label>
              <Select
                options={availableParents.map(pkg => ({
                  value: pkg.id,
                  label: formatDropdownLabel(pkg),
                  data: pkg
                }))}
                value={availableParents
                  .filter(pkg => pkg.id === formData.parent)
                  .map(pkg => ({
                    value: pkg.id,
                    label: formatDropdownLabel(pkg),
                    data: pkg
                  }))[0] || null}
                onChange={handleParentSelect}
                placeholder="Buscar por guia, nombre o ciudad..."
                isClearable
                isLoading={loadingParents}
                filterOption={(option, searchText) => {
                  if (!searchText) return true
                  const search = searchText.toLowerCase()
                  const pkg = option.data
                  return (
                    pkg.guide_number?.toLowerCase().includes(search) ||
                    pkg.name?.toLowerCase().includes(search) ||
                    pkg.city?.toLowerCase().includes(search) ||
                    pkg.nro_master?.toLowerCase().includes(search) ||
                    pkg.province?.toLowerCase().includes(search)
                  )
                }}
                styles={getSelectStyles()}
                theme={getSelectTheme}
                className="react-select-container"
                classNamePrefix="react-select"
                noOptionsMessage={() => 'No se encontraron paquetes'}
                loadingMessage={() => 'Buscando...'}
              />
              {errors.parent && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.parent}</p>
              )}
            </div>

            {/* Informacion del parent seleccionado usando PackageListItem */}
            {parentInfo && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Parent Seleccionado
                  </h4>
                </div>
                <PackageListItem
                  package={parentInfo}
                  onRemove={() => {
                    setFormData({ ...formData, parent: '' })
                    setParentInfo(null)
                  }}
                  showRemove={true}
                  showStatus={true}
                />
              </div>
            )}
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

        <Card 
          header={
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tipo de Envío
            </h2>
          }
        >
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <input
                type="radio"
                name="packageType"
                value="individual"
                checked={packageType === 'individual'}
                onChange={(e) => {
                  setPackageType(e.target.value)
                  setFormData({...formData, pull: '', agency_guide_number: ''})
                  setPullInfo(null)
                }}
                className="w-5 h-5 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">
                  <i className="fas fa-box mr-2 text-blue-600"></i>
                  Envío Individual
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  El paquete tiene su propia agencia de transporte
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <input
                type="radio"
                name="packageType"
                value="unassigned"
                checked={packageType === 'unassigned'}
                onChange={(e) => {
                  setPackageType(e.target.value)
                  setFormData({...formData, pull: '', transport_agency: '', agency_guide_number: ''})
                  setPullInfo(null)
                }}
                className="w-5 h-5 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">
                  <i className="fas fa-warehouse mr-2 text-gray-600"></i>
                  Sin Asignar (En Bodega)
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  El paquete está en bodega, sin agencia ni saca asignada
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <input
                type="radio"
                name="packageType"
                value="in_pull"
                checked={packageType === 'in_pull'}
                onChange={(e) => {
                  setPackageType(e.target.value)
                  setFormData({...formData, transport_agency: '', agency_guide_number: ''})
                }}
                className="w-5 h-5 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">
                  <i className="fas fa-layer-group mr-2 text-green-600"></i>
                  Asignado a Saca
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  El paquete heredará datos de la saca/lote
                </div>
              </div>
            </label>
          </div>
        </Card>

        {packageType === 'individual' && (
          <Card 
            header={
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Información de Envío Individual
              </h2>
            }
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Agencia de Transporte
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  name="transport_agency"
                  value={formData.transport_agency}
                  onChange={handleInputChange}
                  required={packageType === 'individual'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">-- Seleccionar agencia --</option>
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
                {errors.transport_agency && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.transport_agency}</p>
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
                  placeholder="Ej: AG-12345"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Número de guía asignado por la agencia de transporte
                </p>
                {errors.agency_guide_number && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.agency_guide_number}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {packageType === 'unassigned' && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-gray-700 dark:text-gray-300">
              <i className="fas fa-warehouse mr-2 text-gray-600"></i>
              <strong>Paquete en bodega:</strong> Este paquete no tiene agencia de transporte ni saca asignada. Puede ser asignado posteriormente.
            </p>
          </div>
        )}

        {packageType === 'in_pull' && (
          <Card 
            header={
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Asignación a Saca
              </h2>
            }
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Saca
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  name="pull"
                  value={formData.pull}
                  onChange={handleInputChange}
                  required={packageType === 'in_pull'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">-- Seleccionar saca --</option>
                  {pulls.map((pull) => (
                    <option key={pull.id} value={pull.id}>
                      {pull.common_destiny} - {pull.size_display} ({pull.id.slice(0, 8)})
                    </option>
                  ))}
                </select>
                {errors.pull && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.pull}</p>
                )}
              </div>

              {pullInfo && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <h4 className="font-semibold mb-2 text-green-900 dark:text-green-100">
                    <i className="fas fa-check-circle mr-2"></i>
                    Datos Heredados:
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-green-800 dark:text-green-200">
                      <strong>Saca:</strong> {pullInfo.common_destiny}
                    </p>
                    <p className="text-green-800 dark:text-green-200">
                      <strong>Agencia:</strong> {pullInfo.effective_agency?.name || 'Sin asignar'}
                    </p>
                    <p className="text-green-800 dark:text-green-200">
                      <strong>Número de Guía:</strong> {pullInfo.effective_guide_number || 'Sin asignar'}
                    </p>
                    {pullInfo.batch_info && (
                      <div className="mt-2 pt-2 border-t border-green-300 dark:border-green-700">
                        <p className="text-green-800 dark:text-green-200 flex items-center gap-2">
                          <Badge variant="success">Lote</Badge>
                          <span>{pullInfo.batch_info.destiny}</span>
                        </p>
                      </div>
                    )}
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
            onClick={() => navigate('/paquetes')}
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
            className="w-auto px-6 py-3"
            icon={!loading && <i className="fas fa-save"></i>}
          >
            {loading ? 'Guardando...' : `${isEdit ? 'Actualizar' : 'Crear'} Paquete`}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default PackagesForm
