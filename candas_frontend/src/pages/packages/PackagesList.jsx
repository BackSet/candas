import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import packagesService from '../../services/packagesService'
import { EmptyState, ConfirmDialog, Card, Button, Badge, DataTable, TableActions, StatCard } from '../../components'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { useAsyncOperation } from '../../hooks/useAsyncOperation'
import logger from '../../utils/logger'

const PackagesList = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [barcodeSearch, setBarcodeSearch] = useState('')
  const [barcodeSearchValue, setBarcodeSearchValue] = useState('') // Valor usado para buscar (solo se actualiza al presionar Enter)
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, package: null })
  const barcodeInputRef = useRef(null)

  // Detectar si se debe mostrar solo paquetes con jerarquía (Clementina)
  const showClementinaOnly = searchParams.get('clementina') === 'true'

  // Función de fetch estabilizada con useCallback
  const fetchFunction = useCallback(
    (params) => {
      const requestParams = { ...params }
      
      if (barcodeSearchValue) {
        requestParams.search = barcodeSearchValue
      }
      
      // Agregar filtro de jerarquía si está activo
      if (showClementinaOnly) {
        requestParams.has_hierarchy = 'true'
      }
      
      return packagesService.list(requestParams)
    },
    [barcodeSearchValue, showClementinaOnly]
  )

  // Hook para manejo de lista paginada con filtros y búsqueda
  const {
    data: packages,
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
    dependencies: [barcodeSearchValue, showClementinaOnly],
    autoLoad: true,
  })

  // Log para depuración
  useEffect(() => {
    if (error) {
      logger.error('Error al cargar paquetes:', error)
      console.error('Error en PackagesList:', error)
    }
    if (packages) {
      console.log('Paquetes cargados:', packages.length, packages)
    }
  }, [error, packages])

  // Auto-focus en el campo de códigos de barras cuando se carga la página
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [])

  // Manejar búsqueda de código de barras (Enter)
  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const searchValue = barcodeSearch.trim()
      setBarcodeSearchValue(searchValue)
      // Re-enfocar el campo para el siguiente escaneo
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus()
          barcodeInputRef.current.select()
        }
      }, 100)
    }
  }

  // Limpiar búsqueda de código de barras
  const handleClearBarcode = () => {
    setBarcodeSearch('')
    setBarcodeSearchValue('')
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }

  // Hook para operaciones async
  const deleteOperation = useAsyncOperation({
    successMessage: 'Paquete eliminado correctamente',
    errorMessage: 'Error al eliminar el paquete',
  })

  const handleDelete = async () => {
    if (!deleteConfirm.package) return

    await deleteOperation.execute(
      () => packagesService.delete(deleteConfirm.package.id),
      {
        onSuccess: () => {
          setDeleteConfirm({ show: false, package: null })
          refresh()
        },
      }
    )
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


  // Calcular estadísticas (solo de los paquetes cargados actualmente)
  const safePackages = Array.isArray(packages) ? packages : []
  const totalPackages = safePackages.length
  const enBodega = safePackages.filter(p => p.status === 'EN_BODEGA').length
  const enTransito = safePackages.filter(p => p.status === 'EN_TRANSITO').length
  const entregados = safePackages.filter(p => p.status === 'ENTREGADO').length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 bg-gradient-to-br ${showClementinaOnly ? 'from-indigo-500 to-purple-600' : 'from-blue-500 to-cyan-600'} rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform`}>
              <i className={`fas ${showClementinaOnly ? 'fa-sitemap' : 'fa-box'} text-2xl text-white`}></i>
            </div>
            <div>
              <h1 className={`text-3xl font-bold bg-gradient-to-r ${showClementinaOnly ? 'from-indigo-600 to-purple-600' : 'from-blue-600 to-cyan-600'} bg-clip-text text-transparent`}>
                {showClementinaOnly ? 'Clementina' : 'Paquetes'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {showClementinaOnly 
                  ? 'Paquetes con jerarquía (tienen padre o son padres)'
                  : 'Gestiona todos los paquetes del sistema'
                }
              </p>
            </div>
          </div>
          <div className="flex gap-3 mx-2">
            <Button
              variant="primary"
              onClick={() => navigate('/paquetes/crear')}
              className="w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <i className="fas fa-plus mr-2"></i>
              Crear Paquete
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon="fas fa-box"
          value={totalPackages}
          label="Total Paquetes"
          color="blue"
        />
        <StatCard
          icon="fas fa-warehouse"
          value={enBodega}
          label="En Bodega"
          color="blue"
        />
        <StatCard
          icon="fas fa-truck"
          value={enTransito}
          label="En Tránsito"
          color="indigo"
        />
        <StatCard
          icon="fas fa-check-circle"
          value={entregados}
          label="Entregados"
          color="green"
        />
      </div>

      {/* Buscador de código de barras */}
      <Card padding="default">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-barcode text-gray-400"></i>
          </div>
          <input
            ref={barcodeInputRef}
            type="text"
            className="w-full pl-10 pr-10 py-2.5 border-2 border-blue-400 dark:border-blue-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Escanear código de barras (número de guía)..."
            value={barcodeSearch}
            onChange={(e) => setBarcodeSearch(e.target.value)}
            onKeyDown={handleBarcodeKeyDown}
          />
          {barcodeSearch && (
            <button
              onClick={handleClearBarcode}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Limpiar búsqueda"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </Card>

      {/* Table */}
      <DataTable
        columns={[
          { 
            key: 'guide_number', 
            header: 'Guía',
            cell: (pkg) => (
              <Link
                to={`/paquetes/${pkg.id}`}
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {pkg.guide_number}
              </Link>
            )
          },
          { 
            key: 'nro_master', 
            header: 'Master',
            cell: (pkg) => pkg.nro_master ?? <span className="text-gray-400 dark:text-gray-500">-</span>
          },
          { 
            key: 'name', 
            header: 'Nombre',
            cell: (pkg) => <span className="text-gray-900 dark:text-gray-100">{pkg.name || '-'}</span>
          },
          { 
            key: 'city', 
            header: 'Ciudad',
            cell: (pkg) => (
              <span className="text-gray-900 dark:text-gray-100">
                {pkg.city_province || `${pkg.city}, ${pkg.province}`}
              </span>
            )
          },
          { 
            key: 'status', 
            header: 'Estado',
            cell: (pkg) => (
              <Badge variant={getStatusBadgeVariant(pkg.status)}>
                {pkg.status_display || pkg.status}
              </Badge>
            )
          },
          { 
            key: 'shipment_type', 
            header: 'Agrupación',
            cell: (pkg) => {
              const getShipmentBadgeVariant = (type) => {
                const variants = {
                  'sin_asignar': 'default',
                  'individual': 'info',
                  'saca': 'warning',
                  'lote': 'success'
                }
                return variants[type] || 'default'
              }

              const shipmentType = pkg.shipment_type || 'sin_asignar'
              const shipmentTypeDisplay = pkg.shipment_type_display || 'Sin Asignar'

              if (shipmentType === 'lote' && pkg.batch_info) {
                return (
                  <div className="flex flex-col gap-1">
                    <Link 
                      to={`/logistica/batches/${pkg.batch_info.id}`} 
                      className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      <i className="fas fa-layer-group mr-1"></i>
                      Lote: {pkg.batch_info.destiny}
                    </Link>
                    {pkg.pull_info && (
                      <Link 
                        to={`/logistica/pulls/${pkg.pull}`} 
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline pl-4"
                      >
                        <i className="fas fa-box mr-1"></i>
                        Saca: {pkg.pull_info.common_destiny}
                      </Link>
                    )}
                  </div>
                )
              }

              if (shipmentType === 'saca' && pkg.pull_info) {
                return (
                  <Link 
                    to={`/logistica/pulls/${pkg.pull}`} 
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <i className="fas fa-box mr-1"></i>
                    Saca: {pkg.pull_info.common_destiny}
                  </Link>
                )
              }

              return (
                <Badge variant={getShipmentBadgeVariant(shipmentType)}>
                  {shipmentTypeDisplay}
                </Badge>
              )
            }
          },
          { 
            key: 'actions', 
            header: 'Acciones', 
            align: 'right',
            cell: (pkg) => (
              <TableActions
                itemId={pkg.id}
                viewPath="/paquetes/:id"
                editPath="/paquetes/editar/:id"
                onDelete={() => setDeleteConfirm({ show: true, package: pkg })}
              />
            )
          },
        ]}
        data={safePackages}
        loading={loading}
        pagination={{
          currentPage,
          totalPages,
          totalCount,
          pageSize,
          onPageChange: handlePageChange,
        }}
        emptyTitle={showClementinaOnly ? "No hay paquetes con jerarquía" : "No hay paquetes"}
        emptyDescription={
          barcodeSearchValue 
            ? 'No se encontró ningún paquete con ese código' 
            : showClementinaOnly
            ? 'No hay paquetes con jerarquía (que tengan padre o sean padres)'
            : 'No hay paquetes registrados'
        }
        emptyActionLabel={!barcodeSearchValue && !showClementinaOnly ? 'Crear Primer Paquete' : undefined}
        onEmptyAction={!barcodeSearchValue && !showClementinaOnly ? () => navigate('/paquetes/crear') : undefined}
      />

      <ConfirmDialog
        show={deleteConfirm.show}
        title="Eliminar Paquete"
        message={`¿Estás seguro de que deseas eliminar el paquete ${deleteConfirm.package?.guide_number}? Esta acción no se puede deshacer.`}
        confirmText={deleteOperation.loading ? 'Eliminando...' : 'Eliminar'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, package: null })}
        variant="danger"
      />
    </div>
  )
}

export default PackagesList
