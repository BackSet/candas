import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import dispatchesService from '../../services/dispatchesService'
import { Card, Button, LoadingSpinner, Badge } from '../../components'

const STATUS_OPTIONS = [
  { value: 'PLANIFICADO', label: 'Planificado', color: 'secondary' },
  { value: 'EN_CURSO', label: 'En Curso', color: 'warning' },
  { value: 'COMPLETADO', label: 'Completado', color: 'success' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'danger' },
]

const DispatchDetail = () => {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/e032b260-3761-424c-8962-a2f280305add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DispatchDetail.jsx:17',message:'DispatchDetail RENDER',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }
  // #endregion
  
  const navigate = useNavigate()
  const { id } = useParams()
  
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/e032b260-3761-424c-8962-a2f280305add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DispatchDetail.jsx:23',message:'DispatchDetail PARAMS',data:{id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }
  // #endregion
  
  const [dispatch, setDispatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info') // 'info', 'pulls', 'packages'

  useEffect(() => {
    loadDispatch()
  }, [id])

  const loadDispatch = async () => {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/e032b260-3761-424c-8962-a2f280305add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DispatchDetail.jsx:33',message:'loadDispatch ENTRY',data:{id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'})}).catch(()=>{});
    }
    // #endregion
    
    try {
      setLoading(true)
      const data = await dispatchesService.get(id)
      
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/e032b260-3761-424c-8962-a2f280305add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DispatchDetail.jsx:40',message:'loadDispatch SUCCESS',data:{hasData:!!data,dataKeys:data ? Object.keys(data) : 'null',hasPullsList:!!data?.pulls_list,hasPackagesList:!!data?.packages_list},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      }
      // #endregion
      
      setDispatch(data)
    } catch (error) {
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/e032b260-3761-424c-8962-a2f280305add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DispatchDetail.jsx:47',message:'loadDispatch ERROR',data:{errorMessage:error?.message,errorStatus:error?.response?.status,errorData:error?.response?.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      }
      // #endregion
      console.error('Error al cargar despacho:', error)
      toast.error('Error al cargar el despacho')
      navigate('/logistica/dispatches')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('¿Está seguro de eliminar este despacho?')) return

    try {
      await dispatchesService.delete(id)
      toast.success('Despacho eliminado correctamente')
      navigate('/logistica/dispatches')
    } catch (error) {
      console.error('Error al eliminar despacho:', error)
      toast.error('Error al eliminar el despacho')
    }
  }

  const handleDownloadManifestPDF = async () => {
    try {
      toast.info('Generando manifiesto PDF...')
      await dispatchesService.generateManifest(id)
      toast.success('Manifiesto PDF descargado')
    } catch (error) {
      console.error('Error al descargar manifiesto PDF:', error)
      toast.error('Error al generar el manifiesto PDF')
    }
  }

  const handleDownloadManifestExcel = async () => {
    try {
      toast.info('Generando manifiesto Excel...')
      await dispatchesService.generateManifestExcel(id)
      toast.success('Manifiesto Excel descargado')
    } catch (error) {
      console.error('Error al descargar manifiesto Excel:', error)
      toast.error('Error al generar el manifiesto Excel')
    }
  }

  const getStatusBadge = (status) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]
    return (
      <Badge variant={statusOption.color}>
        {statusOption.label}
      </Badge>
    )
  }

  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/e032b260-3761-424c-8962-a2f280305add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DispatchDetail.jsx:80',message:'DispatchDetail RENDER CHECK',data:{loading,hasDispatch:!!dispatch},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }
  // #endregion

  if (loading) {
    return <LoadingSpinner message="Cargando despacho..." />
  }

  if (!dispatch) {
    return <div className="text-red-500">Despacho no encontrado</div>
  }

  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/e032b260-3761-424c-8962-a2f280305add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DispatchDetail.jsx:90',message:'DispatchDetail RETURN',data:{dispatchId:dispatch?.id,activeTab},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }
  // #endregion

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-shipping-fast text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Despacho {new Date(dispatch.dispatch_date).toLocaleDateString('es-ES')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                ID: {String(dispatch.id).slice(0, 8)}... • {getStatusBadge(dispatch.status)} • {new Date(dispatch.created_at).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/logistica/dispatches')}
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Volver
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

      {/* Documentos */}
      <Card className="border-l-4 border-green-400">
        <div className="p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <i className="fas fa-file-download text-green-500 mr-2"></i>
            Documentos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          </div>
        </div>
      </Card>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <div className="p-5 text-center">
            <i className="fas fa-boxes text-4xl text-purple-600 dark:text-purple-400 mb-2"></i>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {dispatch.pulls_count || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Sacas</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <div className="p-5 text-center">
            <i className="fas fa-box text-4xl text-blue-600 dark:text-blue-400 mb-2"></i>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {dispatch.packages_count || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Paq. Individuales</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <div className="p-5 text-center">
            <i className="fas fa-cubes text-4xl text-green-600 dark:text-green-400 mb-2"></i>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {dispatch.total_packages || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Paquetes</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <div className="p-5 text-center">
            <i className="fas fa-calendar text-4xl text-orange-600 dark:text-orange-400 mb-2"></i>
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {new Date(dispatch.dispatch_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Fecha Despacho</div>
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
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
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
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <i className="fas fa-boxes mr-2"></i>
            Sacas ({dispatch.pulls_count || 0})
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'packages'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <i className="fas fa-box mr-2"></i>
            Paquetes Individuales ({dispatch.packages_count || 0})
          </button>
        </div>

        {/* Contenido de Tabs */}
        {activeTab === 'info' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Información del Despacho
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Fecha de Despacho
                  </label>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <i className="fas fa-calendar text-indigo-500"></i>
                    <span className="font-semibold">
                      {new Date(dispatch.dispatch_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Estado
                  </label>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    {getStatusBadge(dispatch.status)}
                  </div>
                </div>

                {dispatch.notes && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Notas
                    </label>
                    <div className="flex items-start gap-2 text-gray-900 dark:text-white">
                      <i className="fas fa-sticky-note text-indigo-500 mt-1"></i>
                      <p className="whitespace-pre-wrap">{dispatch.notes}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Fecha de Creación
                  </label>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <i className="fas fa-calendar text-indigo-500"></i>
                    <span>{new Date(dispatch.created_at).toLocaleString('es-ES')}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Última Actualización
                  </label>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <i className="fas fa-clock text-indigo-500"></i>
                    <span>{new Date(dispatch.updated_at).toLocaleString('es-ES')}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'pulls' && (
          <div className="space-y-4">
            {dispatch.pulls_list && dispatch.pulls_list.length > 0 ? (
              dispatch.pulls_list.map((pull) => {
                const sizeDisplay = pull.size === 'PEQUENO' ? 'Pequeña' : 
                                   pull.size === 'MEDIANO' ? 'Mediana' : 
                                   pull.size === 'GRANDE' ? 'Grande' : pull.size
                
                return (
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
                              {sizeDisplay}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 dark:text-gray-400">
                            {pull.guide_number && (
                              <div>
                                <i className="fas fa-barcode mr-2"></i>
                                {pull.guide_number}
                              </div>
                            )}
                            <div>
                              <i className="fas fa-boxes mr-2"></i>
                              {pull.packages_count || 0} paquetes
                            </div>
                            {pull.created_at && (
                              <div>
                                <i className="fas fa-calendar mr-2"></i>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                  📅 {new Date(pull.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-xs">ID: {String(pull.id).slice(0, 8)}...</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/logistica/pulls/${pull.id}`)}
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })
            ) : (
              <Card>
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <i className="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                  <p>No hay sacas en este despacho</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="space-y-4">
            {dispatch.packages_list && dispatch.packages_list.length > 0 ? (
              dispatch.packages_list.map((pkg) => (
                <Card
                  key={pkg.id}
                  className="hover:shadow-md transition-shadow border-l-4 border-blue-400"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <i className="fas fa-box text-blue-500 text-xl"></i>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {pkg.guide_number}
                          </h4>
                          {pkg.name && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              - {pkg.name}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 dark:text-gray-400">
                          {pkg.city && (
                            <div>
                              <i className="fas fa-map-marker-alt mr-2"></i>
                              {pkg.city}{pkg.province ? `, ${pkg.province}` : ''}
                            </div>
                          )}
                          {pkg.status_display && (
                            <div>
                              <Badge variant="info">
                                {pkg.status_display}
                              </Badge>
                            </div>
                          )}
                          {pkg.created_at && (
                            <div>
                              <i className="fas fa-calendar mr-2"></i>
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                📅 {new Date(pkg.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-xs">ID: {String(pkg.id).slice(0, 8)}...</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/paquetes/${pkg.id}`)}
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card>
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <i className="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                  <p>No hay paquetes individuales en este despacho</p>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DispatchDetail
