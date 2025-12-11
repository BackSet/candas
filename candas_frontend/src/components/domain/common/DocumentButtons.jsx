import PropTypes from 'prop-types'
import { useState } from 'react'

/**
 * Componente reutilizable para botones de documentos (PDF, Excel, Etiquetas)
 */
const DocumentButtons = ({
  itemId,
  onPDF,
  onExcel,
  onLabel,
  onCustom,
  showPDF = true,
  showExcel = true,
  showLabel = true,
  customButtons = [],
  className = '',
}) => {
  const [loadingStates, setLoadingStates] = useState({})

  const setLoading = (key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }))
  }

  const handlePDF = async () => {
    if (!onPDF) return
    setLoading(`pdf_${itemId}`, true)
    try {
      await onPDF(itemId)
    } finally {
      setLoading(`pdf_${itemId}`, false)
    }
  }

  const handleExcel = async () => {
    if (!onExcel) return
    setLoading(`excel_${itemId}`, true)
    try {
      await onExcel(itemId)
    } finally {
      setLoading(`excel_${itemId}`, false)
    }
  }

  const handleLabel = async () => {
    if (!onLabel) return
    setLoading(`label_${itemId}`, true)
    try {
      await onLabel(itemId)
    } finally {
      setLoading(`label_${itemId}`, false)
    }
  }

  const isLoading = (key) => loadingStates[key] ?? false

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {showPDF && onPDF && (
        <button
          onClick={handlePDF}
          disabled={isLoading(`pdf_${itemId}`)}
          className="px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          title="Generar Manifiesto PDF"
        >
          {isLoading(`pdf_${itemId}`) ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-file-pdf"></i>
          )}
        </button>
      )}

      {showExcel && onExcel && (
        <button
          onClick={handleExcel}
          disabled={isLoading(`excel_${itemId}`)}
          className="px-3 py-2.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          title="Generar Manifiesto Excel"
        >
          {isLoading(`excel_${itemId}`) ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-file-excel"></i>
          )}
        </button>
      )}

      {showLabel && onLabel && (
        <button
          onClick={handleLabel}
          disabled={isLoading(`label_${itemId}`)}
          className="px-3 py-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          title="Generar Etiqueta"
        >
          {isLoading(`label_${itemId}`) ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-tag"></i>
          )}
        </button>
      )}

      {customButtons.map((button, index) => (
        <button
          key={index}
          onClick={() => button.onClick(itemId)}
          disabled={isLoading(`custom_${itemId}_${index}`) ?? button.disabled}
          className={`px-3 py-2.5 ${button.color ?? 'text-gray-700 dark:text-gray-300'} hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
          title={button.title}
        >
          {isLoading(`custom_${itemId}_${index}`) ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className={button.icon}></i>
          )}
        </button>
      ))}

      {onCustom && (
        <button
          onClick={() => onCustom(itemId)}
          className="px-3 py-2.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          title="Más opciones"
        >
          <i className="fas fa-ellipsis-v"></i>
        </button>
      )}
    </div>
  )
}

DocumentButtons.propTypes = {
  itemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onPDF: PropTypes.func,
  onExcel: PropTypes.func,
  onLabel: PropTypes.func,
  onCustom: PropTypes.func,
  showPDF: PropTypes.bool,
  showExcel: PropTypes.bool,
  showLabel: PropTypes.bool,
  customButtons: PropTypes.arrayOf(
    PropTypes.shape({
      onClick: PropTypes.func.isRequired,
      icon: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      color: PropTypes.string,
      disabled: PropTypes.bool,
    })
  ),
  className: PropTypes.string,
}

export default DocumentButtons

