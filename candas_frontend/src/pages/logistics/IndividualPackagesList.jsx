import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import packagesService from '../../services/packagesService'
import { LoadingSpinner, EmptyState, ConfirmDialog, Card, Button, Badge, DataTable, StatCard, TableActions, DocumentButtons, MessageModal } from '../../components'
import { getEntityColor } from '../../utils/entityColors'

const IndividualPackagesList = () => {
  const navigate = useNavigate()
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(50)
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, package: null })
  const [deleting, setDeleting] = useState(false)
  const [generatingDocs, setGeneratingDocs] = useState({})
  const [messageModal, setMessageModal] = useState({
    show: false,
    message: '',
    details: null,
    entityId: null,
  })

  const STATUS_CHOICES = [
    { value: '', label: 'Todos los Estados' },
    { value: 'NO_RECEPTADO', label: 'No Receptado' },
    { value: 'EN_BODEGA', label: 'En Bodega' },
    { value: 'EN_TRANSITO', label: 'En Tránsito' },
    { value: 'ENTREGADO', label: 'Entregado' },
    { value: 'DEVUELTO', label: 'Devuelto' },
    { value: 'RETENIDO', label: 'Retenido' },
  ]

  useEffect(() => {
    loadPackages(1)
  }, [statusFilter])

  const loadPackages = async (page = 1) => {
    try {
      setLoading(true)
      
      const params = {
        page: page,
        page_size: pageSize,
        shipment_type: 'individual'
      }
      
      if (statusFilter) {
        params.status = statusFilter
      }
      
      const data = await packagesService.list(params)
      
      setPackages(data.results || [])
      setTotalCount(data.count || 0)
      setCurrentPage(page)
    } catch (error) {
      toast.error('Error al cargar los paquetes individuales')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    loadPackages(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const handleDelete = async () => {
    if (!deleteConfirm.package) return

    try {
      setDeleting(true)
      await packagesService.delete(deleteConfirm.package.id)
      toast.success('Paquete eliminado correctamente')
      setDeleteConfirm({ show: false, package: null })
      loadPackages(currentPage)
    } catch (error) {
      toast.error('Error al eliminar el paquete')
      console.error(error)
    } finally {
      setDeleting(false)
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

  const handleDownloadManifestPDF = async (packageId) => {
    try {
      setGeneratingDocs(prev => ({ ...prev, [`manifest_pdf_${packageId}`]: true }))
      toast.info('Generando manifiesto PDF...')
      await packagesService.generateManifestPDF(packageId)
      toast.success('Manifiesto PDF descargado')
    } catch (error) {
      console.error('Error al descargar manifiesto PDF:', error)
      toast.error('Error al generar el manifiesto PDF')
    } finally {
      setGeneratingDocs(prev => ({ ...prev, [`manifest_pdf_${packageId}`]: false }))
    }
  }

  const handleDownloadManifestExcel = async (packageId) => {
    try {
      setGeneratingDocs(prev => ({ ...prev, [`manifest_excel_${packageId}`]: true }))
      toast.info('Generando manifiesto Excel...')
      await packagesService.generateManifestExcel(packageId)
      toast.success('Manifiesto Excel descargado')
    } catch (error) {
      console.error('Error al descargar manifiesto Excel:', error)
      toast.error('Error al generar el manifiesto Excel')
    } finally {
      setGeneratingDocs(prev => ({ ...prev, [`manifest_excel_${packageId}`]: false }))
    }
  }

  const handleDownloadLabel = async (packageId) => {
    try {
      setGeneratingDocs(prev => ({ ...prev, [`label_${packageId}`]: true }))
      toast.info('Generando etiqueta...')
      await packagesService.generateLabel(packageId)
      toast.success('Etiqueta descargada')
    } catch (error) {
      console.error('Error al descargar etiqueta:', error)
      toast.error('Error al generar la etiqueta')
    } finally {
      setGeneratingDocs(prev => ({ ...prev, [`label_${packageId}`]: false }))
    }
  }

  const handleGenerateMessage = async (packageId) => {
    try {
      const data = await packagesService.generateNotificationMessage(packageId)
      setMessageModal({
        show: true,
        message: data.message,
        entityId: packageId,
        details: {
          agency_name: data.agency_name,
          guide_number: data.guide_number,
          total_packages: data.total_packages,
        },
      })
    } catch (error) {
      console.error('Error al generar mensaje:', error)
      toast.error(error.response?.data?.error || 'Error al generar el mensaje de notificación')
    }
  }

  const filteredPackages = packages.filter((pkg) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      pkg.guide_number?.toLowerCase().includes(searchLower) ||
      pkg.nro_master?.toLowerCase().includes(searchLower) ||
      pkg.name?.toLowerCase().includes(searchLower) ||
      pkg.address?.toLowerCase().includes(searchLower) ||
      pkg.city?.toLowerCase().includes(searchLower)
    )
  })

  // Calcular estadísticas (solo de los paquetes cargados actualmente)
  const totalIndividual = filteredPackages.length
  const enBodega = filteredPackages.filter(p => p.status === 'EN_BODEGA').length
  const sinAgencia = filteredPackages.filter(p => !p.transport_agency_name).length
  const conAgencia = filteredPackages.filter(p => p.transport_agency_name).length

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-info-600 dark:bg-info-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-shipping-fast text-2xl text-white"></i>
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${getEntityColor('individual', 'text')}`}>
                Paquetes Individuales
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Paquetes sin saca y sin agencia de transporte
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => navigate('/logistica/individuales/crear')}
              className="w-auto px-6 py-3 bg-info-600 dark:bg-info-500 hover:bg-info-700 dark:hover:bg-info-600"
            >
              <i className="fas fa-exchange-alt mr-2"></i>
              Convertir a Individual
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon="fas fa-shipping-fast"
          value={totalIndividual}
          label="Total Individuales"
          color="info"
        />
        <StatCard
          icon="fas fa-warehouse"
          value={enBodega}
          label="En Bodega"
          color="blue"
        />
        <StatCard
          icon="fas fa-truck"
          value={conAgencia}
          label="Con Agencia"
          color="green"
        />
        <StatCard
          icon="fas fa-exclamation-triangle"
          value={sinAgencia}
          label="Sin Asignar"
          color="orange"
        />
      </div>

      {/* Filters */}
      <Card padding="default">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-400"></i>
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Buscar por guía, master, nombre, dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_CHOICES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
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
            cell: (pkg) => <span className="text-gray-900 dark:text-gray-100">{pkg.city_province || `${pkg.city}, ${pkg.province}`}</span>
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
            key: 'transport_agency', 
            header: 'Agencia',
            cell: (pkg) => pkg.transport_agency_name || <span className="text-gray-400 dark:text-gray-500">Sin agencia</span>
          },
          { 
            key: 'agency_guide_number', 
            header: 'No. Guía Agencia',
            cell: (pkg) => pkg.agency_guide_number || <span className="text-gray-400 dark:text-gray-500">-</span>
          },
          { 
            key: 'created_at', 
            header: 'Fecha',
            cell: (pkg) => (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <i className="fas fa-calendar text-sm"></i>
                <span className="text-sm">
                  {pkg.created_at ? new Date(pkg.created_at).toLocaleDateString('es-ES') : '-'}
                </span>
              </div>
            )
          },
          { 
            key: 'documents', 
            header: 'Documentos',
            cell: (pkg) => (
              <DocumentButtons
                itemId={pkg.id}
                onPDF={handleDownloadManifestPDF}
                onExcel={handleDownloadManifestExcel}
                onLabel={handleDownloadLabel}
                onMessage={handleGenerateMessage}
                showMessage={true}
              />
            )
          },
          { 
            key: 'actions', 
            header: 'Acciones', 
            align: 'right',
            cell: (pkg) => (
              <TableActions
                itemId={pkg.id}
                viewPath="/paquetes/:id"
                editPath="/logistica/individuales/editar/:id"
                onDelete={() => setDeleteConfirm({ show: true, package: pkg })}
              />
            )
          },
        ]}
        data={filteredPackages}
        loading={loading}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por guía, master, nombre, dirección..."
        filterOptions={STATUS_CHOICES.map(status => ({
          value: status.value,
          label: status.label,
        }))}
        onFilter={(filter) => setStatusFilter(filter?.value ?? '')}
        pagination={{
          currentPage,
          totalPages,
          totalCount,
          pageSize,
          onPageChange: handlePageChange,
        }}
        emptyTitle={searchTerm || statusFilter ? 'No se encontraron paquetes' : 'No hay paquetes individuales'}
        emptyDescription={searchTerm || statusFilter ? 'Intenta ajustar los filtros' : 'Usa "Convertir a Individual" para asignar agencia de transporte a paquetes sin asignar'}
        emptyActionLabel={!searchTerm && !statusFilter ? 'Convertir a Individual' : undefined}
        onEmptyAction={!searchTerm && !statusFilter ? () => navigate('/logistica/individuales/crear') : undefined}
      />

      <ConfirmDialog
        show={deleteConfirm.show}
        title="Eliminar Paquete"
        message={`¿Estás seguro de que deseas eliminar el paquete ${deleteConfirm.package?.guide_number}? Esta acción no se puede deshacer.`}
        confirmText={deleting ? 'Eliminando...' : 'Eliminar'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, package: null })}
        variant="danger"
      />

      <MessageModal
        show={messageModal.show}
        onClose={() => setMessageModal({ show: false, message: '', details: null, entityId: null })}
        message={messageModal.message}
        details={messageModal.details}
        entityId={messageModal.entityId}
        type="package"
      />
    </div>
  )
}

export default IndividualPackagesList
