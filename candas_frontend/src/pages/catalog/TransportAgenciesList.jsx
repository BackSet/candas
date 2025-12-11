import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import transportAgenciesService from '../../services/transportAgenciesService'
import { Card, Button, LoadingSpinner, EmptyState, Badge } from '../../components'
import logger from '../../utils/logger'

const TransportAgenciesList = () => {
  const navigate = useNavigate()
  const [agencies, setAgencies] = useState([])
  const [filteredAgencies, setFilteredAgencies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all') // 'all', 'active', 'inactive'
  const [sortBy, setSortBy] = useState('name') // 'name', 'date', 'packages'

  useEffect(() => {
    fetchAgencies()
  }, [])

  useEffect(() => {
    filterAndSortAgencies()
  }, [agencies, searchTerm, activeFilter, sortBy])

  const fetchAgencies = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await transportAgenciesService.list()
      setAgencies(data.results ?? data)
    } catch (err) {
      logger.error('Error cargando agencias:', err)
      setError('Error al cargar las agencias')
      toast.error('Error al cargar las agencias')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortAgencies = () => {
    let filtered = [...agencies]

    // Aplicar búsqueda
    if (searchTerm) {
      filtered = filtered.filter(agency =>
        agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agency.phone_number && agency.phone_number.includes(searchTerm)) ||
        (agency.email && agency.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (agency.contact_person && agency.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Aplicar filtro de estado
    if (activeFilter === 'active') {
      filtered = filtered.filter(agency => agency.active)
    } else if (activeFilter === 'inactive') {
      filtered = filtered.filter(agency => !agency.active)
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'date') {
        return new Date(b.date_registration) - new Date(a.date_registration)
      } else if (sortBy === 'packages') {
        return (b.total_packages ?? 0) - (a.total_packages ?? 0)
      }
      return 0
    })

    setFilteredAgencies(filtered)
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Está seguro de eliminar la agencia "${name}"?\n\nEsta acción no se puede deshacer.`)) return

    try {
      await transportAgenciesService.delete(id)
      toast.success('Agencia eliminada correctamente')
      fetchAgencies()
    } catch (err) {
      logger.error('Error eliminando agencia:', err)
      toast.error('Error al eliminar la agencia')
    }
  }

  const toggleActive = async (agency) => {
    const action = agency.active ? 'desactivar' : 'activar'
    if (!window.confirm(`¿Está seguro de ${action} la agencia "${agency.name}"?`)) return

    try {
      await transportAgenciesService.partialUpdate(agency.id, {
        active: !agency.active
      })
      toast.success(`Agencia ${!agency.active ? 'activada' : 'desactivada'} correctamente`)
      fetchAgencies()
    } catch (err) {
      logger.error('Error actualizando agencia:', err)
      toast.error('Error al actualizar la agencia')
    }
  }

  const handleExport = async () => {
    try {
      await transportAgenciesService.export({ format: 'excel', active_only: activeFilter === 'active' })
      toast.success('Exportación exitosa')
    } catch (error) {
      logger.error('Error al exportar:', error)
      toast.error('Error al exportar agencias')
    }
  }

  if (loading) return <LoadingSpinner message="Cargando agencias..." />
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-truck-moving text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                Agencias de Transporte
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gestiona las agencias de transporte y visualiza estadísticas
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={handleExport}
            >
              <i className="fas fa-file-excel mr-2"></i>
              Exportar
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/catalogo/agencias-transporte/crear')}
              className="w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
            >
              <i className="fas fa-plus mr-2"></i>
              Nueva Agencia
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <Card className="border-l-4 border-green-400">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Buscar por nombre, teléfono, email o contacto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Todas</option>
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="name">Ordenar: Nombre</option>
                <option value="date">Ordenar: Fecha</option>
                <option value="packages">Ordenar: Paquetes</option>
              </select>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Mostrando <span className="font-bold text-green-600 dark:text-green-400">{filteredAgencies.length}</span> de{' '}
            <span className="font-bold">{agencies.length}</span> agencias
          </div>
        </div>
      </Card>

      {/* Grid de Cards */}
      {filteredAgencies.length === 0 ? (
        <EmptyState
          title={searchTerm || activeFilter !== 'all' ? 'No se encontraron agencias' : 'No hay agencias'}
          description={searchTerm || activeFilter !== 'all' ? 'Intenta ajustar los filtros' : 'Crea tu primera agencia de transporte'}
          actionLabel="Nueva Agencia"
          onAction={() => navigate('/catalogo/agencias-transporte/crear')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgencies.map((agency) => (
            <Card
              key={agency.id}
              className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border-l-4 border-green-400"
              onClick={() => navigate(`/catalogo/agencias-transporte/${agency.id}`)}
            >
              <div className="p-5">
                {/* Header del Card */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                      <i className="fas fa-truck text-green-500"></i>
                      {agency.name}
                    </h3>
                    <Badge variant={agency.active ? 'success' : 'danger'} className="text-xs">
                      {agency.active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                </div>

                {/* Información de Contacto */}
                <div className="space-y-2 mb-4 text-sm">
                  {agency.phone_number && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <i className="fas fa-phone w-4"></i>
                      <span>{agency.phone_number}</span>
                    </div>
                  )}
                  {agency.email && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <i className="fas fa-envelope w-4"></i>
                      <span className="truncate">{agency.email}</span>
                    </div>
                  )}
                  {agency.contact_person && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <i className="fas fa-user w-4"></i>
                      <span>{agency.contact_person}</span>
                    </div>
                  )}
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-3 gap-2 mb-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {agency.total_packages ?? 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Paquetes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {agency.total_pulls ?? 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Sacas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {agency.total_batches ?? 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Lotes</div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/catalogo/agencias-transporte/editar/${agency.id}`)
                    }}
                    className="flex-1"
                  >
                    <i className="fas fa-edit mr-1"></i>
                    Editar
                  </Button>
                  <Button
                    variant={agency.active ? 'warning' : 'success'}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleActive(agency)
                    }}
                  >
                    <i className={`fas fa-${agency.active ? 'ban' : 'check'}`}></i>
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(agency.id, agency.name)
                    }}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Estadísticas Globales */}
      {agencies.length > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 border-green-200 dark:border-green-700">
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {agencies.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Agencias</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {agencies.filter(a => a.active).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Activas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {agencies.reduce((sum, a) => sum + (a.total_packages ?? 0), 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Paquetes</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {agencies.reduce((sum, a) => sum + (a.total_pulls ?? 0), 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Sacas</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default TransportAgenciesList
