import { Badge as FlowbiteBadge } from 'flowbite-react'
import { mapBadgeProps } from '../../utils/flowbiteHelpers.jsx'
import PropTypes from 'prop-types'

/**
 * Componente Badge que usa Flowbite React
 * Mantiene compatibilidad con la API existente mediante mapeo de props
 */
const Badge = (props) => {
  const { children, ...badgeProps } = props
  const flowbiteProps = mapBadgeProps(badgeProps)

  return (
    <FlowbiteBadge {...flowbiteProps}>
      {children}
    </FlowbiteBadge>
  )
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'primary', 'success', 'warning', 'danger', 'info', 'secondary', 'purple']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  rounded: PropTypes.oneOf(['none', 'default', 'full']),
  className: PropTypes.string,
}

export default Badge
