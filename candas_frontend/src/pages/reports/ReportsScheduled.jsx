import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Card, Button, Badge, LoadingSpinner, AdvancedTable, FormField, Modal, ModalHeader, ModalBody, ModalFooter } from '../../components'
import reportsService from '../../services/reportsService'

const ReportsScheduled = () => {
  const navigate = useNavigate()
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    report_type: 'packages',
    frequency: 'DAILY',
    recipients: '',
    active: true,
    config: {},
  })

  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = async () => {
    try {
      setLoading(true)
      const data = await reportsService.listSchedules()
      setSchedules(data.results || data)
    } catch (error) {
      console.error('Error cargando programaciones:', error)
      toast.error('Error al cargar las programaciones')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    try {
      // Procesar recipients (string separado por comas a array)
      const recipientsArray = formData.recipients
        .split(',')
        .map(email => email.trim())
        .filter(email => email)

      const submitData = {
        ...formData,
        recipients: recipientsArray,
      }

      if (editingSchedule) {
        await reportsService.updateSchedule(editingSchedule.id, submitData)
        toast.success('Programación actualizada')
      } else {
        await reportsService.createSchedule(submitData)
        toast.success('Programación creada')
      }

      setShowModal(false)
      setEditingSchedule(null)
      setFormData({
        name: '',
        report_type: 'packages',
        frequency: 'DAILY',
        recipients: '',
        active: true,
        config: {},
      })
      loadSchedules()
    } catch (error) {
      console.error('Error guardando programación:', error)
      toast.error(error.response?.data?.detail || 'Error al guardar')
    }
  }

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule)
    setFormData({
      name: schedule.name,
      report_type: schedule.report_type,
      frequency: schedule.frequency,
      recipients: (schedule.recipients || []).join(', '),
      active: schedule.active,
      config: schedule.config || {},
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta programación?')) return

    try {
      await reportsService.deleteSchedule(id)
      toast.success('Programación eliminada')
      loadSchedules()
    } catch (error) {
      console.error('Error eliminando programación:', error)
      toast.error('Error al eliminar')
    }
  }

  const handleToggleActive = async (id) => {
    try {
      await reportsService.toggleScheduleActive(id)
      toast.success('Estado actualizado')
      loadSchedules()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar estado')
    }
  }

  const handleRunNow = async (id) => {
    if (!window.confirm('¿Ejecutar este reporte ahora?')) return

    try {
      const loadingToast = toast.info('Generando reporte...', { autoClose: false })
      await reportsService.runScheduleNow(id)
      toast.dismiss(loadingToast)
      toast.success('Reporte generado exitosamente')
      loadSchedules()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al generar reporte')
    }
  }

  const columns = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-gray-900 dark:text-white">
            {row.original.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {row.original.report_type_display}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'frequency',
      header: 'Frecuencia',
      cell: ({ row }) => (
        <Badge variant={
          row.original.frequency === 'DAILY' ? 'info' :
          row.original.frequency === 'WEEKLY' ? 'warning' : 'primary'
        }>
          {row.original.frequency_display}
        </Badge>
      ),
    },
    {
      accessorKey: 'active',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={row.original.active ? 'success' : 'secondary'}>
          {row.original.active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      accessorKey: 'last_run',
      header: 'Última Ejecución',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {row.original.last_run
            ? new Date(row.original.last_run).toLocaleString('es-ES')
            : 'Nunca'}
        </div>
      ),
    },
    {
      accessorKey: 'next_run',
      header: 'Próxima Ejecución',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {row.original.next_run
            ? new Date(row.original.next_run).toLocaleString('es-ES')
            : '-'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleRunNow(row.original.id)}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            title="Ejecutar ahora"
          >
            <i className="fas fa-play"></i>
          </button>
          <button
            onClick={() => handleToggleActive(row.original.id)}
            className="text-yellow-600 dark:text-yellow-400 hover:underline text-sm"
            title={row.original.active ? 'Desactivar' : 'Activar'}
          >
            <i className={`fas fa-${row.original.active ? 'pause' : 'play'}`}></i>
          </button>
          <button
            onClick={() => handleEdit(row.original)}
            className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
            title="Editar"
          >
            <i className="fas fa-edit"></i>
          </button>
          <button
            onClick={() => handleDelete(row.original.id)}
            className="text-red-600 dark:text-red-400 hover:underline text-sm"
            title="Eliminar"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]

  if (loading) return <LoadingSpinner message="Cargando programaciones..." />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <i className="fas fa-clock text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Reportes Programados
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gestiona la generación automática de reportes
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/reports')}
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Volver
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setEditingSchedule(null)
                setFormData({
                  name: '',
                  report_type: 'packages',
                  frequency: 'DAILY',
                  recipients: '',
                  active: true,
                  config: {},
                })
                setShowModal(true)
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <i className="fas fa-plus mr-2"></i>
              Nueva Programación
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla con AdvancedTable */}
      <Card>
        <div className="p-6">
          <AdvancedTable
            data={schedules}
            columns={columns}
            pageSize={10}
            emptyMessage="No hay programaciones creadas"
          />
        </div>
      </Card>

      {/* Modal de Crear/Editar */}
      <Modal 
        show={showModal} 
        onClose={() => {
          setShowModal(false)
          setEditingSchedule(null)
        }} 
        size="lg"
      >
        <ModalHeader
          icon={editingSchedule ? "fas fa-edit" : "fas fa-plus-circle"}
          iconGradient="from-purple-500 to-pink-600"
          subtitle="Configura la generación automática de reportes"
        >
          {editingSchedule ? 'Editar' : 'Nueva'} Programación
        </ModalHeader>

        <ModalBody>
          <form id="schedule-form" onSubmit={handleSubmit} className="space-y-5">
            <FormField
              label="Nombre"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Ej: Reporte Diario de Paquetes"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Tipo de Reporte"
                name="report_type"
                type="select"
                value={formData.report_type}
                onChange={handleInputChange}
                required
                options={[
                  { value: 'packages', label: 'Reporte de Paquetes' },
                  { value: 'statistics', label: 'Estadísticas Generales' },
                  { value: 'agencies', label: 'Rendimiento de Agencias' },
                  { value: 'destinations', label: 'Reporte de Destinos' },
                ]}
              />

              <FormField
                label="Frecuencia"
                name="frequency"
                type="select"
                value={formData.frequency}
                onChange={handleInputChange}
                required
                options={[
                  { value: 'DAILY', label: 'Diario' },
                  { value: 'WEEKLY', label: 'Semanal' },
                  { value: 'MONTHLY', label: 'Mensual' },
                ]}
              />
            </div>

            <FormField
              label="Destinatarios"
              name="recipients"
              value={formData.recipients}
              onChange={handleInputChange}
              placeholder="email1@example.com, email2@example.com"
              helpText="Emails separados por comas. Los reportes se enviarán a estos correos"
            />

            <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
              formData.active
                ? 'border-purple-500/50 bg-purple-500/10'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}>
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
                className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Activar programación
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  La programación comenzará a ejecutarse automáticamente
                </p>
              </div>
            </label>
          </form>
        </ModalBody>

        <ModalFooter>
          <div className="flex justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => {
                setShowModal(false)
                setEditingSchedule(null)
              }}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              form="schedule-form"
              variant="primary"
            >
              <i className={`fas fa-${editingSchedule ? 'save' : 'plus'} mr-2`}></i>
              {editingSchedule ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default ReportsScheduled
