import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import dispatchesService from '../../services/dispatchesService'
import { Button, DataTable, Badge, TableActions, StatCard, Modal, ModalHeader, ModalBody, ModalFooter } from '../../components'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { useAsyncOperation } from '../../hooks/useAsyncOperation'
import logger from '../../utils/logger'
import { getEntityColor } from '../../utils/entityColors'

const DispatchesList = () => {
  const navigate = useNavigate()
  const [exportModal, setExportModal] = useState({ show: false, dispatchId: null })
  const [selectedGuideStatus, setSelectedGuideStatus] = useState('')
  const [exporting, setExporting] = useState(false)

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
      cell: (row) => {
        const handleGeneratePDF = async (e) => {
          e.stopPropagation()
          try {
            await dispatchesService.generateManifest(row.id)
            toast.success('Manifiesto PDF generado correctamente')
          } catch (error) {
            toast.error('Error al generar manifiesto PDF')
            logger.error(error)
          }
        }
        
        const handleGenerateExcel = async (e) => {
          e.stopPropagation()
          try {
            await dispatchesService.generateManifestExcel(row.id)
            toast.success('Manifiesto Excel generado correctamente')
          } catch (error) {
            toast.error('Error al generar manifiesto Excel')
            logger.error(error)
          }
        }

        const handleOpenExportModal = (e) => {
          e.stopPropagation()
          setExportModal({ show: true, dispatchId: row.id })
          setSelectedGuideStatus('')
        }
        
        return (
          <div className="flex items-center gap-2">
            <TableActions
              itemId={row.id}
              viewPath={`/logistica/dispatches/${row.id}`}
              onDelete={() => handleDelete(row.id)}
              showEdit={false}
            />
            <button
              onClick={handleGeneratePDF}
              className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              title="Generar Manifiesto PDF"
            >
              <i className="fas fa-file-pdf"></i>
            </button>
            <button
              onClick={handleGenerateExcel}
              className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
              title="Generar Manifiesto Excel"
            >
              <i className="fas fa-file-excel"></i>
            </button>
            <button
              onClick={handleOpenExportModal}
              className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              title="Exportar Excel (Formato Transportadora)"
            >
              <i className="fas fa-download"></i>
            </button>
          </div>
        )
      },
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

      {/* Modal para Exportar Excel con Formato Personalizado */}
      <Modal
        show={exportModal.show}
        onClose={() => {
          setExportModal({ show: false, dispatchId: null })
          setSelectedGuideStatus('')
        }}
        size="md"
      >
        <ModalHeader
          icon="fas fa-file-excel"
          iconGradient="from-green-500 to-emerald-600"
        >
          Exportar Excel (Formato Transportadora)
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Selecciona el estado de guía que deseas usar para todos los paquetes en el Excel.
              Si no seleccionas ninguno, se usará el estado actual de cada paquete.
            </p>
            <div>
              <label htmlFor="guide-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado de Guía:
              </label>
              <select
                id="guide-status"
                value={selectedGuideStatus}
                onChange={(e) => setSelectedGuideStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Usar estado actual de cada paquete</option>
                <option value="DEVOLUCION TRANSPORTADORA">DEVOLUCION TRANSPORTADORA</option>
                <option value="ENTREGADA A DESTINATARIO">ENTREGADA A DESTINATARIO</option>
                <option value="ENTREGADA A TRANSPORTADORA">ENTREGADA A TRANSPORTADORA</option>
                <option value="SALE PARA ENTREGA">SALE PARA ENTREGA</option>
                <option value="SE RETIRA DEL DESPACHO">SE RETIRA DEL DESPACHO</option>
              </select>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <i className="fas fa-info-circle mr-2"></i>
                El Excel incluirá las columnas: FECHA, HORA, HAWB/REFERENCIA, ESTADO DE GUIA, OBSERVACION, REMESA
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex gap-2 flex-wrap w-full">
            <Button
              variant="ghost"
              onClick={() => {
                setExportModal({ show: false, dispatchId: null })
                setSelectedGuideStatus('')
              }}
              disabled={exporting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="success"
              onClick={async () => {
                if (!exportModal.dispatchId) return
                setExporting(true)
                try {
                  toast.info('Generando Excel...')
                  await dispatchesService.exportExcelCustomFormat(
                    exportModal.dispatchId,
                    selectedGuideStatus || null
                  )
                  toast.success('Excel descargado correctamente')
                  setExportModal({ show: false, dispatchId: null })
                  setSelectedGuideStatus('')
                } catch (error) {
                  console.error('Error al exportar Excel:', error)
                  toast.error('Error al generar el Excel')
                } finally {
                  setExporting(false)
                }
              }}
              disabled={exporting}
              loading={exporting}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {exporting ? 'Exportando...' : 'Exportar Excel'}
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default DispatchesList
