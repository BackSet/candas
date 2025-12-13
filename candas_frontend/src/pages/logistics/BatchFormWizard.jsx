import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import batchesService from '../../services/batchesService'
import transportAgenciesService from '../../services/transportAgenciesService'
import pullsService from '../../services/pullsService'
import { Card, Button, FormField, LoadingSpinner } from '../../components'

const BatchFormWizard = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [transportAgencies, setTransportAgencies] = useState([])
  const [availablePulls, setAvailablePulls] = useState([])
  const [selectedPulls, setSelectedPulls] = useState([])

  const [formData, setFormData] = useState({
    destiny: '',
    transport_agency: '',
    guide_number: '',
    pull_ids: [],
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadTransportAgencies()
    loadAvailablePulls()
  }, [])

  const loadTransportAgencies = async () => {
    try {
      const data = await transportAgenciesService.getActive()
      // Asegurar que siempre sea un array
      const agenciesList = data?.results ?? data ?? []
      setTransportAgencies(Array.isArray(agenciesList) ? agenciesList : [])
      console.log('Agencias cargadas:', agenciesList.length)
    } catch (error) {
      console.error('Error cargando agencias:', error)
      console.error('Error response:', error.response?.data)
    }
  }

  const loadAvailablePulls = async () => {
    try {
      const data = await pullsService.list({ batch__isnull: 'true' })
      setAvailablePulls(data.results || data)
    } catch (error) {
      console.error('Error cargando sacas:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const togglePullSelection = (pullId) => {
    setSelectedPulls(prev => 
      prev.includes(pullId)
        ? prev.filter(id => id !== pullId)
        : [...prev, pullId]
    )
  }

  const validateStep1 = () => {
    const newErrors = {}
    if (!formData.destiny.trim()) {
      newErrors.destiny = 'El destino es requerido'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) {
      toast.error('Por favor completa los campos requeridos')
      return
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const submitData = {
        destiny: formData.destiny,
        transport_agency: formData.transport_agency || null,
        guide_number: formData.guide_number || null,
        pull_ids: selectedPulls,
      }

      await batchesService.create(submitData)
      toast.success('Lote creado correctamente')
      navigate('/logistica/batches')
    } catch (error) {
      console.error('Error creando lote:', error)
      const errorData = error.response?.data
      if (errorData) {
        setErrors(errorData)
        toast.error(errorData.detail || 'Error al crear el lote')
      } else {
        toast.error('Error al crear el lote')
      }
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Información Básica' },
    { number: 2, title: 'Selección de Sacas' },
    { number: 3, title: 'Resumen y Confirmación' },
  ]

  // Filtrar sacas por destino
  const filteredPulls = formData.destiny
    ? availablePulls.filter(pull => 
        pull.common_destiny.toLowerCase().includes(formData.destiny.toLowerCase())
      )
    : availablePulls

  // Calcular totales de sacas seleccionadas
  const selectedPullsData = availablePulls.filter(p => selectedPulls.includes(p.id))
  const totalPackages = selectedPullsData.reduce((sum, p) => sum + (p.packages_count || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-magic text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Crear Lote - Wizard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Crea un lote paso a paso
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      currentStep >= step.number
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <i className="fas fa-check"></i>
                    ) : (
                      step.number
                    )}
                  </div>
                  <span className={`text-sm mt-2 ${
                    currentStep >= step.number 
                      ? 'text-orange-600 dark:text-orange-400 font-semibold' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-4 rounded transition-all ${
                    currentStep > step.number
                      ? 'bg-gradient-to-r from-orange-600 to-red-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Step Content */}
      <Card>
        <div className="p-6">
          {/* Paso 1: Información Básica */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Información Básica del Lote
              </h2>
              <FormField
                label="Destino"
                name="destiny"
                value={formData.destiny}
                onChange={handleInputChange}
                required
                error={errors.destiny}
                placeholder="Ej: GUAYAQUIL - ECUADOR"
                helpText="Ciudad o región de destino del lote"
              />

              <FormField
                label="Agencia de Transporte"
                name="transport_agency"
                type="select"
                value={formData.transport_agency}
                onChange={handleInputChange}
                error={errors.transport_agency}
                options={[
                  { value: '', label: 'Seleccionar agencia...' },
                  ...transportAgencies.map(agency => ({
                    value: agency.id,
                    label: agency.name
                  }))
                ]}
                helpText="Agencia que transportará el lote"
              />

              <FormField
                label="Número de Guía"
                name="guide_number"
                value={formData.guide_number}
                onChange={handleInputChange}
                error={errors.guide_number}
                placeholder="Ej: LOTE-2025-001"
                helpText="Número de guía del lote (opcional)"
              />
            </div>
          )}

          {/* Paso 2: Selección de Sacas */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Selecciona las Sacas
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-bold text-orange-600 dark:text-orange-400">{selectedPulls.length}</span> sacas seleccionadas
                </div>
              </div>

              {formData.destiny && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 mr-2"></i>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando sacas compatibles con destino: <strong>{formData.destiny}</strong>
                  </span>
                </div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredPulls.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <i className="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                    <p>No hay sacas disponibles</p>
                    <p className="text-sm mt-1">Las sacas deben estar sin lote asignado</p>
                  </div>
                ) : (
                  filteredPulls.map(pull => (
                    <label
                      key={pull.id}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPulls.includes(pull.id)
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPulls.includes(pull.id)}
                        onChange={() => togglePullSelection(pull.id)}
                        className="w-5 h-5 text-orange-600"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {pull.common_destiny}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {pull.packages_count || 0} paquetes • {pull.size || 'MEDIANO'}
                        </div>
                      </div>
                      {pull.guide_number && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {pull.guide_number}
                        </div>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Paso 3: Resumen */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Resumen del Lote
              </h2>

              <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Destino
                      </label>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formData.destiny}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Agencia
                      </label>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {transportAgencies.find(a => a.id === formData.transport_agency)?.name || 'Sin asignar'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Número de Guía
                      </label>
                      <div className="text-lg font-bold text-gray-900 dark:text-white font-mono">
                        {formData.guide_number || 'Sin guía'}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="border-l-4 border-orange-400">
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Sacas Incluidas ({selectedPulls.length})
                  </h3>
                  
                  {selectedPullsData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <i className="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                      <p>No hay sacas seleccionadas</p>
                      <p className="text-sm mt-1">Puedes crear el lote sin sacas</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedPullsData.map(pull => (
                        <div key={pull.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {pull.common_destiny}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {pull.packages_count || 0} paquetes • {pull.size || 'MEDIANO'}
                            </div>
                          </div>
                          <i className="fas fa-check-circle text-orange-600 dark:text-orange-400"></i>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {selectedPulls.length}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Sacas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {totalPackages}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Paquetes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedPulls.length > 0 ? Math.round(totalPackages / selectedPulls.length) : 0}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Prom/Saca</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={currentStep === 1 ? () => navigate('/logistica/batches') : prevStep}
          className="w-auto px-6 py-3"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          {currentStep === 1 ? 'Cancelar' : 'Anterior'}
        </Button>

        <div className="flex gap-3">
          {currentStep < 3 ? (
            <Button
              variant="primary"
              onClick={nextStep}
              className="w-auto px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              Siguiente
              <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={loading}
              className="w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creando...
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-2"></i>
                  Crear Lote
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default BatchFormWizard
