import { useState } from 'react'
import { toast } from 'react-toastify'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, FormField } from '../../ui'
import packagesService from '../../../services/packagesService'
import logger from '../../../utils/logger'

const PackageChildForm = ({ parentPackage, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    guide_number: '', // Opcional - se genera automáticamente si está vacío
    name: '',
    address: '',
    city: parentPackage?.city || '',
    province: parentPackage?.province || '',
    phone_number: '',
    status: 'NO_RECEPTADO',
    nro_master: '',
    agency_guide_number: '',
    notes: '',
    hashtags: '',
  })
  const [errors, setErrors] = useState({})

  const STATUS_CHOICES = [
    { value: 'NO_RECEPTADO', label: 'No Receptado' },
    { value: 'EN_BODEGA', label: 'En Bodega' },
    { value: 'EN_TRANSITO', label: 'En Tránsito' },
    { value: 'ENTREGADO', label: 'Entregado' },
    { value: 'DEVUELTO', label: 'Devuelto' },
    { value: 'RETENIDO', label: 'Retenido' },
  ]

  // Calcular nomenclatura automática prevista
  const getAutoGuideNumber = () => {
    if (!parentPackage?.guide_number) return ''
    // Simular el cálculo (el backend lo hará realmente)
    return `${parentPackage.guide_number}-H1`
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
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

    // guide_number es opcional (se genera automáticamente si está vacío)
    // Pero si se proporciona, debe ser válido
    if (formData.guide_number.trim() && formData.guide_number.length < 3) {
      newErrors.guide_number = 'El número de guía debe tener al menos 3 caracteres'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida'
    }

    if (!formData.province.trim()) {
      newErrors.province = 'La provincia es requerida'
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'El teléfono es requerido'
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
      // Preparar datos - si guide_number está vacío, enviar null para que se genere automáticamente
      const dataToSend = {
        guide_number: formData.guide_number.trim() || null,
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        province: formData.province.trim(),
        phone_number: formData.phone_number.trim(),
        status: formData.status,
        nro_master: formData.nro_master.trim() || '',
        agency_guide_number: formData.agency_guide_number.trim() || '',
        notes: formData.notes.trim() || '',
        hashtags: formData.hashtags.trim() || '',
      }

      const result = await packagesService.createChild(parentPackage.id, dataToSend)
      
      toast.success(result.message || 'Paquete hijo creado exitosamente')
      
      if (onSuccess) {
        onSuccess(result.package || result)
      }
      
      onClose()
    } catch (error) {
      logger.error('Error creando paquete hijo:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Error al crear el paquete hijo'
      toast.error(errorMessage)
      
      // Mostrar errores de validación si vienen del backend
      if (error.response?.data?.details) {
        setErrors(error.response.data.details)
      }
    } finally {
      setLoading(false)
    }
  }

  const willAutoGenerate = !formData.guide_number.trim()

  return (
    <Modal show={true} onClose={onClose} size="xl">
      <ModalHeader
        icon="fas fa-box"
        iconGradient="from-indigo-500 to-purple-600"
        subtitle={`Crear nuevo paquete hijo para ${parentPackage?.guide_number || 'padre'}`}
      >
        Crear Paquete Hijo
      </ModalHeader>

      <ModalBody>
        <form onSubmit={handleSubmit} id="child-form">
          <div className="space-y-4">
            {/* Información del padre */}
            {parentPackage && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold">Paquete Padre:</span> {parentPackage.guide_number}
                </p>
                {parentPackage.name && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    <span className="font-semibold">Destinatario:</span> {parentPackage.name}
                  </p>
                )}
              </div>
            )}

            {/* Campo guide_number con indicador de generación automática */}
            <div>
              <FormField
                label="Número de Guía"
                name="guide_number"
                type="text"
                value={formData.guide_number}
                onChange={handleInputChange}
                placeholder="Dejar vacío para generar automáticamente"
                error={errors.guide_number}
                helpText="Si se deja vacío, se generará automáticamente con formato: {padre}-H{N}"
              />
              {willAutoGenerate && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <i className="fas fa-info-circle mr-2"></i>
                    Se generará automáticamente: <span className="font-mono font-semibold">{getAutoGuideNumber()}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Campos requeridos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Nombre Destinatario"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Ej: Juan Pérez"
                error={errors.name}
              />

              <FormField
                label="Teléfono"
                name="phone_number"
                type="text"
                value={formData.phone_number}
                onChange={handleInputChange}
                required
                placeholder="Ej: 0991234567"
                error={errors.phone_number}
              />
            </div>

            <FormField
              label="Dirección"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleInputChange}
              required
              placeholder="Ej: Av. Principal 123"
              error={errors.address}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Ciudad"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleInputChange}
                required
                placeholder="Ej: Quito"
                error={errors.city}
              />

              <FormField
                label="Provincia"
                name="province"
                type="text"
                value={formData.province}
                onChange={handleInputChange}
                required
                placeholder="Ej: Pichincha"
                error={errors.province}
              />
            </div>

            {/* Campos opcionales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Estado"
                name="status"
                type="select"
                value={formData.status}
                onChange={handleInputChange}
                options={STATUS_CHOICES}
                helpText="Estado inicial del paquete"
              />

              <FormField
                label="Número Master"
                name="nro_master"
                type="text"
                value={formData.nro_master}
                onChange={handleInputChange}
                placeholder="Ej: MA123456"
              />
            </div>

            <FormField
              label="Número de Guía de Agencia"
              name="agency_guide_number"
              type="text"
              value={formData.agency_guide_number}
              onChange={handleInputChange}
              placeholder="Ej: AG123456"
            />

            <FormField
              label="Notas"
              name="notes"
              type="textarea"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Notas adicionales sobre el paquete"
            />

            <FormField
              label="Hashtags"
              name="hashtags"
              type="text"
              value={formData.hashtags}
              onChange={handleInputChange}
              placeholder="Ej: #urgente #fragil"
            />
          </div>
        </form>
      </ModalBody>

      <ModalFooter>
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={loading}
          type="submit"
          form="child-form"
        >
          <i className="fas fa-plus mr-2"></i>
          Crear Hijo
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default PackageChildForm

