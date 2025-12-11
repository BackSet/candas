import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import dispatchesService from '../../services/dispatchesService'
import { Card, Button, FormField, PullSelector, PackageSelector } from '../../components'

const DispatchCreate = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    dispatch_date: new Date().toISOString().split('T')[0],
    status: 'PLANIFICADO',
    notes: '',
  })
  const [selectedPulls, setSelectedPulls] = useState([])
  const [selectedIndividualPackages, setSelectedIndividualPackages] = useState([])
  const [loading, setLoading] = useState(false)

  const STATUS_CHOICES = [
    { value: 'PLANIFICADO', label: 'Planificado' },
    { value: 'EN_CURSO', label: 'En Curso' },
    { value: 'COMPLETADO', label: 'Completado' },
    { value: 'CANCELADO', label: 'Cancelado' },
  ]

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.dispatch_date) {
      toast.error('La fecha de despacho es obligatoria')
      return
    }

    if (selectedPulls.length === 0 && selectedIndividualPackages.length === 0) {
      toast.error('Debes agregar al menos una saca o un paquete individual')
      return
    }

    setLoading(true)
    try {
      const pullIds = selectedPulls.map((p) => p.id)
      const packageIds = selectedIndividualPackages.map((p) => p.id)
      
      const data = {
        ...formData,
        pull_ids: pullIds,
        package_ids: packageIds,
      }
      
      await dispatchesService.create(data)
      toast.success('Despacho creado correctamente')
      navigate('/logistica/dispatches')
    } catch (error) {
      console.error('Error al crear despacho:', error)
      toast.error(error.response?.data?.detail || 'Error al crear el despacho')
    } finally {
      setLoading(false)
    }
  }

  const getTotalItems = () => {
    // Contar paquetes en sacas + paquetes individuales
    const packagesInPulls = selectedPulls.reduce((sum, pull) => {
      return sum + (pull.packages_count || pull.packages?.length || 0)
    }, 0)
    
    return {
      pulls: selectedPulls.length,
      individualPackages: selectedIndividualPackages.length,
      totalPackages: packagesInPulls + selectedIndividualPackages.length,
    }
  }

  const totals = getTotalItems()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-shipping-fast text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Crear Despacho
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Agrupa sacas y paquetes para un envío específico por fecha
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Despacho */}
        <Card header={
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Información del Despacho
          </h2>
        }>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Fecha de Despacho"
                name="dispatch_date"
                type="date"
                value={formData.dispatch_date}
                onChange={handleInputChange}
                required
              />
              
              <FormField
                label="Estado"
                name="status"
                type="select"
                value={formData.status}
                onChange={handleInputChange}
                required
                options={STATUS_CHOICES}
              />
            </div>

            <FormField
              label="Notas"
              name="notes"
              type="textarea"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Observaciones o instrucciones especiales..."
              rows={3}
            />
          </div>
        </Card>

        {/* Resumen */}
        {(selectedPulls.length > 0 || selectedIndividualPackages.length > 0) && (
          <Card>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400">Sacas</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {totals.pulls}
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">Paq. Individuales</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {totals.individualPackages}
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-purple-600 dark:text-purple-400">Total Paquetes</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {totals.totalPackages}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Agregar Sacas */}
        <Card header={
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Agregar Sacas al Despacho
          </h2>
        }>
          <PullSelector
            selectedPulls={selectedPulls}
            onPullsChange={setSelectedPulls}
            filterAvailable={false}
            label="Seleccionar Sacas"
          />
        </Card>

        {/* Agregar Paquetes Individuales */}
        <Card header={
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Agregar Paquetes Individuales
          </h2>
        }>
          <PackageSelector
            selectedPackages={selectedIndividualPackages}
            onPackagesChange={setSelectedIndividualPackages}
            filterAvailable={true}
            allowBarcode={true}
            allowDropdown={true}
            label="Seleccionar Paquetes Individuales"
          />
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <i className="fas fa-info-circle mr-2"></i>
              Los paquetes individuales son aquellos que se envían sin estar agrupados en una saca.
            </p>
          </div>
        </Card>

        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/logistica/dispatches')}
            disabled={loading}
            className="w-auto px-6 py-3"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            loading={loading}
            icon={!loading && <i className="fas fa-save"></i>}
            className="w-auto px-6 py-3"
          >
            {loading ? 'Creando...' : 'Crear Despacho'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default DispatchCreate
