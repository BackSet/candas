import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import pullsService from '../../services/pullsService'
import { Card, Button, DataTable, Badge, TableActions, DocumentButtons, StatCard } from '../../components'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { useAsyncOperation } from '../../hooks/useAsyncOperation'
import logger from '../../utils/logger'

const PullsList = () => {
  const navigate = useNavigate()

  // Función de fetch estabilizada con useCallback
  const fetchFunction = useCallback(
    (params) => pullsService.list(params),
    []
  )

  // Hook para manejo de lista paginada
  const {
    data: pulls,
    loading,
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    handlePageChange,
    refresh,
  } = usePaginatedList(fetchFunction, { pageSize: 50 })

  // Hook para operaciones async
  const deleteOperation = useAsyncOperation({
    successMessage: 'Saca eliminada correctamente',
    errorMessage: 'Error al eliminar la saca',
  })

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta saca? Esta acción no se puede deshacer.')) {
      return
    }

    await deleteOperation.execute(
      () => pullsService.delete(id),
      {
        onSuccess: () => refresh(),
      }
    )
  }

  const handleDownloadManifestPDF = async (id) => {
    toast.info('Generando manifiesto PDF...')
    try {
      await pullsService.generateManifest(id)
      toast.success('Manifiesto PDF descargado')
    } catch (error) {
      toast.error('Error al generar el manifiesto PDF')
      logger.error('Error generando manifiesto PDF:', error)
    }
  }

  const handleDownloadManifestExcel = async (id) => {
    toast.info('Generando manifiesto Excel...')
    try {
      await pullsService.generateManifestExcel(id)
      toast.success('Manifiesto Excel descargado')
    } catch (error) {
      toast.error('Error al generar el manifiesto Excel')
      logger.error('Error generando manifiesto Excel:', error)
    }
  }

  const handleDownloadLabel = async (id) => {
    toast.info('Generando etiqueta...')
    try {
      await pullsService.generateLabel(id)
      toast.success('Etiqueta descargada')
    } catch (error) {
      toast.error('Error al generar la etiqueta')
      logger.error('Error generando etiqueta:', error)
    }
  }

  const getSizeBadgeVariant = (size) => {
    const sizeMap = {
      'PEQUENO': 'info',
      'MEDIANO': 'warning',
      'GRANDE': 'success',
    }
    return sizeMap[size] ?? 'default'
  }

  const columns = [
    { 
      key: 'id', 
      header: 'ID',
      cell: (pull) => (
        <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
          {pull.id?.substring(0, 8)}...
        </span>
      )
    },
    { 
      key: 'common_destiny', 
      header: 'Destino Común',
      cell: (pull) => (
        <div className="flex items-center gap-2">
          <i className="fas fa-map-marker-alt text-gray-500 dark:text-gray-400 text-xs"></i>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {pull.common_destiny}
          </span>
        </div>
      )
    },
    { 
      key: 'size', 
      header: 'Tamaño',
      cell: (pull) => (
        <Badge variant={getSizeBadgeVariant(pull.size)}>
          {pull.size_display ?? pull.size}
        </Badge>
      )
    },
    { 
      key: 'transport_agency', 
      header: 'Agencia',
      cell: (pull) => pull.transport_agency_name ? (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {pull.transport_agency_name}
        </span>
      ) : (
        <span className="text-sm text-gray-400 dark:text-gray-500 italic">
          Sin asignar
        </span>
      )
    },
    { 
      key: 'packages', 
      header: 'Paquetes',
      cell: (pull) => (
        <div className="flex items-center gap-2">
          <i className="fas fa-box text-gray-500 dark:text-gray-400 text-xs"></i>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {pull.packages_count ?? 0}
          </span>
        </div>
      )
    },
    { 
      key: 'batch', 
      header: 'Lote',
      cell: (pull) => pull.batch ? (
        <Badge variant="purple">
          <i className="fas fa-layer-group mr-1"></i>
          Lote
        </Badge>
      ) : (
        <span className="text-sm text-gray-400 dark:text-gray-500 italic">
          -
        </span>
      )
    },
    { 
      key: 'guide_number', 
      header: 'Guía',
      cell: (pull) => pull.guide_number ? (
        <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
          {pull.guide_number}
        </span>
      ) : (
        <span className="text-sm text-gray-400 dark:text-gray-500 italic">
          Sin guía
        </span>
      )
    },
    { 
      key: 'documents', 
      header: 'Documentos',
      cell: (pull) => (
        <DocumentButtons
          itemId={pull.id}
          onPDF={handleDownloadManifestPDF}
          onExcel={handleDownloadManifestExcel}
          onLabel={handleDownloadLabel}
        />
      )
    },
    { 
      key: 'actions', 
      header: 'Acciones', 
      align: 'right',
      cell: (pull) => (
        <TableActions
          itemId={pull.id}
          viewPath="/logistica/pulls/:id"
          editPath="/logistica/pulls/:id/editar"
          onDelete={handleDelete}
          customActions={[
            {
              onClick: (id) => navigate(`/logistica/pulls/${id}/agregar-paquetes`),
              icon: 'fas fa-plus-circle',
              title: 'Agregar paquetes',
              color: 'text-purple-600 dark:text-purple-400',
            },
          ]}
        />
      )
    },
  ]

  // Calcular estadísticas (solo de las sacas cargadas actualmente)
  const safePulls = Array.isArray(pulls) ? pulls : []
  const totalPulls = safePulls.length
  const totalPackages = safePulls.reduce((sum, p) => sum + (p.packages_count ?? 0), 0)
  const pequeno = safePulls.filter(p => p.size === 'PEQUENO').length
  const mediano = safePulls.filter(p => p.size === 'MEDIANO').length
  const grande = safePulls.filter(p => p.size === 'GRANDE').length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-boxes text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                Sacas
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gestiona las sacas de paquetes
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => navigate('/logistica/pulls/crear')}
              className="w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
            >
              <i className="fas fa-plus mr-2"></i>
              Crear Saca
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon="fas fa-boxes"
          value={totalPulls}
          label="Total Sacas"
          color="purple"
        />
        <StatCard
          icon="fas fa-box"
          value={totalPackages}
          label="Total Paquetes"
          color="blue"
        />
        <StatCard
          icon="fas fa-ruler"
          value={pequeno}
          label="Pequeñas"
          color="blue"
        />
        <StatCard
          icon="fas fa-ruler-combined"
          value={mediano + grande}
          label="Medianas/Grandes"
          color="indigo"
        />
      </div>

      <DataTable
        columns={columns}
        data={safePulls}
        loading={loading}
        pagination={{
          currentPage,
          totalPages,
          totalCount,
          pageSize,
          onPageChange: handlePageChange,
        }}
        emptyTitle="No hay sacas"
        emptyDescription="No hay sacas registradas"
        emptyActionLabel="Crear Primera Saca"
        onEmptyAction={() => navigate('/logistica/pulls/crear')}
      />
    </div>
  )
}

export default PullsList
