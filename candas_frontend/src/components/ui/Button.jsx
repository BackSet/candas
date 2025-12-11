import { Button as FlowbiteButton } from 'flowbite-react'
import { mapButtonProps } from '../../utils/flowbiteHelpers.jsx'
import PropTypes from 'prop-types'

/**
 * Componente Button que usa directamente Flowbite React
 * Mantiene compatibilidad con la API existente mediante mapeo de props
 */
const Button = (props) => {
  const { flowbiteProps, loading, icon, iconPosition } = mapButtonProps(props)
  const { children, ...restFlowbiteProps } = flowbiteProps

  return (
    <FlowbiteButton {...restFlowbiteProps} className={`min-w-fit w-auto px-4 py-2 ${restFlowbiteProps.className || ''}`.trim()}>
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2" aria-hidden="true">{icon}</span>
      )}
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2" aria-hidden="true">{icon}</span>
      )}
    </FlowbiteButton>
  )
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'ghost', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
}

export default Button
