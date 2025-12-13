import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import batchesService from '../../services/batchesService'
import pullsService from '../../services/pullsService'
import { Card, Button, LoadingSpinner, Badge } from '../../components'

// Opciones de estado de paquetes
const PACKAGE_STATUS_OPTIONS = [
  { value: 'NO_RECEPTADO', label: 'No Receptado', color: 'gray' },
  { value: 'EN_BODEGA', label: 'En Bodega', color: 'blue' },
  { value: 'EN_TRANSITO', label: 'En Tránsito', color: 'yellow' },
  { value: 'ENTREGADO', label: 'Entregado', color: 'green' },
  { value: 'DEVUELTO', label: 'Devuelto', color: 'orange' },
  { value: 'RETENIDO', label: 'Retenido', color: 'red' },
]

const BatchDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [batch, setBatch] = useState(null)
  const [packagesSummary, setPackagesSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info') // 'info', 'pulls', 'packages'
  const [selectedPull, setSelectedPull] = useState(null)
  const [changingStatus, setChangingStatus] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  
  // Estado para gestionar paquetes de sacas
  const [expandedPulls, setExpandedPulls] = useState({}) // { pullId: true/false }
  const [pullPackages, setPullPackages] = useState({}) // { pullId: [packages] }
  const [loadingPackages, setLoadingPackages] = useState({}) // { pullId: true/false }

  useEffect(() => {
    loadBatch()
    loadPackagesSummary()
  }, [id])

  const loadBatch = async () => {
    try {
      setLoading(true)
      const data = await batchesService.get(id)
      setBatch(data)
    } catch (error) {
      console.error('Error al cargar lote:', error)
      toast.error('Error al cargar el lote')
      navigate('/logistica/batches')
    } finally {
      setLoading(false)
    }
  }

  const loadPackagesSummary = async () => {
    try {
      const data = await batchesService.getPackagesSummary(id)
      setPackagesSummary(data)
    } catch (error) {
      console.error('Error al cargar resumen:', error)
    }
  }

  const handleRemovePull = async (pullId) => {
    if (!window.confirm('¿Está seguro de quitar esta saca del lote?')) return

    try {
      await batchesService.removePull(id, pullId)
      toast.success('Saca quitada del lote')
      loadBatch()
      loadPackagesSummary()
    } catch (error) {
      console.error('Error al quitar saca:', error)
      toast.error('Error al quitar la saca del lote')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`¿Está seguro de eliminar este lote?\n\nEsto también eliminará todas las sacas asociadas.`)) return

    try {
      await batchesService.delete(id)
      toast.success('Lote eliminado correctamente')
      navigate('/logistica/batches')
    } catch (error) {
      console.error('Error al eliminar lote:', error)
      toast.error('Error al eliminar el lote')
    }
  }

  const handleDownloadManifestPDF = async () => {
    try {
      toast.info('Generando manifiesto PDF...')
      await batchesService.generateManifestPDF(id)
      toast.success('Manifiesto PDF descargado')
    } catch (error) {
      console.error('Error al descargar manifiesto PDF:', error)
      toast.error('Error al generar el manifiesto PDF')
    }
  }

  const handleDownloadManifestExcel = async () => {
    try {
      toast.info('Generando manifiesto Excel...')
      await batchesService.generateManifestExcel(id)
      toast.success('Manifiesto Excel descargado')
    } catch (error) {
      console.error('Error al descargar manifiesto Excel:', error)
      toast.error('Error al generar el manifiesto Excel')
    }
  }

  const handleExportExcelCustomFormat = async () => {
    try {
      toast.info('Generando Excel con formato personalizado...')
      await batchesService.exportExcelCustomFormat(id)
      toast.success('Excel descargado correctamente')
    } catch (error) {
      console.error('Error al exportar Excel:', error)
      toast.error('Error al generar el Excel')
    }
  }

  const handleDownloadLabels = async () => {
    try {
      toast.info('Generando etiquetas de sacas...')
      await batchesService.generateLabels(id)
      toast.success('Etiquetas descargadas')
    } catch (error) {
      console.error('Error al descargar etiquetas:', error)
      toast.error('Error al generar las etiquetas')
    }
  }

  const handleGenerateNotificationMessage = async () => {
    try {
      const data = await batchesService.generateNotificationMessage(id)
      
      // Copiar mensaje al portapapeles
      await navigator.clipboard.writeText(data.message)
      toast.success('Mensaje de notificación copiado al portapapeles')
      
      // Mostrar el mensaje en un modal o alerta
      const messageWithDetails = `${data.message}\n\nDetalles:\n- Agencia: ${data.agency_name}\n- Número de guía: ${data.guide_number}\n- Total de paquetes: ${data.total_packages}`
      alert(messageWithDetails)
    } catch (error) {
      console.error('Error al generar mensaje:', error)
      toast.error(error.response?.data?.error || 'Error al generar el mensaje de notificación')
    }
  }

  const handleChangePackagesStatus = async () => {
    if (!selectedStatus) {
      toast.error('Seleccione un estado')
      return
    }

    try {
      setChangingStatus(true)
      const result = await batchesService.changePackagesStatus(id, selectedStatus)
      
      const statusLabel = PACKAGE_STATUS_OPTIONS.find(s => s.value === selectedStatus)?.label || selectedStatus
      toast.success(
        `${result.updated_count} paquete(s) actualizado(s) a "${statusLabel}"` +
        (result.already_in_status > 0 ? ` (${result.already_in_status} ya estaban en ese estado)` : '') +
        ` en ${result.pulls_affected} saca(s)`
      )
      
      // Recargar datos
      await loadBatch()
      await loadPackagesSummary()
      setSelectedStatus('')
      // Limpiar paquetes cargados para forzar recarga
      setPullPackages({})
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      toast.error(error.response?.data?.error || 'Error al cambiar el estado de los paquetes')
    } finally {
      setChangingStatus(false)
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

  const loadPullPackages = async (pullId) => {
    try {
      setLoadingPackages(prev => ({ ...prev, [pullId]: true }))
      const pullData = await pullsService.get(pullId)
      setPullPackages(prev => ({ ...prev, [pullId]: pullData.packages || [] }))
    } catch (error) {
      console.error('Error cargando paquetes de la saca:', error)
      toast.error('Error al cargar los paquetes de la saca')
    } finally {
      setLoadingPackages(prev => ({ ...prev, [pullId]: false }))
    }
  }

  const togglePullExpanded = async (pullId) => {
    const isExpanded = expandedPulls[pullId]
    setExpandedPulls(prev => ({ ...prev, [pullId]: !isExpanded }))
    
    // Cargar paquetes si se está expandiendo y no están cargados
    if (!isExpanded && !pullPackages[pullId]) {
      await loadPullPackages(pullId)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Cargando lote..." />
  }

  if (!batch) {
    return <div className="text-red-500">Lote no encontrado</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-layer-group text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {batch.destiny}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                ID: {String(batch.id).slice(0, 8)}... {batch.guide_number && `• ${batch.guide_number}`} • {new Date(batch.created_at).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/logistica/batches')}
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Volver
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate(`/logistica/batches/${id}/editar`)}
              className="w-auto px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              <i className="fas fa-edit mr-2"></i>
              Editar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
            >
              <i className="fas fa-trash mr-2"></i>
              Eliminar
            </Button>
          </div>
        </div>
      </div>

      {/* Documentos y Etiquetas */}
      <Card className="border-l-4 border-green-400">
        <div className="p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <i className="fas fa-file-download text-green-500 mr-2"></i>
            Documentos y Etiquetas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Button
              variant="success"
              onClick={handleDownloadManifestPDF}
              className="w-full"
            >
              <i className="fas fa-file-pdf mr-2"></i>
              Manifiesto PDF
            </Button>
            <Button
              variant="success"
              onClick={handleDownloadManifestExcel}
              className="w-full"
            >
              <i className="fas fa-file-excel mr-2"></i>
              Manifiesto Excel
            </Button>
            <Button
              variant="info"
              onClick={handleDownloadLabels}
              className="w-full"
            >
              <i className="fas fa-tags mr-2"></i>
              Etiquetas de Sacas
            </Button>
            <Button
              variant="primary"
              onClick={handleGenerateNotificationMessage}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <i className="fas fa-envelope mr-2"></i>
              Mensaje de Envío
            </Button>
          </div>
          <div className="mt-3">
            <Button
              variant="success"
              onClick={handleExportExcelCustomFormat}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <i className="fas fa-file-excel mr-2"></i>
              Exportar Excel (Formato Transportadora)
            </Button>
          </div>
        </div>
      </Card>

      {/* Cambio de Estado Masivo */}
      {(batch.total_packages > 0 || batch.pulls_count > 0) && (
        <Card className="border-l-4 border-amber-400">
          <div className="p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <i className="fas fa-exchange-alt text-amber-500 mr-2"></i>
              Cambiar Estado de Paquetes
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Cambia el estado de <strong>todos los {batch.total_packages || 0} paquetes</strong> en las {batch.pulls_count || 0} saca(s) de este lote de una sola vez.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                           transition-colors"
                disabled={changingStatus}
              >
                <option value="">Seleccionar nuevo estado...</option>
                {PACKAGE_STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <Button
                variant="primary"
                onClick={handleChangePackagesStatus}
                disabled={!selectedStatus || changingStatus}
                className="w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                {changingStatus ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Actualizando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sync-alt mr-2"></i>
                    Cambiar Estado
                  </>
                )}
              </Button>
            </div>

            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <i className="fas fa-info-circle mr-1"></i>
                Esta acción actualizará el estado de todos los paquetes en todas las sacas del lote y quedará registrada en el historial de cada paquete.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <div className="p-5 text-center">
            <i className="fas fa-boxes text-4xl text-purple-600 dark:text-purple-400 mb-2"></i>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {batch.pulls_count || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Sacas</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <div className="p-5 text-center">
            <i className="fas fa-box text-4xl text-blue-600 dark:text-blue-400 mb-2"></i>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {batch.total_packages || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Paquetes</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <div className="p-5 text-center">
            <i className="fas fa-truck text-4xl text-green-600 dark:text-green-400 mb-2"></i>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {batch.transport_agency_info?.name || 'Sin agencia'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Agencia</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <div className="p-5 text-center">
            <i className="fas fa-map-marker-alt text-4xl text-orange-600 dark:text-orange-400 mb-2"></i>
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {batch.destiny}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Destino</div>
          </div>
        </Card>
      </div>

      {/* Tabs de Contenido */}
      <div>
        {/* Navegación de Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'info'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <i className="fas fa-info-circle mr-2"></i>
            Información
          </button>
          <button
            onClick={() => setActiveTab('pulls')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'pulls'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <i className="fas fa-boxes mr-2"></i>
            Sacas ({batch.pulls_count || 0})
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'packages'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <i className="fas fa-chart-pie mr-2"></i>
            Estadísticas
          </button>
        </div>

        {/* Contenido de Tabs */}
        {activeTab === 'info' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Información del Lote
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Destino
                  </label>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <i className="fas fa-map-marker-alt text-orange-500"></i>
                    <span className="font-semibold">{batch.destiny}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Número de Guía
                  </label>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <i className="fas fa-barcode text-orange-500"></i>
                    <span className="font-mono">{batch.guide_number || 'No especificado'}</span>
                  </div>
                </div>

                {batch.transport_agency_info && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Agencia de Transporte
                      </label>
                      <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <i className="fas fa-truck text-orange-500"></i>
                        <span>{batch.transport_agency_info.name}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Teléfono Agencia
                      </label>
                      <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <i className="fas fa-phone text-orange-500"></i>
                        <span>{batch.transport_agency_info.phone_number || 'No especificado'}</span>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Fecha de Creación
                  </label>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <i className="fas fa-calendar text-orange-500"></i>
                    <span>{new Date(batch.created_at).toLocaleString('es-ES')}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Última Actualización
                  </label>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <i className="fas fa-clock text-orange-500"></i>
                    <span>{new Date(batch.updated_at).toLocaleString('es-ES')}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'pulls' && (
          <div className="space-y-4">
            {batch.pulls_list && batch.pulls_list.length > 0 ? (
              batch.pulls_list.map((pull) => (
                <Card
                  key={pull.id}
                  className="hover:shadow-md transition-shadow border-l-4 border-purple-400"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <i className="fas fa-box text-purple-500 text-xl"></i>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {pull.common_destiny}
                          </h4>
                          <Badge variant="info">
                            {pull.size || 'MEDIANO'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <i className="fas fa-barcode mr-2"></i>
                            {pull.guide_number || 'Sin guía'}
                          </div>
                          <div>
                            <i className="fas fa-boxes mr-2"></i>
                            {pull.packages_count || 0} paquetes
                          </div>
                          <div>
                            <i className="fas fa-calendar mr-2"></i>
                            {new Date(pull.created_at).toLocaleDateString('es-ES')}
                          </div>
                          <div>
                            <span className="text-xs">ID: {String(pull.id).slice(0, 8)}...</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePullExpanded(pull.id)}
                        >
                          <i className={`fas ${expandedPulls[pull.id] ? 'fa-chevron-up' : 'fa-chevron-down'} mr-1`}></i>
                          {expandedPulls[pull.id] ? 'Ocultar' : 'Ver'} Paquetes
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/logistica/pulls/${pull.id}`)}
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemovePull(pull.id)}
                        >
                          <i className="fas fa-minus"></i>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Lista de paquetes expandida */}
                    {expandedPulls[pull.id] && (
                      <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                        {loadingPackages[pull.id] ? (
                          <div className="text-center py-4">
                            <LoadingSpinner size="sm" />
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Cargando paquetes...</p>
                          </div>
                        ) : pullPackages[pull.id] && pullPackages[pull.id].length > 0 ? (
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                              <i className="fas fa-boxes mr-2 text-purple-500"></i>
                              Paquetes ({pullPackages[pull.id].length})
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                              {pullPackages[pull.id].map((pkg) => (
                                <div key={pkg.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                                        <i className="fas fa-barcode mr-2 text-purple-500"></i>
                                        {pkg.guide_number || pkg.id?.substring(0, 8)}
                                      </div>
                                      {pkg.name && (
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                          <i className="fas fa-user mr-1"></i>
                                          {pkg.name}
                                        </div>
                                      )}
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        {pkg.city && (
                                          <span className="text-xs text-gray-500 dark:text-gray-400">
                                            <i className="fas fa-map-marker-alt mr-1"></i>
                                            {pkg.city}
                                          </span>
                                        )}
                                        {pkg.status && (
                                          <Badge variant={getStatusBadgeVariant(pkg.status)} size="sm">
                                            {pkg.status_display || pkg.status}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                            <i className="fas fa-box-open text-2xl mb-2 opacity-50"></i>
                            <p className="text-sm">No hay paquetes en esta saca</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <Card>
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <i className="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                  <p>No hay sacas en este lote</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'packages' && packagesSummary && (
          <div className="space-y-4">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Resumen de Paquetes por Estado
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(packagesSummary.status_summary || {}).map(([code, data]) => (
                    <div key={code} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {data.count}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {data.name}
                      </div>
                      <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-orange-500 h-1.5 rounded-full"
                          style={{
                            width: `${(data.count / packagesSummary.total_packages) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <div className="p-5 text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {packagesSummary.total_packages}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Paquetes</div>
                </div>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                <div className="p-5 text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {packagesSummary.total_pulls}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Sacas</div>
                </div>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                <div className="p-5 text-center">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {packagesSummary.total_packages > 0 
                      ? Math.round(packagesSummary.total_packages / packagesSummary.total_pulls)
                      : 0
                    }
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Paq/Saca Promedio</div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BatchDetail
