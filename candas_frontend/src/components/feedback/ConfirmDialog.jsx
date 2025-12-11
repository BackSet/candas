import { Button } from '../ui'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../ui'
import PropTypes from 'prop-types'

/**
 * Configuración de variantes para el diálogo de confirmación
 */
const variantConfig = {
  danger: {
    icon: 'fas fa-exclamation-triangle',
    iconGradient: 'from-red-500 to-rose-600',
    buttonVariant: 'danger',
  },
  warning: {
    icon: 'fas fa-exclamation-circle',
    iconGradient: 'from-yellow-500 to-amber-600',
    buttonVariant: 'warning',
  },
  primary: {
    icon: 'fas fa-info-circle',
    iconGradient: 'from-blue-500 to-cyan-600',
    buttonVariant: 'primary',
  },
  success: {
    icon: 'fas fa-check-circle',
    iconGradient: 'from-green-500 to-emerald-600',
    buttonVariant: 'success',
  },
}

/**
 * Componente ConfirmDialog mejorado con diseño moderno
 * Mantiene compatibilidad con la API existente
 */
const ConfirmDialog = ({
  show,
  title = '¿Estás seguro?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'danger',
  loading = false,
  icon,
}) => {
  const config = variantConfig[variant] || variantConfig.danger
  const displayIcon = icon || config.icon

  return (
    <Modal show={show} onClose={onCancel} size="md">
      <ModalHeader
        icon={displayIcon}
        iconGradient={config.iconGradient}
      >
        {title}
      </ModalHeader>
      <ModalBody>
        <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300">
          {message}
        </p>
      </ModalBody>
      <ModalFooter>
        <div className="flex justify-end gap-3 w-full">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <Button 
            variant={config.buttonVariant} 
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

ConfirmDialog.propTypes = {
  show: PropTypes.bool.isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['danger', 'warning', 'primary', 'success']),
  loading: PropTypes.bool,
  icon: PropTypes.string,
}

export default ConfirmDialog
