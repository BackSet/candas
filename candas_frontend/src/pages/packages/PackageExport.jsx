import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { Card, Button, FormField, LoadingSpinner, ColumnSelectorDragDrop } from '../../components'
import packagesService from '../../services/packagesService'
import userPreferencesService from '../../services/userPreferencesService'
import transportAgenciesService from '../../services/transportAgenciesService'

const PackageExport = () => {
  // Estados principales
  const [filterMode, setFilterMode] = useState('custom') // 'current' o 'custom'
  const [filters, setFilters] = useState({
    status: [],
    city: '',
    province: '',
    shipment_type: '',
    transport_agency: '',
    date_from: '',
    date_to: '',
    search: ''
  })
  const [scope, setScope] = useState('all') // 'all' o 'page'
  const [selectedColumns, setSelectedColumns] = useState([])
  const [format, setFormat] = useState('excel')
  const [saveAsPreference, setSaveAsPreference] = useState(false)
  const [estimatedCount, setEstimatedCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingAgencies, setLoadingAgencies] = useState(true)
  const [transportAgencies, setTransportAgencies] = useState([])

  // Estados para vista previa
  const [previewData, setPreviewData] = useState([])
  const [showPreview, setShowPreview] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewPage, setPreviewPage] = useState(1)
  const [previewPageSize, setPreviewPageSize] = useState(25)
  const [previewTotal, setPreviewTotal] = useState(0)
  const [showAllColumns, setShowAllColumns] = useState(false)

  const previewRef = useRef(null)

  // Campos disponibles para exportación
  const AVAILABLE_FIELDS = {
    'guide_number': 'Número de Guía',
    'nro_master': 'Número Master',
    'name': 'Nombre Destinatario',
    'address': 'Dirección',
    'city': 'Ciudad',
    'province': 'Provincia',
    'phone_number': 'Teléfono',
    'status': 'Estado',
    'shipment_type_display': 'Tipo de Envío',
    'transport_agency_name': 'Agencia de Transporte',
    'delivery_agency_name': 'Agencia de Reparto',
    'effective_destiny': 'Destino Efectivo',
    'effective_guide_number': 'Guía Efectiva',
    'pull_name': 'Saca',
    'batch_name': 'Lote',
    'notes': 'Notas',
    'hashtags': 'Hashtags',
    'created_at': 'Fecha Creación',
    'updated_at': 'Fecha Actualización'
  }

  // Estados disponibles
  const STATUS_CHOICES = [
    { value: 'NO_RECEPTADO', label: 'No Receptado' },
    { value: 'EN_BODEGA', label: 'En Bodega' },
    { value: 'EN_TRANSITO', label: 'En Tránsito' },
    { value: 'ENTREGADO', label: 'Entregado' },
    { value: 'DEVUELTO', label: 'Devuelto' },
    { value: 'RETENIDO', label: 'Retenido' }
  ]

  // Helper function para obtener valores de campos
  const getFieldValue = (pkg, fieldId) => {
    switch (fieldId) {
      case 'status':
        return pkg.status_display || pkg.status
      case 'shipment_type_display':
        return pkg.shipment_type_display
      case 'transport_agency_name':
        return pkg.transport_agency?.name || pkg.effective_transport_agency || 'N/A'
      case 'delivery_agency_name':
        return pkg.delivery_agency?.name || 'N/A'
      case 'pull_name':
        return pkg.pull ? `Saca-${pkg.pull}` : 'N/A'
      case 'batch_name':
        return pkg.batch_info ? `Lote-${pkg.batch_info}` : 'N/A'
      case 'created_at':
      case 'updated_at':
        return pkg[fieldId] ? new Date(pkg[fieldId]).toLocaleString('es-ES') : 'N/A'
      case 'hashtags':
        return Array.isArray(pkg[fieldId]) ? pkg[fieldId].join(', ') : (pkg[fieldId] || 'N/A')
      default:
        return pkg[fieldId] || 'N/A'
    }
  }

  // Cargar agencias de transporte
  useEffect(() => {
    loadTransportAgencies()
  }, [])

  const loadTransportAgencies = async () => {
    try {
      const data = await transportAgenciesService.list()
      const agencies = data.results || data
      console.log('Agencias cargadas:', agencies)
      setTransportAgencies(Array.isArray(agencies) ? agencies : [])
    } catch (error) {
      console.error('Error al cargar agencias:', error)
      toast.error('Error al cargar agencias de transporte')
      setTransportAgencies([])
    } finally {
      setLoadingAgencies(false)
    }
  }

  // Cargar preferencias del usuario
  const loadPreferences = async () => {
    try {
      const data = await userPreferencesService.getExportConfig()
      const config = data.export_config || {}
      
      if (config.columns && config.columns.length > 0) {
        setSelectedColumns(config.columns)
      } else {
        // Columnas por defecto
        setSelectedColumns(['guide_number', 'name', 'city', 'status', 'shipment_type_display'])
      }
      
      if (config.format) {
        setFormat(config.format)
      }
      
      toast.success('Preferencias cargadas')
    } catch (error) {
      console.error('Error al cargar preferencias:', error)
      toast.error('Error al cargar preferencias')
      // Establecer valores por defecto
      setSelectedColumns(['guide_number', 'name', 'city', 'status', 'shipment_type_display'])
    }
  }

  // Guardar preferencias
  const savePreferences = async () => {
    try {
      const config = {
        columns: selectedColumns,
        format: format
      }
      await userPreferencesService.updateExportConfig(config)
      toast.success('Preferencias guardadas')
    } catch (error) {
      console.error('Error al guardar preferencias:', error)
      toast.error('Error al guardar preferencias')
    }
  }

  // Estimar cantidad de paquetes con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      estimateCount()
    }, 500)

    return () => clearTimeout(timer)
  }, [filters, filterMode])

  const estimateCount = async () => {
    if (filterMode === 'current') {
      setEstimatedCount('?')
      return
    }

    try {
      const params = {}
      if (filters.status && filters.status.length > 0) {
        params.status = filters.status.join(',')
      }
      if (filters.city) params.city = filters.city
      if (filters.province) params.province = filters.province
      if (filters.shipment_type) params.shipment_type = filters.shipment_type
      if (filters.transport_agency) params.transport_agency = filters.transport_agency
      if (filters.search) params.search = filters.search
      
      const data = await packagesService.list(params)
      setEstimatedCount(data.count || data.results?.length || 0)
    } catch (error) {
      console.error('Error estimando cantidad:', error)
      setEstimatedCount('?')
    }
  }

  // Función para buscar y mostrar vista previa
  const handleSearchPreview = async () => {
    setLoadingPreview(true)

    try {
      const params = {
        page: previewPage,
        page_size: previewPageSize
      }

      // Aplicar filtros
      if (filterMode === 'custom') {
        if (filters.status && filters.status.length > 0) {
          params.status = filters.status.join(',')
        }
        if (filters.city) params.city = filters.city
        if (filters.province) params.province = filters.province
        if (filters.shipment_type) params.shipment_type = filters.shipment_type
        if (filters.transport_agency) params.transport_agency = filters.transport_agency
        if (filters.date_from) params.date_from = filters.date_from
        if (filters.date_to) params.date_to = filters.date_to
        if (filters.search) params.search = filters.search
      }

      const data = await packagesService.list(params)
      setPreviewData(data.results || [])
      setPreviewTotal(data.count || 0)
      setShowPreview(true)

      // Scroll automático a la vista previa
      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)

      toast.success(`${data.count || 0} paquetes encontrados`)
    } catch (error) {
      console.error('Error al buscar paquetes:', error)
      toast.error('Error al buscar paquetes')
    } finally {
      setLoadingPreview(false)
    }
  }

  // Manejar cambios en filtros
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
    // Resetear página de vista previa cuando cambian los filtros
    setPreviewPage(1)
  }

  // Manejar cambios en estado (multi-select)
  const handleStatusChange = (statusValue) => {
    setFilters(prev => {
      const currentStatus = prev.status || []
      const newStatus = currentStatus.includes(statusValue)
        ? currentStatus.filter(s => s !== statusValue)
        : [...currentStatus, statusValue]
      
      return {
        ...prev,
        status: newStatus
      }
    })
    // Resetear página de vista previa cuando cambian los filtros
    setPreviewPage(1)
  }

  // Validar y exportar
  const handleExport = async () => {
    // Validaciones
    if (selectedColumns.length === 0) {
      toast.error('Debe seleccionar al menos una columna')
      return
    }

    if (scope === 'page') {
      toast.error('La exportación de página actual solo está disponible desde la lista de paquetes')
      return
    }

    setLoading(true)

    try {
      // Guardar preferencias si el usuario lo solicitó
      if (saveAsPreference) {
        await savePreferences()
      }

      // Construir datos de exportación
      const exportData = {
        format: format,
        columns: selectedColumns,
        filters: filterMode === 'custom' ? {
          status: filters.status,
          city: filters.city,
          province: filters.province,
          shipment_type: filters.shipment_type,
          transport_agency: filters.transport_agency,
          date_from: filters.date_from,
          date_to: filters.date_to,
          search: filters.search
        } : {},
        scope: scope,
        page_ids: []
      }

      // Llamar al servicio de exportación
      await packagesService.exportPackages(exportData)
      
      toast.success('Archivo exportado exitosamente')
    } catch (error) {
      console.error('Error al exportar:', error)
      const errorMessage = error.response?.data?.error || 'Error al exportar paquetes'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (loadingAgencies) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-file-export text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Exportar Paquetes
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Configure filtros, visualice y exporte sus datos
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={loadPreferences}
            className="hover:scale-105 transition-transform"
          >
            <i className="fas fa-download mr-2"></i>
            Cargar Preferencias
          </Button>
        </div>
      </div>

      {/* Sección 1: Filtros (Más Compacto) */}
      <Card className="border-l-4 border-blue-400 shadow-sm hover:shadow-md transition-shadow">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <i className="fas fa-filter text-blue-500"></i>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              1. Filtros de Búsqueda
            </h2>
          </div>
          
          {/* Toggle de modo de filtro */}
          <div className="mb-3">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  value="custom"
                  checked={filterMode === 'custom'}
                  onChange={(e) => setFilterMode(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Filtros personalizados
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  value="current"
                  checked={filterMode === 'current'}
                  onChange={(e) => setFilterMode(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Usar filtros actuales
                </span>
              </label>
            </div>
          </div>

          {/* Filtros personalizados */}
          {filterMode === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {/* Estados - Multi select con checkboxes mejorado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Estados
                </label>
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/50 overflow-hidden">
                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/50">
                    {STATUS_CHOICES.map(status => (
                      <label 
                        key={status.value} 
                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all ${
                          filters.status.includes(status.value)
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.status.includes(status.value)}
                          onChange={() => handleStatusChange(status.value)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-offset-0"
                        />
                        <span className={`text-sm transition-colors ${
                          filters.status.includes(status.value)
                            ? 'text-blue-700 dark:text-blue-300 font-medium'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {status.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                {filters.status.length > 0 && (
                  <p className="mt-1.5 text-xs text-blue-600 dark:text-blue-400">
                    {filters.status.length} {filters.status.length === 1 ? 'estado' : 'estados'} seleccionado{filters.status.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Ciudad */}
              <FormField
                label="Ciudad"
                type="text"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                placeholder="Ej: Quito"
              />

              {/* Provincia */}
              <FormField
                label="Provincia"
                type="text"
                value={filters.province}
                onChange={(e) => handleFilterChange('province', e.target.value)}
                placeholder="Ej: Pichincha"
              />

              {/* Tipo de Envío */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Tipo de Envío
                </label>
                <select
                  value={filters.shipment_type}
                  onChange={(e) => handleFilterChange('shipment_type', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los tipos</option>
                  <option value="sin_envio">Sin Envío</option>
                  <option value="individual">Envío Individual</option>
                  <option value="saca">Envío en Saca</option>
                  <option value="lote">Envío en Lote</option>
                </select>
              </div>

              {/* Agencia de Transporte */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                  Agencia de Transporte
                </label>
                <div className="relative">
                  <select
                    value={filters.transport_agency}
                    onChange={(e) => handleFilterChange('transport_agency', e.target.value)}
                    disabled={loadingAgencies}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer transition-all hover:border-gray-300 dark:hover:border-gray-600"
                  >
                    <option value="">
                      {loadingAgencies ? 'Cargando...' : `Todas las agencias${transportAgencies.length > 0 ? ` (${transportAgencies.length})` : ''}`}
                    </option>
                    {transportAgencies.map(agency => (
                      <option key={agency.id} value={agency.id}>
                        {agency.name}
                      </option>
                    ))}
                    {!loadingAgencies && transportAgencies.length === 0 && (
                      <option value="" disabled>No hay agencias disponibles</option>
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <i className="fas fa-chevron-down text-gray-400 dark:text-gray-500 text-xs"></i>
                  </div>
                </div>
              </div>

              {/* Fecha Desde */}
              <FormField
                label="Fecha Desde"
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />

              {/* Fecha Hasta */}
              <FormField
                label="Fecha Hasta"
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />

              {/* Búsqueda */}
              <FormField
                label="Búsqueda General"
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Guía, nombre..."
              />
            </div>
          )}

          {filterMode === 'current' && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <i className="fas fa-info-circle mr-2"></i>
                Se utilizarán los filtros aplicados actualmente en la lista de paquetes.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Botón de Vista Previa (Centrado y Prominente) */}
      <div className="flex justify-center">
        <Button
          variant="secondary"
          onClick={handleSearchPreview}
          disabled={loadingPreview}
          className="min-w-[280px] shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          {loadingPreview ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Buscando...
            </>
          ) : (
            <>
              <i className="fas fa-search mr-2"></i>
              Vista Previa de Datos
            </>
          )}
        </Button>
      </div>

      {/* Sección de Vista Previa */}
      {showPreview && (
        <div ref={previewRef} className="animate-fade-in">
          <Card className="border-l-4 border-indigo-400 shadow-md">
            <div className="p-4">
              {/* Header con controles */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <i className="fas fa-eye text-indigo-500"></i>
                    Vista Previa
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{previewTotal}</span> paquetes encontrados
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2 items-center">
                  {/* Toggle para mostrar todas las columnas */}
                  <label className="flex items-center gap-2 text-xs bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={showAllColumns}
                      onChange={(e) => setShowAllColumns(e.target.checked)}
                      className="w-3.5 h-3.5 text-indigo-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Todas las columnas</span>
                  </label>
                  
                  {/* Selector de tamaño de página */}
                  <select
                    value={previewPageSize}
                    onChange={(e) => {
                      setPreviewPageSize(Number(e.target.value))
                      setPreviewPage(1)
                    }}
                    className="text-xs px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Cerrar vista previa"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
              
              {/* Tabla de vista previa */}
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                    <tr>
                      {(showAllColumns 
                        ? Object.keys(AVAILABLE_FIELDS) 
                        : selectedColumns.length > 0 ? selectedColumns : ['guide_number', 'name', 'city', 'status']
                      ).map(fieldId => (
                        <th key={fieldId} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          {AVAILABLE_FIELDS[fieldId]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {previewData.length === 0 ? (
                      <tr>
                        <td colSpan={showAllColumns ? Object.keys(AVAILABLE_FIELDS).length : selectedColumns.length} className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                          <i className="fas fa-inbox text-3xl mb-2 opacity-50"></i>
                          <p>No se encontraron paquetes con los filtros aplicados</p>
                        </td>
                      </tr>
                    ) : (
                      previewData.map((pkg, idx) => (
                        <tr key={pkg.id} className={`${idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'} hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors`}>
                          {(showAllColumns 
                            ? Object.keys(AVAILABLE_FIELDS) 
                            : selectedColumns.length > 0 ? selectedColumns : ['guide_number', 'name', 'city', 'status']
                          ).map(fieldId => (
                            <td key={fieldId} className="px-3 py-2 text-xs text-gray-900 dark:text-white whitespace-nowrap">
                              {getFieldValue(pkg, fieldId)}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Controles de paginación */}
              {previewTotal > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Mostrando <span className="font-semibold">{(previewPage - 1) * previewPageSize + 1}</span> a{' '}
                    <span className="font-semibold">{Math.min(previewPage * previewPageSize, previewTotal)}</span> de{' '}
                    <span className="font-semibold">{previewTotal}</span>
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setPreviewPage(prev => prev - 1)
                        setTimeout(() => handleSearchPreview(), 0)
                      }}
                      disabled={previewPage === 1}
                      className="text-xs"
                    >
                      <i className="fas fa-chevron-left mr-1"></i>
                      Anterior
                    </Button>
                    
                    <span className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      Página <span className="font-bold">{previewPage}</span> de <span className="font-bold">{Math.ceil(previewTotal / previewPageSize)}</span>
                    </span>
                    
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setPreviewPage(prev => prev + 1)
                        setTimeout(() => handleSearchPreview(), 0)
                      }}
                      disabled={previewPage >= Math.ceil(previewTotal / previewPageSize)}
                      className="text-xs"
                    >
                      Siguiente
                      <i className="fas fa-chevron-right ml-1"></i>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Sección 2: Configuración de Columnas */}
      <Card className="border-l-4 border-green-400 shadow-sm hover:shadow-md transition-shadow">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <i className="fas fa-columns text-green-500"></i>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                2. Selección y Orden de Columnas
              </h2>
            </div>
            {selectedColumns.length > 0 && (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-semibold rounded-full">
                {selectedColumns.length} {selectedColumns.length === 1 ? 'columna' : 'columnas'}
              </span>
            )}
          </div>
          
          {format === 'pdf' && selectedColumns.length > 6 && (
            <div className="mb-3 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="text-xs text-orange-800 dark:text-orange-200 flex items-center gap-2">
                <i className="fas fa-exclamation-triangle"></i>
                Recomendación: Para PDF, usa máximo 6 columnas para mejor visualización
              </p>
            </div>
          )}
          
          <ColumnSelectorDragDrop
            availableFields={AVAILABLE_FIELDS}
            selectedColumns={selectedColumns}
            onChange={setSelectedColumns}
          />

          <div className="mt-3">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={saveAsPreference}
                onChange={(e) => setSaveAsPreference(e.target.checked)}
                className="w-4 h-4 text-green-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                Guardar esta configuración como mi preferencia
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* Sección 3: Formato y Alcance (Combinados y Compactos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Formato de Salida */}
        <Card className="border-l-4 border-orange-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <i className="fas fa-file text-orange-500"></i>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                3. Formato
              </h2>
            </div>
            
            <div className="flex gap-3">
              <label className={`flex-1 flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${format === 'excel' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'}`}>
                <input
                  type="radio"
                  value="excel"
                  checked={format === 'excel'}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-4 h-4 text-green-600"
                />
                <i className="fas fa-file-excel text-2xl text-green-600"></i>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">
                    Excel
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    .xlsx
                  </span>
                </div>
              </label>

              <label className={`flex-1 flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${format === 'pdf' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700'}`}>
                <input
                  type="radio"
                  value="pdf"
                  checked={format === 'pdf'}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-4 h-4 text-red-600"
                />
                <i className="fas fa-file-pdf text-2xl text-red-600"></i>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">
                    PDF
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    .pdf
                  </span>
                </div>
              </label>
            </div>
          </div>
        </Card>

        {/* Alcance de Exportación */}
        <Card className="border-l-4 border-purple-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <i className="fas fa-layer-group text-purple-500"></i>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                4. Alcance
              </h2>
            </div>
            
            <div className="space-y-2">
              <label className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-all ${scope === 'all' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'}`}>
                <input
                  type="radio"
                  value="all"
                  checked={scope === 'all'}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-4 h-4 text-purple-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">
                    Todos los filtrados
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Sin límite de paginación
                  </span>
                </div>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 text-xs font-bold rounded">
                  {estimatedCount}
                </span>
              </label>

              <label className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg opacity-50 cursor-not-allowed">
                <input
                  type="radio"
                  value="page"
                  checked={scope === 'page'}
                  disabled
                  className="w-4 h-4 text-purple-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">
                    Página actual
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Solo desde lista
                  </span>
                </div>
              </label>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer con botón de exportar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <i className="fas fa-info-circle text-blue-500"></i>
          <span>El archivo se descargará automáticamente cuando esté listo</span>
        </div>
        
        <Button
          variant="primary"
          onClick={handleExport}
          disabled={loading || selectedColumns.length === 0}
          className="w-auto px-6 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Exportando...
            </>
          ) : (
            <>
              <i className="fas fa-download mr-2"></i>
              Exportar {format.toUpperCase()}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default PackageExport
