import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, FormField } from '../../ui'
import packagesService from '../../../services/packagesService'
import logger from '../../../utils/logger'

const PackageCodeMigration = ({ packageData, onClose, onSuccess }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [newGuideNumber, setNewGuideNumber] = useState('')
  const [error, setError] = useState(null)

  // Verificar si el paquete tiene hijos
  const hasChildren = packageData?.children_count > 0 || (packageData?.children && packageData.children.length > 0)

  const handleInputChange = (e) => {
    const value = e.target.value.trim()
    setNewGuideNumber(value)
    setError(null)
  }

  const validateGuideNumber = (guideNumber) => {
    if (!guideNumber || guideNumber.length < 3) {
      return 'El número de guía debe tener al menos 3 caracteres'
    }
    // Validar formato básico (puedes ajustar según tus necesidades)
    if (!/^[A-Z0-9-]+$/.test(guideNumber)) {
      return 'El número de guía solo puede contener letras mayúsculas, números y guiones'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar
    const validationError = validateGuideNumber(newGuideNumber)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await packagesService.migrateCode(packageData.id, newGuideNumber)
      
      toast.success(result.message || 'Código migrado exitosamente')
      
      // Navegar al nuevo paquete padre si está disponible
      if (result.new_parent?.id) {
        if (onSuccess) {
          onSuccess(result)
        }
        // Navegar al nuevo paquete padre
        navigate(`/paquetes/${result.new_parent.id}`)
      } else {
        // Si no hay navegación, solo cerrar
        if (onSuccess) {
          onSuccess(result)
        }
        onClose()
      }
    } catch (error) {
      logger.error('Error migrando código:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Error al migrar el código'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal show={true} onClose={onClose} size="lg">
      <ModalHeader
        icon="fas fa-exchange-alt"
        iconGradient="from-orange-500 to-red-600"
        subtitle="Cambiar el código del paquete creando un nuevo padre"
      >
        Migrar Código de Paquete
      </ModalHeader>

      <ModalBody>
        <form onSubmit={handleSubmit} id="migration-form">
          <div className="space-y-4">
            {/* Advertencia si tiene hijos */}
            {hasChildren && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <div className="flex items-start">
                  <i className="fas fa-exclamation-triangle text-red-500 dark:text-red-400 text-xl mr-3 mt-0.5"></i>
                  <div>
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                      No se puede migrar este paquete
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                      Este paquete tiene hijos asociados. Primero debe migrar o remover los hijos antes de cambiar el código.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Información del paquete actual */}
            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                <span className="font-semibold">Paquete Actual:</span>
              </p>
              <p className="text-lg font-mono font-semibold text-gray-900 dark:text-white">
                {packageData?.guide_number || 'N/A'}
              </p>
              {packageData?.name && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  <span className="font-semibold">Destinatario:</span> {packageData.name}
                </p>
              )}
            </div>

            {/* Explicación del proceso */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300 font-semibold mb-2">
                <i className="fas fa-info-circle mr-2"></i>
                ¿Qué sucederá?
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                <li>Se creará un nuevo paquete padre con el código: <span className="font-mono font-semibold">{newGuideNumber || 'NUEVO-CODIGO'}</span></li>
                <li>El paquete actual se convertirá en hijo del nuevo paquete</li>
                <li>Se preservarán todos los datos del paquete original</li>
                <li>Se registrará el cambio en el historial de guías</li>
              </ul>
            </div>

            {/* Campo para nuevo código */}
            <FormField
              label="Nuevo Número de Guía"
              name="new_guide_number"
              type="text"
              value={newGuideNumber}
              onChange={handleInputChange}
              required
              placeholder="Ej: ECA1234567890"
              error={error}
              helpText="Ingrese el nuevo código para el paquete padre"
              disabled={hasChildren}
            />

            {/* Vista previa de la jerarquía resultante */}
            {newGuideNumber && !hasChildren && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
                <p className="text-sm text-indigo-800 dark:text-indigo-300 font-semibold mb-2">
                  <i className="fas fa-sitemap mr-2"></i>
                  Jerarquía Resultante:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="font-mono font-semibold text-indigo-900 dark:text-indigo-200">
                      {newGuideNumber}
                    </span>
                    <span className="ml-2 text-indigo-600 dark:text-indigo-400">(Nuevo Padre)</span>
                  </div>
                  <div className="ml-4 flex items-center">
                    <i className="fas fa-arrow-down text-indigo-500 mr-2"></i>
                    <span className="font-mono text-indigo-700 dark:text-indigo-300">
                      {packageData?.guide_number || 'N/A'}
                    </span>
                    <span className="ml-2 text-indigo-600 dark:text-indigo-400">(Hijo)</span>
                  </div>
                </div>
              </div>
            )}
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
          disabled={hasChildren || !newGuideNumber.trim()}
          type="submit"
          form="migration-form"
        >
          <i className="fas fa-exchange-alt mr-2"></i>
          Migrar Código
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default PackageCodeMigration

