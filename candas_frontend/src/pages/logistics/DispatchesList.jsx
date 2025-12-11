import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import dispatchesService from '../../services/dispatchesService'
import { Button, DataTable, Badge, TableActions, StatCard } from '../../components'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { useAsyncOperation } from '../../hooks/useAsyncOperation'
import logger from '../../utils/logger'
import { getEntityColor } from '../../utils/entityColors'

const DispatchesList = () => {
  const navigate = useNavigate()

  // Función de fetch estabilizada con useCallback
  const fetchFunction = useCallback(
    (params) => dispatchesService.list(params),
    []
  )

  // Hook para manejo de lista paginada
  const {
    data: dispatches,
    loading,
    error,
    handlePageChange,
    refresh,
    currentPage,
    totalPages,
    totalCount,
    pageSize,
  } = usePaginatedList(fetchFunction, { pageSize: 50 })

  // Hook para operaciones async
  const deleteOperation = useAsyncOperation({
    successMessage: 'Despacho eliminado correctamente',
    errorMessage: 'Error al eliminar el despacho',
  })

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este despacho?')) return

    await deleteOperation.execute(
      () => dispatchesService.delete(id),
      {
        onSuccess: () => refresh(),
      }
    )
  }

  const getStatusBadgeColor = (status) => {
    const colorMap = {
      'PLANIFICADO': 'secondary',
      'EN_CURSO': 'warning',
      'COMPLETADO': 'success',
      'CANCELADO': 'danger',
    }
    return colorMap[status] ?? 'secondary'
  }

  const getStatusLabel = (status) => {
    const labels = {
      'PLANIFICADO': 'Planificado',
      'EN_CURSO': 'En Curso',
      'COMPLETADO': 'Completado',
      'CANCELADO': 'Cancelado',
    }
    return labels[status] ?? status
  }

  const columns = [
    {
      header: 'Fecha',
      accessor: 'dispatch_date',
      cell: (row) => (
        <span className="text-gray-900 dark:text-gray-100">
          {new Date(row.dispatch_date).toLocaleDateString('es-ES')}
        </span>
      ),
    },
    {
      header: 'Estado',
      accessor: 'status',
      cell: (row) => (
        <Badge variant={getStatusBadgeColor(row.status)}>
          {getStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      header: 'Sacas',
      accessor: 'pulls_count',
      cell: (row) => (
        <span className="text-gray-900 dark:text-gray-100">
          {row.pulls_count ?? 0}
        </span>
      ),
    },
    {
      header: 'Paquetes Individuales',
      accessor: 'packages_count',
      cell: (row) => (
        <span className="text-gray-900 dark:text-gray-100">
          {row.packages_count ?? 0}
        </span>
      ),
    },
    {
      header: 'Total Paquetes',
      accessor: 'total_packages',
      cell: (row) => (
        <span className="text-gray-900 dark:text-gray-100">
          {row.total_packages ?? 0}
        </span>
      ),
    },
    {
      header: 'Creado',
      accessor: 'created_at',
      cell: (row) => (
        <span className="text-gray-900 dark:text-gray-100">
          {new Date(row.created_at).toLocaleDateString('es-ES')}
        </span>
      ),
    },
    {
      header: 'Acciones',
      accessor: 'id',
      cell: (row) => (
        <TableActions
          itemId={row.id}
          viewPath="/logistica/dispatches/:id"
          onDelete={() => handleDelete(row.id)}
          showEdit={false}
        />
      ),
    },
  ]

  if (error) {
    logger.error('Error cargando despachos:', error)
  }

  // Calcular estadísticas (solo de los despachos cargados actualmente)
  const safeDispatches = Array.isArray(dispatches) ? dispatches : []
  const totalDispatches = safeDispatches.length
  const enCurso = safeDispatches.filter(d => d.status === 'EN_CURSO').length
  const completados = safeDispatches.filter(d => d.status === 'COMPLETADO').length
  const totalPackages = safeDispatches.reduce((sum, d) => sum + (d.total_packages ?? 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-success-600 dark:bg-success-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-truck-loading text-2xl text-white"></i>
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${getEntityColor('despacho', 'text')}`}>
                Despachos
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gestiona los despachos de sacas y paquetes
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => navigate('/logistica/dispatches/crear')}
              className="w-auto px-6 py-3 bg-success-600 dark:bg-success-500 hover:bg-success-700 dark:hover:bg-success-600"
            >
              <i className="fas fa-plus mr-2"></i>
              Crear Despacho
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon="fas fa-truck-loading"
          value={totalDispatches}
          label="Total Despachos"
          color="success"
        />
        <StatCard
          icon="fas fa-spinner"
          value={enCurso}
          label="En Curso"
          color="orange"
        />
        <StatCard
          icon="fas fa-check-circle"
          value={completados}
          label="Completados"
          color="green"
        />
        <StatCard
          icon="fas fa-box"
          value={totalPackages}
          label="Total Paquetes"
          color="blue"
        />
      </div>

      <DataTable
        columns={columns}
        data={safeDispatches}
        loading={loading}
        error={error}
        pagination={{
          currentPage,
          totalPages,
          totalCount,
          pageSize,
          onPageChange: handlePageChange,
        }}
        emptyTitle="No hay despachos"
        emptyDescription="Crea tu primer despacho para organizar envíos"
        emptyActionLabel="Crear Despacho"
        onEmptyAction={() => navigate('/logistica/dispatches/crear')}
      />
    </div>
  )
}

export default DispatchesList
