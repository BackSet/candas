import { Card as FlowbiteCard } from 'flowbite-react'
import { mapCardProps } from '../../utils/flowbiteHelpers.jsx'
import PropTypes from 'prop-types'

/**
 * Componente Card que usa directamente Flowbite React
 * Mantiene compatibilidad con la API existente mediante mapeo de props
 */
const Card = (props) => {
  const { flowbiteProps, header, footer, padding, image, imageAlt } = mapCardProps(props)
  const { children, ...restFlowbiteProps } = flowbiteProps

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (flowbiteProps.onClick) {
        flowbiteProps.onClick(e)
      }
    }
  }

  return (
    <FlowbiteCard
      {...restFlowbiteProps}
      onKeyDown={flowbiteProps.onClick ? handleKeyDown : undefined}
    >
      {image && (
        <img
          src={image}
          alt={imageAlt}
          className="w-full h-auto object-cover rounded-t-lg"
        />
      )}
      {header && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-4 sm:mb-6">
          {header}
        </div>
      )}
      <div className={padding}>
        {children}
      </div>
      {footer && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg text-gray-600 dark:text-gray-300 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 mt-4 sm:mt-6">
          {footer}
        </div>
      )}
    </FlowbiteCard>
  )
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  header: PropTypes.node,
  footer: PropTypes.node,
  hoverable: PropTypes.bool,
  padding: PropTypes.oneOf(['none', 'sm', 'default', 'lg']),
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined', 'filled']),
  image: PropTypes.string,
  imageAlt: PropTypes.string,
  onClick: PropTypes.func,
}

export default Card
