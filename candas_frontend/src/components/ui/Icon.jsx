import PropTypes from 'prop-types'

/**
 * Componente wrapper para iconos FontAwesome que estandariza tamaño, color y peso
 * 
 * @param {string} name - Nombre del icono (sin el prefijo 'fa-')
 * @param {string} style - Estilo del icono: 'solid' (fas), 'regular' (far), 'light' (fal), 'brands' (fab)
 * @param {string} size - Tamaño del icono: 'xs', 'sm', 'md', 'lg', 'xl'
 * @param {string} color - Color del icono (clase de Tailwind o color personalizado)
 * @param {string} className - Clases adicionales
 */
const Icon = ({
  name,
  style = 'solid',
  size = 'md',
  color = 'currentColor',
  className = '',
  ...props
}) => {
  // Mapeo de estilos FontAwesome
  const stylePrefix = {
    solid: 'fas',
    regular: 'far',
    light: 'fal',
    brands: 'fab',
  }

  // Mapeo de tamaños
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }

  // Color puede ser una clase de Tailwind o un color personalizado
  const colorClass = color.startsWith('text-') || color === 'currentColor' 
    ? color 
    : `text-${color}`

  const iconClass = `${stylePrefix[style]} fa-${name} ${sizeClasses[size]} ${colorClass} ${className}`.trim()

  return (
    <i 
      className={iconClass}
      aria-hidden="true"
      {...props}
    />
  )
}

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  style: PropTypes.oneOf(['solid', 'regular', 'light', 'brands']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  color: PropTypes.string,
  className: PropTypes.string,
}

export default Icon

