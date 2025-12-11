import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import batchesService from '../../services/batchesService'
import transportAgenciesService from '../../services/transportAgenciesService'
import { Card, Button, DataTable, ExportButton, StatCard, TableActions, DocumentButtons } from '../../components'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { useAsyncOperation } from '../../hooks/useAsyncOperation'
import logger from '../../utils/logger'

const BatchesList = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [agencyFilter, setAgencyFilter] = useState('')
  const [transportAgencies, setTransportAgencies] = useState([])

  // Función de fetch estabilizada con useCallback
  const fetchFunction = useCallback(
    (params) => {
      const requestParams = { ...params }
      if (searchTerm) {
        requestParams.search = searchTerm
      }
      if (agencyFilter) {
        requestParams.transport_agency = agencyFilter
      }
      return batchesService.list(requestParams)
    },
    [searchTerm, agencyFilter]
  )

  // Hook para manejo de lista paginada con filtros
  const {
    data: batches,
    loading,
    error,
    handlePageChange,
    refresh,
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    loadData,
  } = usePaginatedList(fetchFunction, {
    pageSize: 50,
    dependencies: [searchTerm, agencyFilter],
  })

  // Cargar agencias al montar
  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const data = await transportAgenciesService.list()
        setTransportAgencies(data.results ?? data)
      } catch (err) {
        logger.error('Error cargando agencias:', err)
      }
    }
    fetchAgencies()
  }, [])


  // Hook para operaciones async
  const deleteOperation = useAsyncOperation({
    successMessage: 'Lote eliminado correctamente',
    errorMessage: 'Error al eliminar el lote',
  })

  const exportOperation = useAsyncOperation({
    successMessage: 'Exportación exitosa',
    errorMessage: 'Error al exportar lotes',
  })

  const handleDelete = async (id, destiny) => {
    if (!window.confirm(`¿Está seguro de eliminar el lote con destino "${destiny}"?\n\nEsta acción eliminará todas las sacas asociadas.`)) return

    await deleteOperation.execute(
      () => batchesService.delete(id),
      {
        onSuccess: () => refresh(),
      }
    )
  }

  const handleExport = async (format) => {
    await exportOperation.execute(() => batchesService.export({ format }))
  }

  const handleDownloadManifestPDF = async (batchId) => {
    toast.info('Generando manifiesto PDF...')
    try {
      await batchesService.generateManifestPDF(batchId)
      toast.success('Manifiesto PDF descargado')
    } catch (error) {
      toast.error('Error al generar el manifiesto PDF')
      logger.error('Error al descargar manifiesto PDF:', error)
    }
  }

  const handleDownloadManifestExcel = async (batchId) => {
    toast.info('Generando manifiesto Excel...')
    try {
      await batchesService.generateManifestExcel(batchId)
      toast.success('Manifiesto Excel descargado')
    } catch (error) {
      toast.error('Error al generar el manifiesto Excel')
      logger.error('Error al descargar manifiesto Excel:', error)
    }
  }

  const handleDownloadLabels = async (batchId) => {
    toast.info('Generando etiquetas de sacas...')
    try {
      await batchesService.generateLabels(batchId)
      toast.success('Etiquetas descargadas')
    } catch (error) {
      toast.error('Error al generar las etiquetas')
      logger.error('Error al descargar etiquetas:', error)
    }
  }

  if (error) {
    logger.error('Error cargando lotes:', error)
  }

  // Calcular estadísticas (solo de los lotes cargados actualmente)
  const safeBatches = Array.isArray(batches) ? batches : []
  const totalPulls = safeBatches.reduce((sum, b) => sum + (b.pulls_count ?? 0), 0)
  const totalPackages = safeBatches.reduce((sum, b) => sum + (b.total_packages ?? 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-layer-group text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Lotes
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gestiona lotes de sacas y visualiza estadísticas
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <ExportButton onExport={handleExport} formats={['excel']} />
            <Button
              variant="outline"
              onClick={() => navigate('/logistica/batches/crear')}
            >
              <i className="fas fa-plus mr-2"></i>
              Crear Lote
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/logistica/batches/crear-con-sacas')}
              className="w-auto px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              <i className="fas fa-magic mr-2"></i>
              Con Sacas
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon="fas fa-layer-group"
          value={batches.length}
          label="Total Lotes"
          color="orange"
        />
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
          icon="fas fa-truck-moving"
          value={new Set(batches.map(b => b.transport_agency).filter(Boolean)).size}
          label="Agencias Usadas"
          color="green"
        />
      </div>

      {/* Tabla de Lotes */}
      <DataTable
        columns={[
          { 
            key: 'destiny', 
            header: 'Destino',
            cell: (batch) => (
              <div className="flex items-center gap-2">
                <i className="fas fa-map-marker-alt text-orange-500 dark:text-orange-400"></i>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {batch.destiny}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ID: {String(batch.id).slice(0, 8)}...
                  </div>
                </div>
              </div>
            )
          },
          { 
            key: 'transport_agency', 
            header: 'Agencia',
            cell: (batch) => (
              <div className="flex items-center gap-2">
                {batch.transport_agency_name ? (
                  <>
                    <i className="fas fa-truck text-green-500 dark:text-green-400 text-sm"></i>
                    <span className="text-gray-700 dark:text-gray-300">
                      {batch.transport_agency_name}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500 italic text-sm">
                    Sin asignar
                  </span>
                )}
              </div>
            )
          },
          { 
            key: 'guide_number', 
            header: 'Guía',
            cell: (batch) => batch.guide_number ? (
              <div className="flex items-center gap-2">
                <i className="fas fa-barcode text-blue-500 dark:text-blue-400 text-sm"></i>
                <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                  {batch.guide_number}
                </span>
              </div>
            ) : (
              <span className="text-gray-400 dark:text-gray-500 italic text-sm">
                Sin guía
              </span>
            )
          },
          { 
            key: 'pulls_count', 
            header: 'Sacas', 
            align: 'center',
            cell: (batch) => (
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20">
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {batch.pulls_count ?? 0}
                </span>
              </div>
            )
          },
          { 
            key: 'total_packages', 
            header: 'Paquetes', 
            align: 'center',
            cell: (batch) => (
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20">
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {batch.total_packages ?? 0}
                </span>
              </div>
            )
          },
          { 
            key: 'created_at', 
            header: 'Fecha',
            cell: (batch) => (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <i className="fas fa-calendar text-sm"></i>
                <span className="text-sm">
                  {new Date(batch.created_at).toLocaleDateString('es-ES')}
                </span>
              </div>
            )
          },
          { 
            key: 'documents', 
            header: 'Documentos', 
            align: 'center',
            cell: (batch) => (
              <DocumentButtons
                itemId={batch.id}
                onPDF={handleDownloadManifestPDF}
                onExcel={handleDownloadManifestExcel}
                onLabel={handleDownloadLabels}
              />
            )
          },
          { 
            key: 'actions', 
            header: 'Acciones', 
            align: 'center',
            cell: (batch) => (
              <TableActions
                itemId={batch.id}
                viewPath="/logistica/batches/:id"
                editPath="/logistica/batches/:id/editar"
                onDelete={() => handleDelete(batch.id, batch.destiny)}
              />
            )
          },
        ]}
        data={safeBatches}
        loading={loading}
        error={error}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por destino, guía o agencia..."
        filterOptions={[
          { value: '', label: 'Todas las agencias' },
          ...transportAgencies.map(agency => ({
            value: agency.id,
            label: agency.name,
          })),
        ]}
        onFilter={(filter) => setAgencyFilter(filter?.value ?? '')}
        pagination={{
          currentPage,
          totalPages,
          totalCount,
          pageSize,
          onPageChange: handlePageChange,
        }}
        emptyTitle={searchTerm || agencyFilter ? 'No se encontraron lotes' : 'No hay lotes'}
        emptyDescription={searchTerm || agencyFilter ? 'Intenta ajustar los filtros' : 'Crea tu primer lote para agrupar sacas'}
        emptyActionLabel="Crear Lote"
        onEmptyAction={() => navigate('/logistica/batches/crear')}
      />
    </div>
  )
}

export default BatchesList
