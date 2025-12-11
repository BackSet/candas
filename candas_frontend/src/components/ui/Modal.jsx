import { Modal as FlowbiteModal, ModalBody as FlowbiteModalBody, ModalFooter as FlowbiteModalFooter, ModalHeader as FlowbiteModalHeader } from 'flowbite-react'
import PropTypes from 'prop-types'

/**
 * Tema personalizado para modales
 * Tamanios mas amplios para mejor visualizacion
 */
const modalTheme = {
  root: {
    base: 'fixed inset-x-0 top-0 z-50 h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full',
    show: {
      on: 'flex bg-gray-900/70 dark:bg-gray-900/80 backdrop-blur-sm',
      off: 'hidden',
    },
    sizes: {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-3xl',
      '2xl': 'max-w-4xl',
      '3xl': 'max-w-5xl',
      '4xl': 'max-w-6xl',
      '5xl': 'max-w-7xl',
      '6xl': 'max-w-[90rem]',
      '7xl': 'max-w-[100rem]',
    },
    positions: {
      'top-left': 'items-start justify-start',
      'top-center': 'items-start justify-center',
      'top-right': 'items-start justify-end',
      'center-left': 'items-center justify-start',
      center: 'items-center justify-center',
      'center-right': 'items-center justify-end',
      'bottom-right': 'items-end justify-end',
      'bottom-center': 'items-end justify-center',
      'bottom-left': 'items-end justify-start',
    },
  },
  content: {
    base: 'relative h-full w-full p-4 md:h-auto',
    inner: 'relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  },
  body: {
    base: 'flex-1 overflow-auto p-6',
    popup: 'pt-0',
  },
  header: {
    base: 'flex items-start justify-between rounded-t-2xl p-5 border-b border-gray-200 dark:border-gray-700',
    popup: 'border-b-0 p-2',
    title: 'text-xl font-semibold text-gray-900 dark:text-white',
    close: {
      base: 'ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white transition-colors',
      icon: 'h-5 w-5',
    },
  },
  footer: {
    base: 'flex items-center space-x-2 rounded-b-2xl border-t border-gray-200 p-5 dark:border-gray-700',
    popup: 'border-t',
  },
}

/**
 * Modal base mejorado
 * - dismissible: permite cerrar con Esc y click fuera del modal
 */
export const Modal = ({ children, className = '', dismissible = true, ...props }) => {
  return (
    <FlowbiteModal
      theme={modalTheme}
      className={className}
      dismissible={dismissible}
      {...props}
    >
      {children}
    </FlowbiteModal>
  )
}

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  show: PropTypes.bool,
  onClose: PropTypes.func,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl']),
  position: PropTypes.string,
  dismissible: PropTypes.bool,
  popup: PropTypes.bool,
}

/**
 * Header del modal con icono degradado opcional
 */
export const ModalHeader = ({
  children,
  icon,
  iconGradient = 'from-blue-500 to-cyan-600',
  subtitle,
  className = '',
  ...props
}) => {
  // Si solo hay texto simple, usar el header normal
  if (!icon && !subtitle && typeof children === 'string') {
    return (
      <FlowbiteModalHeader className={className} {...props}>
        {children}
      </FlowbiteModalHeader>
    )
  }

  // Header personalizado con icono y subtítulo
  return (
    <FlowbiteModalHeader className={className} {...props}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`w-10 h-10 bg-gradient-to-br ${iconGradient} rounded-xl flex items-center justify-center shadow-lg`}>
            <i className={`${icon} text-white text-lg`}></i>
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {children}
          </h2>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </FlowbiteModalHeader>
  )
}

ModalHeader.propTypes = {
  children: PropTypes.node.isRequired,
  icon: PropTypes.string,
  iconGradient: PropTypes.string,
  subtitle: PropTypes.string,
  className: PropTypes.string,
}

/**
 * Body del modal
 */
export const ModalBody = ({ children, className = '', ...props }) => {
  return (
    <FlowbiteModalBody className={`text-gray-700 dark:text-gray-300 ${className}`} {...props}>
      {children}
    </FlowbiteModalBody>
  )
}

ModalBody.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}

/**
 * Footer del modal
 */
export const ModalFooter = ({ children, className = '', ...props }) => {
  return (
    <FlowbiteModalFooter className={className} {...props}>
      {children}
    </FlowbiteModalFooter>
  )
}

ModalFooter.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}

/**
 * Componente Key para mostrar teclas de atajo
 * Diseñado para verse bien en ambos temas (claro y oscuro)
 */
export const KeyBadge = ({ children, className = '' }) => (
  <kbd className={`
    px-2 py-1 text-xs font-semibold rounded-md min-w-[26px] text-center inline-block
    bg-gray-100 dark:bg-gray-700 
    text-gray-700 dark:text-gray-200 
    border border-gray-300 dark:border-gray-600 
    shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] 
    dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]
    ${className}
  `}>
    {children}
  </kbd>
)

KeyBadge.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}

export default Modal

