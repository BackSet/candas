import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import transportAgenciesService from '../../services/transportAgenciesService'
import { Card, Button, FormField, LoadingSpinner } from '../../components'

const TransportAgencyForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEdit)
  const [hasChanges, setHasChanges] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    email: '',
    address: '',
    contact_person: '',
    notes: '',
    active: true,
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEdit) {
      loadAgency()
    }
  }, [id])

  const loadAgency = async () => {
    try {
      setInitialLoading(true)
      const data = await transportAgenciesService.get(id)
      setFormData({
        name: data.name || '',
        phone_number: data.phone_number || '',
        email: data.email || '',
        address: data.address || '',
        contact_person: data.contact_person || '',
        notes: data.notes || '',
        active: data.active !== undefined ? data.active : true,
      })
    } catch (error) {
      toast.error('Error al cargar la agencia')
      console.error(error)
      navigate('/catalogo/agencias-transporte')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
    setHasChanges(true)
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'El teléfono es requerido'
    }

    // Validar email si está presente
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Por favor, completa todos los campos requeridos')
      return
    }

    setLoading(true)
    try {
      if (isEdit) {
        await transportAgenciesService.update(id, formData)
        toast.success('Agencia actualizada correctamente')
      } else {
        await transportAgenciesService.create(formData)
        toast.success('Agencia creada correctamente')
      }
      setHasChanges(false)
      navigate('/catalogo/agencias-transporte')
    } catch (error) {
      const errorData = error.response?.data
      
      // Manejar errores de validación del backend
      if (errorData) {
        const backendErrors = {}
        Object.keys(errorData).forEach((key) => {
          if (Array.isArray(errorData[key])) {
            backendErrors[key] = errorData[key][0]
          } else if (typeof errorData[key] === 'string') {
            backendErrors[key] = errorData[key]
          }
        })
        setErrors(backendErrors)
        
        const errorMessage = backendErrors.name || backendErrors.email || 'Error al guardar la agencia'
        toast.error(errorMessage)
      } else {
        toast.error('Error al guardar la agencia')
      }
      
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (!window.confirm('Tienes cambios sin guardar. ¿Estás seguro de salir?')) {
        return
      }
    }
    navigate('/catalogo/agencias-transporte')
  }

  if (initialLoading) {
    return <LoadingSpinner message="Cargando agencia..." />
  }

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
                {isEdit ? 'Editar Agencia' : 'Nueva Agencia'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isEdit ? 'Modifica la información de la agencia' : 'Registra una nueva agencia de transporte'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección 1: Información Básica */}
        <Card className="border-l-4 border-green-400">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <i className="fas fa-building text-green-500"></i>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Información Básica
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Nombre de la Agencia"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                error={errors.name}
                placeholder="Ej: Transporte Express S.A."
              />

              <FormField
                label="Teléfono"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleInputChange}
                required
                error={errors.phone_number}
                placeholder="Ej: 0999999999"
              />
            </div>
          </div>
        </Card>

        {/* Sección 2: Información de Contacto */}
        <Card className="border-l-4 border-blue-400">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <i className="fas fa-address-book text-blue-500"></i>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Información de Contacto
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                placeholder="contacto@agencia.com"
                helpText="Email de contacto de la agencia"
              />

              <FormField
                label="Persona de Contacto"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
                error={errors.contact_person}
                placeholder="Ej: Juan Pérez"
                helpText="Nombre del representante o contacto principal"
              />

              <div className="md:col-span-2">
                <FormField
                  label="Dirección"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  error={errors.address}
                  placeholder="Ej: Av. Principal 123 y Secundaria"
                  helpText="Dirección física de la agencia"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Sección 3: Configuración y Notas */}
        <Card className="border-l-4 border-purple-400">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <i className="fas fa-cog text-purple-500"></i>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configuración
              </h2>
            </div>
            
            <div className="space-y-4">
              {/* Toggle de estado activo */}
              <div>
                <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="relative inline-block w-12 h-6">
                    <input
                      type="checkbox"
                      id="active"
                      name="active"
                      checked={formData.active}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Agencia {formData.active ? 'Activa' : 'Inactiva'}
                    </span>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {formData.active 
                        ? 'La agencia está disponible para asignar a envíos'
                        : 'La agencia no estará disponible para nuevos envíos'
                      }
                    </p>
                  </div>
                  {formData.active ? (
                    <i className="fas fa-check-circle text-2xl text-green-500"></i>
                  ) : (
                    <i className="fas fa-ban text-2xl text-red-500"></i>
                  )}
                </label>
              </div>

              {/* Notas */}
              <FormField
                label="Notas Adicionales"
                name="notes"
                type="textarea"
                rows={4}
                value={formData.notes}
                onChange={handleInputChange}
                error={errors.notes}
                placeholder="Observaciones, horarios de atención, restricciones, etc."
                helpText="Información adicional sobre la agencia"
              />
            </div>
          </div>
        </Card>

        {/* Footer con botones */}
        <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={loading}
            className="w-auto px-6 py-3"
          >
            <i className="fas fa-times mr-2"></i>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                {isEdit ? 'Actualizar' : 'Crear'} Agencia
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default TransportAgencyForm
