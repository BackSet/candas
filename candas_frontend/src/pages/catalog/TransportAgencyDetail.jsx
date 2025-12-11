import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import transportAgenciesService from '../../services/transportAgenciesService'
import { Card, Button, LoadingSpinner, Badge, DataTable } from '../../components'

const TransportAgencyDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [agency, setAgency] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingShipments, setLoadingShipments] = useState(false)
  const [activeTab, setActiveTab] = useState('info') // 'info', 'shipments', 'stats'
  const [shipmentType, setShipmentType] = useState('packages') // 'packages', 'pulls', 'batches'

  useEffect(() => {
    loadAgency()
    loadStatistics()
  }, [id])

  useEffect(() => {
    if (activeTab === 'shipments') {
      loadShipments()
    }
  }, [activeTab, shipmentType])

  const loadAgency = async () => {
    try {
      setLoading(true)
      const data = await transportAgenciesService.get(id)
      setAgency(data)
    } catch (error) {
      console.error('Error al cargar agencia:', error)
      toast.error('Error al cargar la agencia')
      navigate('/catalogo/agencias-transporte')
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const data = await transportAgenciesService.getStatistics(id)
      setStatistics(data)
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    }
  }

  const loadShipments = async () => {
    try {
      setLoadingShipments(true)
      const data = await transportAgenciesService.getShipments(id, shipmentType)
      setShipments(data.results || data)
    } catch (error) {
      console.error('Error al cargar envíos:', error)
      toast.error('Error al cargar envíos')
    } finally {
      setLoadingShipments(false)
    }
  }

  const toggleActive = async () => {
    const action = agency.active ? 'desactivar' : 'activar'
    if (!window.confirm(`¿Está seguro de ${action} esta agencia?`)) return

    try {
      await transportAgenciesService.partialUpdate(id, { active: !agency.active })
      toast.success(`Agencia ${!agency.active ? 'activada' : 'desactivada'}`)
      loadAgency()
    } catch (error) {
      toast.error('Error al actualizar agencia')
    }
  }

  if (loading) {
    return <LoadingSpinner message="Cargando agencia..." />
  }

  if (!agency) {
    return <div className="text-red-500">Agencia no encontrada</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-truck-moving text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                {agency.name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant={agency.active ? 'success' : 'danger'}>
                  {agency.active ? 'Activa' : 'Inactiva'}
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Registro: {new Date(agency.date_registration).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/catalogo/agencias-transporte')}
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Volver
            </Button>
            <Button
              variant={agency.active ? 'warning' : 'success'}
              onClick={toggleActive}
            >
              <i className={`fas fa-${agency.active ? 'ban' : 'check'} mr-2`}></i>
              {agency.active ? 'Desactivar' : 'Activar'}
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate(`/catalogo/agencias-transporte/editar/${id}`)}
              className="w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
            >
              <i className="fas fa-edit mr-2"></i>
              Editar
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <div className="p-5 text-center">
            <i className="fas fa-box text-4xl text-blue-600 dark:text-blue-400 mb-2"></i>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {agency.total_packages || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Paquetes</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <div className="p-5 text-center">
            <i className="fas fa-boxes text-4xl text-purple-600 dark:text-purple-400 mb-2"></i>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {agency.total_pulls || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Sacas</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <div className="p-5 text-center">
            <i className="fas fa-layer-group text-4xl text-orange-600 dark:text-orange-400 mb-2"></i>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {agency.total_batches || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Lotes</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <div className="p-5 text-center">
            <i className="fas fa-calendar text-4xl text-green-600 dark:text-green-400 mb-2"></i>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {agency.last_shipment_date 
                ? new Date(agency.last_shipment_date).toLocaleDateString('es-ES')
                : 'N/A'
              }
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Último Envío</div>
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
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <i className="fas fa-info-circle mr-2"></i>
            Información General
          </button>
          <button
            onClick={() => setActiveTab('shipments')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'shipments'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <i className="fas fa-shipping-fast mr-2"></i>
            Envíos
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'stats'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <i className="fas fa-chart-bar mr-2"></i>
            Estadísticas
          </button>
        </div>

        {/* Contenido de Tabs */}
        {activeTab === 'info' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Información de Contacto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Teléfono
                  </label>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <i className="fas fa-phone text-green-500"></i>
                    <span>{agency.phone_number || 'No especificado'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Email
                  </label>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <i className="fas fa-envelope text-green-500"></i>
                    <span>{agency.email || 'No especificado'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Persona de Contacto
                  </label>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <i className="fas fa-user text-green-500"></i>
                    <span>{agency.contact_person || 'No especificado'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Dirección
                  </label>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <i className="fas fa-map-marker-alt text-green-500"></i>
                    <span>{agency.address || 'No especificado'}</span>
                  </div>
                </div>

                {agency.notes && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Notas
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                      {agency.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'shipments' && (
          <div className="space-y-4">
            {/* Selector de tipo de envío */}
            <div className="flex gap-2">
              <Button
                variant={shipmentType === 'packages' ? 'primary' : 'ghost'}
                onClick={() => setShipmentType('packages')}
                size="sm"
              >
                <i className="fas fa-box mr-2"></i>
                Paquetes
              </Button>
              <Button
                variant={shipmentType === 'pulls' ? 'primary' : 'ghost'}
                onClick={() => setShipmentType('pulls')}
                size="sm"
              >
                <i className="fas fa-boxes mr-2"></i>
                Sacas
              </Button>
              <Button
                variant={shipmentType === 'batches' ? 'primary' : 'ghost'}
                onClick={() => setShipmentType('batches')}
                size="sm"
              >
                <i className="fas fa-layer-group mr-2"></i>
                Lotes
              </Button>
            </div>

            <Card>
              <div className="p-4">
                {loadingShipments ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : shipments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i className="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                    <p>No hay {shipmentType === 'packages' ? 'paquetes' : shipmentType === 'pulls' ? 'sacas' : 'lotes'} registrados</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                            {shipmentType === 'packages' ? 'Guía' : 'Info'}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Estado</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Fecha</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {shipments.slice(0, 10).map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{String(item.id).slice(0, 8)}...</td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {shipmentType === 'packages' ? item.guide_number : item.common_destiny || item.destiny || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {item.status && <Badge variant="info">{item.status_display || item.status}</Badge>}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(item.created_at).toLocaleDateString('es-ES')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'stats' && statistics && (
          <div className="space-y-4">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Distribución de Paquetes por Estado
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(statistics.packages_by_status || {}).map(([code, data]) => (
                    <div key={code} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {data.count}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {data.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default TransportAgencyDetail
