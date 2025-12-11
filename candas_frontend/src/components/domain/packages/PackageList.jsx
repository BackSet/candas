import { useState } from 'react'
import PropTypes from 'prop-types'
import usePackageDisplayConfig from '../../../hooks/usePackageDisplayConfig'
import PackageListItem from './PackageListItem'
import PackageDisplayConfigModal from './PackageDisplayConfigModal'

/**
 * Componente para mostrar una lista de paquetes con configuracion de visualizacion
 */
const PackageList = ({
  packages = [],
  onRemove,
  onItemClick,
  title = 'Paquetes',
  showConfig = true,
  showRemove = true,
  showStatus = true,
  showCount = true,
  emptyMessage = 'No hay paquetes',
  emptySubMessage = 'Agrega paquetes para verlos aqui',
  maxHeight = '400px',
  className = '',
  stacked = true, // Apilamiento activado por defecto
}) => {
  const [showConfigModal, setShowConfigModal] = useState(false)
  const {
    visibleFields,
    dropdownFormat,
    listFormat,
    setVisibleFields,
    setDropdownFormat,
    setListFormat,
  } = usePackageDisplayConfig()

  const handleSaveConfig = ({ visibleFields: newFields, dropdownFormat: newFormat, listFormat: newListFormat }) => {
    setVisibleFields(newFields)
    setDropdownFormat(newFormat)
    setListFormat(newListFormat)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      {(title || showConfig) && (
        <div className="flex items-center justify-between">
          {title && (
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              {title}
              {showCount && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                  {packages.length}
                </span>
              )}
            </h3>
          )}
          {showConfig && (
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Configurar visualizacion"
            >
              <i className="fas fa-sliders-h"></i>
              <span>Configurar</span>
            </button>
          )}
        </div>
      )}

      {/* Lista vacia */}
      {packages.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <i className="fas fa-box-open text-4xl text-gray-300 dark:text-gray-600 mb-3"></i>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {emptyMessage}
          </p>
          {emptySubMessage && (
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              {emptySubMessage}
            </p>
          )}
        </div>
      ) : (
        /* Lista de paquetes con efecto de apilamiento */
        <div
          className={`overflow-y-auto pr-1 ${stacked && packages.length > 1 ? 'relative' : `space-y-2 ${listFormat === 'card' ? 'space-y-3' : ''}`}`}
          style={{ maxHeight }}
        >
          {stacked && packages.length > 1 ? (
            /* Vista apilada - todos en la misma columna con mismo ancho */
            <div className="space-y-2">
              {packages.map((pkg, index) => {
                // El indice 0 es el ultimo agregado y debe estar arriba
                const opacity = index === 0 ? 1 : Math.max(0.75, 0.95 - (index * 0.08)) // Opacidad decreciente
                
                return (
                  <div
                    key={pkg?.id ?? index}
                    className="transition-all duration-300 ease-out hover:translate-y-[-2px] hover:shadow-xl cursor-pointer hover:opacity-100"
                    style={{ opacity }}
                  >
                    <PackageListItem
                      package={pkg}
                      onRemove={onRemove}
                      onClick={onItemClick ? () => onItemClick(pkg) : undefined}
                      showRemove={showRemove}
                      showStatus={showStatus}
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            /* Vista normal sin apilamiento */
            <div className={`space-y-2 ${listFormat === 'card' ? 'space-y-3' : ''}`}>
              {packages.map((pkg, index) => (
                <PackageListItem
                  key={pkg?.id ?? index}
                  package={pkg}
                  onRemove={onRemove}
                  onClick={onItemClick ? () => onItemClick(pkg) : undefined}
                  showRemove={showRemove}
                  showStatus={showStatus}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de configuracion */}
      <PackageDisplayConfigModal
        show={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        visibleFields={visibleFields}
        dropdownFormat={dropdownFormat}
        listFormat={listFormat}
        onSave={handleSaveConfig}
      />
    </div>
  )
}

PackageList.propTypes = {
  packages: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    guide_number: PropTypes.string.isRequired,
  })),
  onRemove: PropTypes.func,
  onItemClick: PropTypes.func,
  title: PropTypes.string,
  showConfig: PropTypes.bool,
  showRemove: PropTypes.bool,
  showStatus: PropTypes.bool,
  showCount: PropTypes.bool,
  emptyMessage: PropTypes.string,
  emptySubMessage: PropTypes.string,
  maxHeight: PropTypes.string,
  className: PropTypes.string,
  stacked: PropTypes.bool,
}

export default PackageList

