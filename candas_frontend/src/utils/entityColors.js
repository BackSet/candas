/**
 * Utilidad centralizada para colores de entidades del sistema
 * Proporciona colores consistentes para badges, iconos y enlaces
 */

/**
 * Obtiene las clases de color de Tailwind para una entidad específica
 * @param {string} entityType - Tipo de entidad: 'saca', 'lote', 'paquete', 'individual', 'despacho', 'sin_asignar'
 * @param {string} variant - Variante de color: 'text', 'bg', 'border', 'badge', 'icon'
 * @returns {string} Clases de Tailwind CSS
 */
export const getEntityColor = (entityType, variant = 'text') => {
  const colors = {
    saca: {
      text: 'text-accent-600 dark:text-accent-400',
      bg: 'bg-accent-50 dark:bg-accent-900/20',
      border: 'border-accent-200 dark:border-accent-800',
      badge: 'accent',
      icon: 'text-accent-600 dark:text-accent-400',
      hover: 'hover:text-accent-700 dark:hover:text-accent-300',
    },
    lote: {
      text: 'text-primary-600 dark:text-primary-400',
      bg: 'bg-primary-50 dark:bg-primary-900/20',
      border: 'border-primary-200 dark:border-primary-800',
      badge: 'primary',
      icon: 'text-primary-600 dark:text-primary-400',
      hover: 'hover:text-primary-700 dark:hover:text-primary-300',
    },
    paquete: {
      text: 'text-secondary-600 dark:text-secondary-400',
      bg: 'bg-secondary-50 dark:bg-secondary-900/20',
      border: 'border-secondary-200 dark:border-secondary-800',
      badge: 'secondary',
      icon: 'text-secondary-600 dark:text-secondary-400',
      hover: 'hover:text-secondary-700 dark:hover:text-secondary-300',
    },
    individual: {
      text: 'text-info-600 dark:text-info-400',
      bg: 'bg-info-50 dark:bg-info-900/20',
      border: 'border-info-200 dark:border-info-800',
      badge: 'info',
      icon: 'text-info-600 dark:text-info-400',
      hover: 'hover:text-info-700 dark:hover:text-info-300',
    },
    despacho: {
      text: 'text-success-600 dark:text-success-400',
      bg: 'bg-success-50 dark:bg-success-900/20',
      border: 'border-success-200 dark:border-success-800',
      badge: 'success',
      icon: 'text-success-600 dark:text-success-400',
      hover: 'hover:text-success-700 dark:hover:text-success-300',
    },
    sin_asignar: {
      text: 'text-secondary-400 dark:text-secondary-500',
      bg: 'bg-secondary-50 dark:bg-secondary-900/20',
      border: 'border-secondary-200 dark:border-secondary-800',
      badge: 'secondary',
      icon: 'text-secondary-400 dark:text-secondary-500',
      hover: 'hover:text-secondary-500 dark:hover:text-secondary-400',
    },
  }

  return colors[entityType]?.[variant] || colors.saca[variant]
}

/**
 * Obtiene el variant de Badge para una entidad
 * @param {string} entityType - Tipo de entidad
 * @returns {string} Variant del Badge
 */
export const getEntityBadgeVariant = (entityType) => {
  return getEntityColor(entityType, 'badge')
}

/**
 * Mapea shipment_type a entityType para compatibilidad
 * @param {string} shipmentType - Tipo de envío: 'sin_asignar', 'individual', 'saca', 'lote'
 * @returns {string} Tipo de entidad correspondiente
 */
export const mapShipmentTypeToEntity = (shipmentType) => {
  const mapping = {
    'sin_asignar': 'sin_asignar',
    'individual': 'individual',
    'saca': 'saca',
    'lote': 'lote',
  }
  return mapping[shipmentType] || 'sin_asignar'
}

