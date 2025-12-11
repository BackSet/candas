import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import packagesService from '../../services/packagesService'
import { 
  LoadingSpinner, 
  ConfirmDialog, 
  Button, 
  Badge, 
  Card 
} from '../../components'
import { 
  PackageList, 
  PackageChildrenManager, 
  PackageCodeMigration 
} from '../../components/domain/packages'
import { QRCodeDisplay, StatCard } from '../../components/domain/common'

const PackagesDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [packageData, setPackageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [childrenPackages, setChildrenPackages] = useState([])
  const [loadingChildren, setLoadingChildren] = useState(false)
  const [statistics, setStatistics] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [showFullHistory, setShowFullHistory] = useState(false)
  const [showChildrenManager, setShowChildrenManager] = useState(false)
  const [showMigrationModal, setShowMigrationModal] = useState(false)

  useEffect(() => {
    loadPackage()
    loadChildrenPackages()
    loadStatistics()
  }, [id])

  const loadPackage = async () => {
    try {
      setLoading(true)
      const data = await packagesService.get(id)
      setPackageData(data)
    } catch (error) {
      toast.error('Error al cargar el paquete')
      console.error(error)
      navigate('/paquetes')
    } finally {
      setLoading(false)
    }
  }

  const loadChildrenPackages = async () => {
    try {
      setLoadingChildren(true)
      const data = await packagesService.list({ parent: id, page_size: 100 })
      setChildrenPackages(data.results || data || [])
    } catch (error) {
      console.error('Error cargando paquetes hijos:', error)
    } finally {
      setLoadingChildren(false)
    }
  }

  const handleChildrenManagerSuccess = () => {
    loadChildrenPackages()
    loadPackage()
  }

  const loadStatistics = async () => {
    try {
      setLoadingStats(true)
      // Cargar estadísticas básicas del sistema
      const stats = await packagesService.getStatistics()
      setStatistics(stats)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await packagesService.delete(id)
      toast.success('Paquete eliminado correctamente')
      navigate('/paquetes')
    } catch (error) {
      toast.error('Error al eliminar el paquete')
      console.error(error)
      setShowDeleteDialog(false)
    } finally {
      setDeleting(false)
    }
  }

  const handleGenerateManifestPDF = async () => {
    try {
      toast.info('Generando manifiesto PDF...')
      await packagesService.generateManifestPDF(id)
      toast.success('Manifiesto PDF generado')
    } catch (error) {
      toast.error('Error al generar manifiesto PDF')
      console.error(error)
    }
  }

  const handleGenerateManifestExcel = async () => {
    try {
      toast.info('Generando manifiesto Excel...')
      await packagesService.generateManifestExcel(id)
      toast.success('Manifiesto Excel generado')
    } catch (error) {
      toast.error('Error al generar manifiesto Excel')
      console.error(error)
    }
  }

  const handleGenerateLabel = async () => {
    try {
      toast.info('Generando etiqueta...')
      await packagesService.generateLabel(id)
      toast.success('Etiqueta generada')
    } catch (error) {
      toast.error('Error al generar etiqueta')
      console.error(error)
    }
  }

  const handleGenerateShippingLabel = async () => {
    try {
      toast.info('Generando etiqueta de envío...')
      await packagesService.generateShippingLabel(id)
      toast.success('Etiqueta de envío generada')
    } catch (error) {
      toast.error('Error al generar etiqueta de envío')
      console.error(error)
    }
  }

  const getStatusBadgeVariant = (status) => {
    const statusVariants = {
      NO_RECEPTADO: 'default',
      EN_BODEGA: 'info',
      EN_TRANSITO: 'warning',
      ENTREGADO: 'success',
      DEVUELTO: 'danger',
      RETENIDO: 'dark',
    }
    return statusVariants[status] || 'default'
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTimestamp = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return <LoadingSpinner message="Cargando detalles del paquete..." />
  }

  if (!packageData) {
    return null
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-box text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Detalle del Paquete
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {packageData.guide_number} - {packageData.name}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => navigate(`/paquetes/editar/${id}`)}
              className="w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <i className="fas fa-edit mr-2"></i>
              Editar
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteDialog(true)}
            >
              <i className="fas fa-trash mr-2"></i>
              Eliminar
            </Button>
          </div>
        </div>
      </div>

      {/* Breadcrumb de Jerarquía */}
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-700">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <i className="fas fa-sitemap text-orange-500"></i>
            <span>Jerarquía:</span>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {packageData.batch_info && (
              <>
                <Link
                  to={`/logistica/batches/${packageData.batch_info.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
                >
                  <i className="fas fa-layer-group"></i>
                  <span>Lote: {packageData.batch_info.destiny}</span>
                </Link>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </>
            )}
            
            {packageData.pull_info && (
              <>
                <Link
                  to={`/logistica/pulls/${packageData.pull}`}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
                >
                  <i className="fas fa-boxes"></i>
                  <span>Saca: {packageData.pull_info.common_destiny}</span>
                </Link>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </>
            )}

            {packageData.parent_info && (
              <>
                <Link
                  to={`/paquetes/${packageData.parent_info.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
                >
                  <i className="fas fa-box"></i>
                  <span>Padre: {packageData.parent_info.guide_number}</span>
                </Link>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </>
            )}
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg shadow-md text-sm font-medium">
              <i className="fas fa-box"></i>
              <span>Paquete: {packageData.guide_number}</span>
            </div>

            {childrenPackages.length > 0 && (
              <>
                <i className="fas fa-chevron-right text-gray-400"></i>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">
                  <i className="fas fa-boxes"></i>
                  <span>{childrenPackages.length} Hijo{childrenPackages.length !== 1 ? 's' : ''}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Grid 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información General */}
          <Card 
            header={
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-info-circle text-white text-sm"></i>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Información General
                </h2>
              </div>
            }
            className="border-blue-200 dark:border-blue-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Número de Guía
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white font-mono">
                  {packageData.guide_number}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Número Master
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white font-mono">
                  {packageData.nro_master || '-'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Guía de Agencia
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white font-mono">
                  {packageData.agency_guide_number || '-'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Estado Actual
                </label>
                <Badge variant={getStatusBadgeVariant(packageData.status)} size="lg">
                  {packageData.status_display}
                </Badge>
              </div>

              {packageData.hashtags && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Etiquetas
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {packageData.hashtags.split(' ').filter(tag => tag.trim()).map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Destinatario */}
          <Card 
            header={
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-user text-white text-sm"></i>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Información del Destinatario
                </h2>
              </div>
            }
            className="border-green-200 dark:border-green-700"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Nombre Completo
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {packageData.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Dirección
                </label>
                <p className="text-gray-900 dark:text-white">
                  {packageData.address}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Ciudad
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {packageData.city}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Provincia
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {packageData.province}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Teléfono
                </label>
                <p className="text-gray-900 dark:text-white font-mono">
                  {packageData.phone_number}
                </p>
              </div>
            </div>
          </Card>

          {/* Timeline de Estados */}
          <Card 
            header={
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-history text-white text-sm"></i>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Estado y Timeline
                </h2>
              </div>
            }
            className="border-purple-200 dark:border-purple-700"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-box-check text-white text-lg"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Estado Actual</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {packageData.status_display}
                  </p>
                </div>
                <Badge variant={getStatusBadgeVariant(packageData.status)} size="lg">
                  {packageData.status}
                </Badge>
              </div>

              {packageData.status_history && (
                <div className="border-l-2 border-purple-300 dark:border-purple-600 pl-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Historial de Estados
                  </h3>
                  <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans">
                    {packageData.status_history}
                  </pre>
                </div>
              )}
            </div>
          </Card>

          {/* Información de Envío */}
          <Card 
            header={
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-shipping-fast text-white text-sm"></i>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Información de Envío
                </h2>
              </div>
            }
            className="border-cyan-200 dark:border-cyan-700"
          >
            <div className="space-y-4">
              <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-700">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Destino Efectivo
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {packageData.effective_destiny || `${packageData.city}, ${packageData.province}`}
                </p>
                {packageData.data_source && packageData.data_source.destiny_source !== 'package' && (
                  <p className="text-xs text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                    <i className="fas fa-arrow-down"></i>
                    Heredado de {packageData.data_source.destiny_source === 'batch' ? 'Lote' : 'Saca'}
                  </p>
                )}
              </div>

              <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-700">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Agencia Efectiva
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {packageData.effective_transport_agency?.name || 'Sin asignar'}
                </p>
                {packageData.data_source && packageData.data_source.agency_source !== 'package' && (
                  <p className="text-xs text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                    <i className="fas fa-arrow-down"></i>
                    Heredado de {packageData.data_source.agency_source === 'batch' ? 'Lote' : 'Saca'}
                  </p>
                )}
              </div>

              <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-700">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Guía de Transporte Efectiva
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white font-mono mb-1">
                  {packageData.effective_guide_number || 'Sin guía'}
                </p>
                {packageData.data_source && packageData.data_source.guide_source !== 'package' && (
                  <p className="text-xs text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                    <i className="fas fa-arrow-down"></i>
                    Heredado de {packageData.data_source.guide_source === 'batch' ? 'Lote' : 'Saca'}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Sección Clementina - Gestión de Hijos */}
          <Card 
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <i className="fas fa-sitemap text-white text-sm"></i>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Clementina
                  </h2>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowChildrenManager(true)}
                >
                  <i className="fas fa-cog mr-2"></i>
                  Gestionar Hijos
                </Button>
              </div>
            }
            className="border-indigo-200 dark:border-indigo-700"
          >
            <div className="space-y-4">
              {/* Información de jerarquía */}
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
                <div className="space-y-3">
                  {/* Estado de jerarquía */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Estado de Jerarquía</span>
                    <div className="flex items-center gap-2">
                      {packageData?.is_parent && (
                        <Badge variant="info" className="text-xs">
                          <i className="fas fa-boxes mr-1"></i>
                          Padre
                        </Badge>
                      )}
                      {packageData?.is_child && (
                        <Badge variant="warning" className="text-xs">
                          <i className="fas fa-box mr-1"></i>
                          Hijo
                        </Badge>
                      )}
                      {packageData?.has_hierarchy && packageData?.hierarchy_level !== undefined && packageData.hierarchy_level > 0 && (
                        <Badge variant="default" className="text-xs">
                          Nivel {packageData.hierarchy_level}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Información del padre */}
                  {packageData?.parent_info && (
                    <div className="pt-2 border-t border-indigo-200 dark:border-indigo-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Paquete Padre</p>
                      <Link
                        to={`/paquetes/${packageData.parent_info.id}`}
                        className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <i className="fas fa-arrow-up mr-1"></i>
                        {packageData.parent_info.guide_number}
                      </Link>
                    </div>
                  )}
                  
                  {/* Información del paquete raíz */}
                  {packageData?.root_parent_info && packageData.root_parent_info.id !== packageData.id && (
                    <div className="pt-2 border-t border-indigo-200 dark:border-indigo-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Paquete Raíz</p>
                      <Link
                        to={`/paquetes/${packageData.root_parent_info.id}`}
                        className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <i className="fas fa-sitemap mr-1"></i>
                        {packageData.root_parent_info.guide_number}
                      </Link>
                    </div>
                  )}
                  
                  {/* Contador de hijos */}
                  <div className="pt-2 border-t border-indigo-200 dark:border-indigo-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Paquetes Hijos</span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {packageData?.children_count || childrenPackages.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Vista previa de hijos */}
              {childrenPackages.length > 0 && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
                  <PackageList
                    packages={childrenPackages.slice(0, 3)}
                    title=""
                    showConfig={false}
                    showRemove={false}
                    showStatus={true}
                    maxHeight="200px"
                    stacked={true}
                    emptyMessage=""
                  />
                  {childrenPackages.length > 3 && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 text-center">
                      Y {childrenPackages.length - 3} más...
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChildrenManager(true)}
                  className="flex-1"
                >
                  <i className="fas fa-list mr-2"></i>
                  Ver Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowChildrenManager(true)
                    // El modal manejará la pestaña activa
                  }}
                  className="flex-1"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Agregar
                </Button>
              </div>
            </div>
          </Card>

          {/* Paquetes Hijos */}
          {(childrenPackages.length > 0 || !loadingChildren) && (
            <Card 
              header={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <i className="fas fa-boxes text-white text-sm"></i>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Paquetes Hijos
                    </h2>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/paquetes/crear?parent=${id}`)}
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Agregar Hijo
                  </Button>
                </div>
              }
              className="border-indigo-200 dark:border-indigo-700"
            >
              {loadingChildren ? (
                <LoadingSpinner size="sm" message="Cargando paquetes hijos..." />
              ) : childrenPackages.length > 0 ? (
                <PackageList
                  packages={childrenPackages}
                  title=""
                  showConfig={false}
                  showRemove={false}
                  showStatus={true}
                  maxHeight="400px"
                  stacked={true}
                  emptyMessage="No hay paquetes hijos"
                />
              ) : (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <i className="fas fa-box-open text-4xl mb-2"></i>
                  <p>Este paquete no tiene paquetes hijos</p>
                </div>
              )}
            </Card>
          )}

          {/* Historial de Cambios */}
          {(packageData.status_history || packageData.guide_history) && (
            <Card 
              header={
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <i className="fas fa-clock-rotate-left text-white text-sm"></i>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Historial de Cambios
                  </h2>
                </div>
              }
              className="border-amber-200 dark:border-amber-700"
            >
              <div className="space-y-4">
                {packageData.status_history && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <i className="fas fa-exchange-alt text-purple-500"></i>
                      Cambios de Estado
                    </h3>
                    <div className={`overflow-hidden transition-all ${showFullHistory ? '' : 'max-h-40'}`}>
                      <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans">
                        {packageData.status_history}
                      </pre>
                    </div>
                    {packageData.status_history.length > 200 && (
                      <button
                        onClick={() => setShowFullHistory(!showFullHistory)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2"
                      >
                        {showFullHistory ? 'Ver menos' : 'Ver más'}
                      </button>
                    )}
                  </div>
                )}
                
                {packageData.guide_history && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <i className="fas fa-barcode text-cyan-500"></i>
                      Cambios de Guía
                    </h3>
                    <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans">
                      {packageData.guide_history}
                    </pre>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Notas */}
          {packageData.notes && (
            <Card 
              header={
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center">
                    <i className="fas fa-sticky-note text-white text-sm"></i>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Notas
                  </h2>
                </div>
              }
              className="border-yellow-200 dark:border-yellow-700"
            >
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {packageData.notes}
              </p>
            </Card>
          )}
        </div>

        {/* Columna Derecha (Sidebar) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Estadísticas */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <i className="fas fa-chart-line text-blue-500"></i>
              Estadísticas
            </h3>
            
            {packageData.pull_info && (
              <StatCard
                icon="fas fa-boxes"
                value={packageData.pull_info.package_count || '?'}
                label="Paquetes en Saca"
                color="purple"
                loading={loadingStats}
              />
            )}

            {packageData.batch_info && (
              <StatCard
                icon="fas fa-layer-group"
                value={packageData.batch_info.pull_count || '?'}
                label="Sacas en Lote"
                color="orange"
                loading={loadingStats}
              />
            )}

            <StatCard
              icon="fas fa-boxes"
              value={childrenPackages.length}
              label="Paquetes Hijos"
              color="indigo"
              loading={loadingChildren}
            />

            {statistics && (
              <StatCard
                icon="fas fa-map-marker-alt"
                value={statistics.by_city?.[packageData.city] || 0}
                label={`Total en ${packageData.city}`}
                color="green"
                loading={loadingStats}
              />
            )}
          </div>

          {/* Paquete Padre */}
          {packageData.parent_info && (
            <Card 
              header={
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <i className="fas fa-box text-indigo-500"></i>
                  Paquete Padre
                </h3>
              }
              className="border-indigo-200 dark:border-indigo-700"
            >
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Guía</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white font-mono">
                    {packageData.parent_info.guide_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Destinatario</p>
                  <p className="text-gray-900 dark:text-white">
                    {packageData.parent_info.name}
                  </p>
                </div>
                <Link
                  to={`/paquetes/${packageData.parent_info.id}`}
                  className="block w-full"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    <i className="fas fa-eye mr-2"></i>
                    Ver Paquete Padre
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Lote Asignado */}
          {packageData.batch_info && (
            <Card 
              header={
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <i className="fas fa-layer-group text-orange-500"></i>
                  Lote Asignado
                </h3>
              }
              className="border-orange-200 dark:border-orange-700"
            >
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Destino</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {packageData.batch_info.destiny}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Guía del Lote</p>
                  <p className="text-gray-900 dark:text-white font-mono">
                    {packageData.batch_info.guide_number || 'N/A'}
                  </p>
                </div>
                <Link
                  to={`/logistica/batches/${packageData.batch_info.id}`}
                  className="block w-full"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    <i className="fas fa-eye mr-2"></i>
                    Ver Lote
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Saca Asignada */}
          {packageData.pull_info && (
            <Card 
              header={
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <i className="fas fa-boxes text-purple-500"></i>
                  Saca Asignada
                </h3>
              }
              className="border-purple-200 dark:border-purple-700"
            >
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Destino Común</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {packageData.pull_info.common_destiny}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tamaño</p>
                  <Badge variant="warning">
                    {packageData.pull_info.size_display || packageData.pull_info.size}
                  </Badge>
                </div>
                <Link
                  to={`/logistica/pulls/${packageData.pull}`}
                  className="block w-full"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    <i className="fas fa-eye mr-2"></i>
                    Ver Saca
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Agencias */}
          {(packageData.transport_agency_info || packageData.delivery_agency_info) && (
            <>
              {packageData.transport_agency_info && (
                <Card 
                  header={
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <i className="fas fa-truck text-green-500"></i>
                      Agencia de Transporte
                    </h3>
                  }
                  className="border-green-200 dark:border-green-700"
                >
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {packageData.transport_agency_info.name}
                  </p>
                </Card>
              )}

              {packageData.delivery_agency_info && (
                <Card 
                  header={
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <i className="fas fa-people-carry text-blue-500"></i>
                      Agencia de Reparto
                    </h3>
                  }
                  className="border-blue-200 dark:border-blue-700"
                >
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {packageData.delivery_agency_info.name}
                  </p>
                  {packageData.delivery_agency_info.location && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {packageData.delivery_agency_info.location.city}
                    </p>
                  )}
                </Card>
              )}
            </>
          )}

          {/* Código QR */}
          <Card 
            header={
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <i className="fas fa-qrcode text-gray-500"></i>
                Código QR
              </h3>
            }
          >
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                  <i className="fas fa-qrcode text-4xl text-gray-400"></i>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Código QR del paquete
              </p>
            </div>
          </Card>

          {/* Documentos y Acciones */}
          <Card 
            header={
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <i className="fas fa-file-download text-red-500"></i>
                Documentos y Acciones
              </h3>
            }
            className="border-red-200 dark:border-red-700"
          >
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateManifestPDF}
                className="w-full"
              >
                <i className="fas fa-file-pdf mr-2 text-red-500"></i>
                Manifiesto PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateManifestExcel}
                className="w-full"
              >
                <i className="fas fa-file-excel mr-2 text-green-500"></i>
                Manifiesto Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateLabel}
                className="w-full"
              >
                <i className="fas fa-tag mr-2 text-blue-500"></i>
                Etiqueta
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateShippingLabel}
                className="w-full border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <i className="fas fa-barcode mr-2"></i>
                Etiqueta de Guía
              </Button>
              {childrenPackages.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMigrationModal(true)}
                  className="w-full border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                >
                  <i className="fas fa-exchange-alt mr-2"></i>
                  Cambiar Código
                </Button>
              )}
            </div>
          </Card>

          {/* Información del Sistema */}
          <Card 
            header={
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <i className="fas fa-info text-gray-500"></i>
                Sistema
              </h3>
            }
            className="border-gray-200 dark:border-gray-700"
          >
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">ID</p>
                <p className="text-gray-900 dark:text-white font-mono text-xs">
                  {id}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Creado</p>
                <p className="text-gray-900 dark:text-white">
                  {formatTimestamp(packageData.created_at)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Actualizado</p>
                <p className="text-gray-900 dark:text-white">
                  {formatTimestamp(packageData.updated_at)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Botón Volver */}
      <div className="flex justify-start">
        <Button
          variant="outline"
          onClick={() => navigate('/paquetes')}
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Volver a la Lista
        </Button>
      </div>

      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        show={showDeleteDialog}
        title="Eliminar Paquete"
        message={`¿Estás seguro de que deseas eliminar el paquete ${packageData?.guide_number}? Esta acción no se puede deshacer.`}
        confirmText={deleting ? 'Eliminando...' : 'Eliminar'}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        variant="danger"
      />

      {/* Modal de Gestión de Hijos */}
      {showChildrenManager && packageData && (
        <PackageChildrenManager
          parentPackage={packageData}
          onClose={() => {
            setShowChildrenManager(false)
            loadChildrenPackages() // Recargar hijos después de cerrar
          }}
          onSuccess={() => {
            loadChildrenPackages() // Recargar hijos después de operaciones
            loadPackage() // Recargar datos del paquete
          }}
        />
      )}

      {/* Modal de Migración de Código */}
      {showMigrationModal && packageData && (
        <PackageCodeMigration
          packageData={packageData}
          onClose={() => setShowMigrationModal(false)}
          onSuccess={(result) => {
            // El componente ya navega al nuevo paquete padre
            // Solo necesitamos cerrar el modal si no navega
            if (!result?.new_parent?.id) {
              setShowMigrationModal(false)
              loadPackage() // Recargar datos
            }
          }}
        />
      )}
    </div>
  )
}

export default PackagesDetail
