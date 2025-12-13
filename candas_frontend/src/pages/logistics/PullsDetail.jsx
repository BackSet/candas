import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import pullsService from '../../services/pullsService'
import { Card, Button, LoadingSpinner, Badge, QRCodeDisplay } from '../../components'
import { PackageList } from '../../components/domain/packages'
import { getEntityColor } from '../../utils/entityColors'

// Opciones de estado de paquetes
const PACKAGE_STATUS_OPTIONS = [
  { value: 'NO_RECEPTADO', label: 'No Receptado', color: 'gray' },
  { value: 'EN_BODEGA', label: 'En Bodega', color: 'blue' },
  { value: 'EN_TRANSITO', label: 'En Tránsito', color: 'yellow' },
  { value: 'ENTREGADO', label: 'Entregado', color: 'green' },
  { value: 'DEVUELTO', label: 'Devuelto', color: 'orange' },
  { value: 'RETENIDO', label: 'Retenido', color: 'red' },
]

const PullsDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pull, setPull] = useState(null)
  const [loading, setLoading] = useState(true)
  const [changingStatus, setChangingStatus] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')

  useEffect(() => {
    loadPull()
  }, [id])

  const loadPull = async () => {
    try {
      setLoading(true)
      const data = await pullsService.get(id)
      setPull(data)
    } catch (error) {
      toast.error('Error al cargar la saca')
      console.error(error)
      navigate('/logistica/pulls')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateManifest = async () => {
    try {
      toast.info('Generando manifiesto...')
      await pullsService.generateManifest(id)
      toast.success('Manifiesto generado correctamente')
    } catch (error) {
      toast.error('Error al generar manifiesto')
      console.error(error)
    }
  }

  const handleGenerateLabel = async () => {
    try {
      toast.info('Generando etiqueta...')
      await pullsService.generateLabel(id)
      toast.success('Etiqueta generada correctamente')
    } catch (error) {
      toast.error('Error al generar etiqueta')
      console.error(error)
    }
  }

  const handleChangePackagesStatus = async () => {
    if (!selectedStatus) {
      toast.error('Seleccione un estado')
      return
    }

    try {
      setChangingStatus(true)
      const result = await pullsService.changePackagesStatus(id, selectedStatus)
      
      const statusLabel = PACKAGE_STATUS_OPTIONS.find(s => s.value === selectedStatus)?.label || selectedStatus
      toast.success(
        `${result.updated_count} paquete(s) actualizado(s) a "${statusLabel}"` +
        (result.already_in_status > 0 ? ` (${result.already_in_status} ya estaban en ese estado)` : '')
      )
      
      // Recargar datos de la saca
      await loadPull()
      setSelectedStatus('')
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      toast.error(error.response?.data?.error || 'Error al cambiar el estado de los paquetes')
    } finally {
      setChangingStatus(false)
    }
  }

  const handleGenerateNotificationMessage = async () => {
    try {
      const data = await pullsService.generateNotificationMessage(id)
      
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

  const getSizeBadgeVariant = (size) => {
    switch (size) {
      case 'PEQUENO':
        return 'info'
      case 'MEDIANO':
        return 'warning'
      case 'GRANDE':
        return 'success'
      default:
        return 'default'
    }
  }

  if (loading) {
    return <LoadingSpinner message="Cargando detalles de la saca..." />
  }

  if (!pull) {
    return null
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 bg-accent-600 dark:bg-accent-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform`}>
              <i className="fas fa-boxes text-2xl text-white"></i>
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${getEntityColor('saca', 'text')}`}>
                Detalles de la Saca
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {pull.common_destiny} - ID: {pull.id?.substring(0, 13)}...
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => navigate(`/logistica/pulls/${id}/editar`)}
              className="w-auto px-6 py-3 bg-accent-600 dark:bg-accent-500 hover:bg-accent-700 dark:hover:bg-accent-600"
            >
              <i className="fas fa-edit mr-2"></i>
              Editar
            </Button>
          <Button
            variant="primary"
            onClick={handleGenerateManifest}
            icon={<i className="fas fa-file-pdf"></i>}
          >
            Generar Manifiesto
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerateLabel}
            icon={<i className="fas fa-tag"></i>}
          >
            Generar Etiqueta
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerateNotificationMessage}
            className="w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            icon={<i className="fas fa-envelope"></i>}
          >
            Mensaje de Envío
          </Button>
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Información General */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información General */}
          <Card header={
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              <i className="fas fa-info-circle mr-2"></i>
              Información General
            </h2>
          }>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Destino Común
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {pull.common_destiny}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Tamaño
                </label>
                <Badge variant={getSizeBadgeVariant(pull.size)}>
                  {pull.size_display || pull.size}
                </Badge>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Fecha de Creación
                </label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(pull.created_at).toLocaleString('es-ES')}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Lote
                </label>
                {pull.batch_info ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">
                      <i className={`fas fa-layer-group mr-1 ${getEntityColor('lote', 'icon')}`}></i>
                      {pull.batch_info.destiny}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">Sin lote</p>
                )}
              </div>
            </div>
          </Card>

          {/* Información de Envío - Mostrar jerarquía */}
          <Card header={
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              <i className="fas fa-shipping-fast mr-2"></i>
              Información de Envío
            </h2>
          }>
            <div className="space-y-4">
              {/* Destino Efectivo */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Destino Efectivo
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {pull.effective_destiny || pull.common_destiny}
                  </p>
                  {pull.data_source?.destiny_source === 'batch' && (
                    <Badge variant="primary" size="sm">
                      <i className={`fas fa-arrow-down mr-1 ${getEntityColor('lote', 'icon')}`}></i>
                      Heredado de Lote
                    </Badge>
                  )}
                </div>
              </div>

              {/* Agencia Efectiva */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Agencia de Transporte Efectiva
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-gray-900 dark:text-white">
                    {pull.effective_agency?.name || pull.transport_agency_info?.name || 'Sin asignar'}
                  </p>
                  {pull.data_source?.agency_source === 'batch' && (
                    <Badge variant="primary" size="sm">
                      <i className={`fas fa-arrow-down mr-1 ${getEntityColor('lote', 'icon')}`}></i>
                      Heredado de Lote
                    </Badge>
                  )}
                </div>
              </div>

              {/* Número de Guía Efectivo */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Número de Guía Efectivo
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-gray-900 dark:text-white font-mono">
                    {pull.effective_guide_number || pull.guide_number || 'Sin guía'}
                  </p>
                  {pull.data_source?.guide_source === 'batch' && (
                    <Badge variant="primary" size="sm">
                      <i className={`fas fa-arrow-down mr-1 ${getEntityColor('lote', 'icon')}`}></i>
                      Heredado de Lote
                    </Badge>
                  )}
                </div>
              </div>

              {/* Jerarquía visual si está en lote */}
              {pull.batch_info && (
                <div className={`mt-4 p-4 ${getEntityColor('lote', 'bg')} ${getEntityColor('lote', 'border')} border rounded-lg`}>
                  <p className={`text-sm font-semibold ${getEntityColor('lote', 'text')} mb-2`}>
                    <i className={`fas fa-sitemap mr-2 ${getEntityColor('lote', 'icon')}`}></i>
                    Jerarquía de Envío
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`font-mono ${getEntityColor('lote', 'text')}`}>Lote</span>
                    <i className="fas fa-chevron-right text-gray-400"></i>
                    <span className={`font-mono font-bold ${getEntityColor('saca', 'text')}`}>Saca (actual)</span>
                    <i className="fas fa-chevron-right text-gray-400"></i>
                    <span className="font-mono text-gray-600 dark:text-gray-400">Paquetes</span>
                  </div>
                  <p className={`text-xs ${getEntityColor('lote', 'text')} mt-2`}>
                    Los paquetes en esta saca heredarán los datos de envío del lote si no tienen valores propios.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Estadísticas */}
          <Card header={
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              <i className="fas fa-chart-bar mr-2"></i>
              Estadísticas
            </h2>
          }>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Total Paquetes
                    </p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                      {pull.packages_count || 0}
                    </p>
                  </div>
                  <i className="fas fa-box text-3xl text-blue-500 dark:text-blue-400"></i>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Tamaño
                    </p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-200">
                      {pull.size_display}
                    </p>
                  </div>
                  <i className="fas fa-expand-arrows-alt text-3xl text-green-500 dark:text-green-400"></i>
                </div>
              </div>

              <div className={`p-4 ${getEntityColor('saca', 'bg')} rounded-lg`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${getEntityColor('saca', 'text')}`}>
                      Estado
                    </p>
                    <p className={`text-2xl font-bold ${getEntityColor('saca', 'text')}`}>
                      {pull.batch ? 'En Lote' : 'Individual'}
                    </p>
                  </div>
                  <i className={`fas ${pull.batch ? 'fa-layer-group' : 'fa-cube'} text-3xl ${getEntityColor('saca', 'icon')}`}></i>
                </div>
              </div>
            </div>
          </Card>

          {/* Cambio de Estado Masivo */}
          {pull.packages && pull.packages.length > 0 && (
            <Card header={
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-exchange-alt text-white text-sm"></i>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cambiar Estado de Paquetes
                </h2>
              </div>
            }>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cambia el estado de todos los <strong>{pull.packages_count || pull.packages.length}</strong> paquetes de esta saca de una sola vez.
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

                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    <i className="fas fa-info-circle mr-1"></i>
                    Esta acción actualizará el estado de todos los paquetes de la saca y quedará registrada en el historial de cada paquete.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Lista de Paquetes */}
          <Card header={
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                <i className="fas fa-boxes mr-2"></i>
                Paquetes ({pull.packages_count || 0})
              </h2>
              <Link to={`/logistica/pulls/${id}/agregar-paquetes`}>
                <Button size="sm" variant="outline" icon={<i className="fas fa-plus"></i>}>
                  Agregar Paquetes
                </Button>
              </Link>
            </div>
          }>
            {pull.packages && pull.packages.length > 0 ? (
              <PackageList
                packages={pull.packages}
                title=""
                showRemove={false}
                showConfig={true}
                emptyMessage="No hay paquetes en esta saca"
                maxHeight="500px"
              />
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-box-open text-4xl text-gray-300 dark:text-gray-600 mb-3"></i>
                <p className="text-gray-500 dark:text-gray-400">
                  No hay paquetes en esta saca
                </p>
                <Link to={`/logistica/pulls/${id}/agregar-paquetes`}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-4"
                    icon={<i className="fas fa-plus"></i>}
                  >
                    Agregar Paquetes
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Columna Derecha: Código QR */}
        <div className="lg:col-span-1">
          <Card header={
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              <i className="fas fa-qrcode mr-2"></i>
              Código QR
            </h2>
          }>
            <QRCodeDisplay pullId={id} pullsService={pullsService} />
          </Card>
        </div>
      </div>
    </div>
  )
}

export default PullsDetail
