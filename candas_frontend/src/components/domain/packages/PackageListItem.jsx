import PropTypes from 'prop-types'
import usePackageDisplayConfig, { PACKAGE_DISPLAY_FIELDS } from '../../../hooks/usePackageDisplayConfig'

/**
 * Componente reutilizable para mostrar un paquete en una lista
 * Usa la configuración global de visualización
 */
const PackageListItem = ({
  package: pkg,
  onRemove,
  onClick,
  showRemove = true,
  showStatus = true,
  compact = false,
  className = '',
}) => {
  const {
    visibleFields,
    listFormat,
    getFieldValue,
  } = usePackageDisplayConfig()

  // Usar formato compacto si se especifica o si la configuración es 'compact'
  const useCompact = compact || listFormat === 'compact'
  const useCard = !compact && listFormat === 'card'

  // Helper para asegurar que un valor sea string
  const ensureString = (value) => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') {
      return value.name || value.id || String(value)
    }
    return String(value)
  }

  // Badge de estado
  const StatusBadge = () => {
    if (!showStatus || !visibleFields.includes('status')) return null
    
    const status = ensureString(pkg.status || pkg.status_display)
    const statusDisplay = ensureString(pkg.status_display || pkg.status)
    
    const statusColors = {
      'NO_RECEPTADO': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      'EN_BODEGA': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'EN_TRANSITO': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'ENTREGADO': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      'DEVUELTO': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'RETENIDO': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    }

    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[status] || statusColors['NO_RECEPTADO']}`}>
        {statusDisplay}
      </span>
    )
  }

  // Renderizado compacto (una línea)
  if (useCompact) {
    return (
      <div
        className={`flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all group ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-semibold text-gray-900 dark:text-white text-sm">
            {ensureString(pkg.guide_number)}
          </span>
          {visibleFields.includes('nro_master') && pkg.nro_master && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
              M:{ensureString(pkg.nro_master)}
            </span>
          )}
          {visibleFields.includes('name') && (
            <span className="text-gray-600 dark:text-gray-300 text-sm truncate">
              {ensureString(pkg.name) || 'Sin nombre'}
            </span>
          )}
          {(visibleFields.includes('city') || visibleFields.includes('province')) && (
            <span className="text-xs text-cyan-600 dark:text-cyan-400">
              ({ensureString(pkg.city)}{pkg.city && pkg.province ? ', ' : ''}{ensureString(pkg.province)})
            </span>
          )}
          <StatusBadge />
        </div>
        {showRemove && onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(pkg.id)
            }}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            title="Remover"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
        )}
      </div>
    )
  }

  // Renderizado en tarjeta (grid de campos)
  if (useCard) {
    // Obtener valor directo del paquete para la vista de tarjeta
    // Asegura que siempre retorne un string, nunca un objeto
    const getCardValue = (fieldId) => {
      switch (fieldId) {
        case 'guide_number':
          return ensureString(pkg.guide_number) || '-'
        case 'nro_master':
          const master = ensureString(pkg.nro_master)
          return master && master.toLowerCase() !== 'none' ? master : '-'
        case 'name':
          return ensureString(pkg.name) || 'Sin nombre'
        case 'address':
          return ensureString(pkg.address) || '-'
        case 'city':
          return ensureString(pkg.city) || '-'
        case 'province':
          const province = ensureString(pkg.province)
          return province && province.toUpperCase() !== 'N/D' ? province : '-'
        case 'phone_number':
          return ensureString(pkg.phone_number) || '-'
        case 'status':
        case 'status_display':
          return ensureString(pkg.status_display || pkg.status) || '-'
        case 'notes':
          return ensureString(pkg.notes) || '-'
        case 'hashtags':
          if (Array.isArray(pkg.hashtags)) {
            return pkg.hashtags.map(h => ensureString(h)).join(', ')
          }
          return ensureString(pkg.hashtags) || '-'
        case 'transport_agency_name':
          // Manejar transport_agency como objeto o string
          if (pkg.transport_agency && typeof pkg.transport_agency === 'object') {
            return ensureString(pkg.transport_agency.name) || '-'
          }
          return ensureString(pkg.effective_transport_agency || pkg.transport_agency_name) || '-'
        case 'pull_name':
          // Intentar primero con pull_info (estructura del API)
          if (pkg.pull_info && typeof pkg.pull_info === 'object') {
            return ensureString(pkg.pull_info.common_destiny) || `Saca-${ensureString(pkg.pull_info.id || '').substring(0, 8)}`
          }
          // Fallback a pull directo
          if (pkg.pull) {
            if (typeof pkg.pull === 'object') {
              return ensureString(pkg.pull.common_destiny) || `Saca-${ensureString(pkg.pull.id || '').substring(0, 8)}`
            }
            return `Saca-${ensureString(pkg.pull).substring(0, 8)}`
          }
          return '-'
        case 'created_at':
          return pkg.created_at ? new Date(pkg.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'
        default: {
          // Usar ensureString para cualquier otro campo
          return ensureString(pkg[fieldId]) || '-'
        }
      }
    }

    return (
      <div
        className={`p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all group ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900 dark:text-white">
              {ensureString(pkg.guide_number)}
            </span>
            <StatusBadge />
          </div>
          {showRemove && onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemove(pkg.id)
              }}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-60 group-hover:opacity-100 flex-shrink-0"
              title="Remover"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {/* Campos importantes que siempre se muestran en formato tarjeta */}
          {[
            'name',
            'city',
            'province',
            'transport_agency_name',
            'pull_name',
            'phone_number',
            'nro_master',
            'notes',
            'created_at',
            'hashtags',
            'address'
          ].map(fieldId => {
            const field = PACKAGE_DISPLAY_FIELDS[fieldId]
            if (!field) return null
            const value = getCardValue(fieldId)
            const isDate = fieldId === 'created_at'
            const isEmpty = !value || value === '-' || value === 'none' || value === 'N/A'
            
            return (
              <div key={fieldId} className="text-sm py-0.5">
                <span className="text-gray-500 dark:text-gray-400">{field.label}:</span>
                <span className={`ml-2 ${isDate && !isEmpty ? 'font-bold text-blue-600 dark:text-blue-400' : isEmpty ? 'text-gray-400 dark:text-gray-500 italic' : 'text-gray-900 dark:text-white font-medium'}`}>
                  {isDate && !isEmpty ? `📅 ${value}` : (isEmpty ? '-' : value)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Renderizado detallado (default)
  return (
    <div
      className={`flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all group ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 dark:text-white">
            {ensureString(pkg.guide_number)}
          </span>
          {visibleFields.includes('nro_master') && pkg.nro_master && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              Master: {ensureString(pkg.nro_master)}
            </span>
          )}
          <StatusBadge />
        </div>
        {visibleFields.includes('name') && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            <span className="text-gray-400 dark:text-gray-500">Destinatario:</span> {ensureString(pkg.name) || 'Sin nombre'}
          </p>
        )}
        {visibleFields.includes('address') && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            <i className="fas fa-map-marker-alt mr-1 text-gray-400"></i>
            {pkg.address ? ensureString(pkg.address) : <span className="text-gray-400 italic">-</span>}
          </p>
        )}
        {(visibleFields.includes('city') || visibleFields.includes('province')) && (
          <p className="text-xs mt-0.5">
            <span className="text-cyan-600 dark:text-cyan-400">
              <i className="fas fa-city mr-1"></i>
              {pkg.city || pkg.province ? (
                <>
                  {ensureString(pkg.city)}{pkg.city && pkg.province ? ', ' : ''}{ensureString(pkg.province)}
                </>
              ) : (
                <span className="text-gray-400 italic">-</span>
              )}
            </span>
          </p>
        )}
        {visibleFields.includes('phone_number') && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            <i className="fas fa-phone mr-1"></i>
            {pkg.phone_number ? ensureString(pkg.phone_number) : <span className="text-gray-400 italic">-</span>}
          </p>
        )}
        {visibleFields.includes('transport_agency_name') && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            <i className="fas fa-truck mr-1"></i>
            {pkg.transport_agency?.name || pkg.effective_transport_agency || pkg.transport_agency_name || <span className="text-gray-400 italic">-</span>}
          </p>
        )}
        {visibleFields.includes('pull_name') && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            <i className="fas fa-boxes mr-1"></i>
            {pkg.pull ? (
              typeof pkg.pull === 'object' ? (pkg.pull.common_destiny || `Saca-${ensureString(pkg.pull.id || '').substring(0, 8)}`) : `Saca-${ensureString(pkg.pull).substring(0, 8)}`
            ) : (
              <span className="text-gray-400 italic">-</span>
            )}
          </p>
        )}
        {visibleFields.includes('notes') && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            <i className="fas fa-sticky-note mr-1"></i>
            {pkg.notes ? ensureString(pkg.notes) : <span className="text-gray-400 italic">-</span>}
          </p>
        )}
        {visibleFields.includes('hashtags') && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            <i className="fas fa-hashtag mr-1"></i>
            {pkg.hashtags ? (
              Array.isArray(pkg.hashtags) ? pkg.hashtags.map(h => ensureString(h)).join(', ') : ensureString(pkg.hashtags)
            ) : (
              <span className="text-gray-400 italic">-</span>
            )}
          </p>
        )}
        {visibleFields.includes('created_at') && pkg.created_at && (
          <p className="text-xs mt-0.5">
            <span className="font-bold text-blue-600 dark:text-blue-400">
              📅 {new Date(pkg.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </p>
        )}
      </div>
      {showRemove && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(pkg.id)
          }}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-60 group-hover:opacity-100"
          title="Remover"
        >
          <i className="fas fa-times"></i>
        </button>
      )}
    </div>
  )
}

PackageListItem.propTypes = {
  package: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    guide_number: PropTypes.string.isRequired,
    nro_master: PropTypes.string,
    name: PropTypes.string,
    address: PropTypes.string,
    city: PropTypes.string,
    province: PropTypes.string,
    phone_number: PropTypes.string,
    status: PropTypes.string,
    status_display: PropTypes.string,
  }).isRequired,
  onRemove: PropTypes.func,
  onClick: PropTypes.func,
  showRemove: PropTypes.bool,
  showStatus: PropTypes.bool,
  compact: PropTypes.bool,
  className: PropTypes.string,
}

export default PackageListItem

