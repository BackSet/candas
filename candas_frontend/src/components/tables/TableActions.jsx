import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui'

/**
 * Componente reutilizable para acciones de tabla (Ver, Editar, Eliminar)
 */
const TableActions = ({
  itemId,
  onView,
  onEdit,
  onDelete,
  onCustom,
  viewPath,
  editPath,
  showView = true,
  showEdit = true,
  showDelete = true,
  customActions = [],
  size = 'sm',
  className = '',
}) => {
  const navigate = useNavigate()

  const handleView = () => {
    if (onView) {
      onView(itemId)
    } else if (viewPath) {
      navigate(viewPath.replace(':id', itemId))
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(itemId)
    } else if (editPath) {
      navigate(editPath.replace(':id', itemId))
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(itemId)
    }
  }

  return (
    <div className={`flex items-center justify-end gap-1.5 ${className}`}>
      {showView && (
        <button
          onClick={handleView}
          className="px-2.5 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
          title="Ver detalles"
        >
          <i className="fas fa-eye"></i>
        </button>
      )}

      {showEdit && (
        <button
          onClick={handleEdit}
          className="px-2.5 py-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
          title="Editar"
        >
          <i className="fas fa-edit"></i>
        </button>
      )}

      {customActions.map((action, index) => (
        <button
          key={index}
          onClick={() => action.onClick(itemId)}
          className={`px-2.5 py-2 ${action.color ?? 'text-gray-700 dark:text-gray-300'} hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800`}
          title={action.title}
          disabled={action.disabled}
        >
          <i className={action.icon}></i>
        </button>
      ))}

      {onCustom && (
        <button
          onClick={() => onCustom(itemId)}
          className="px-2.5 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
          title="Acción personalizada"
        >
          <i className="fas fa-ellipsis-v"></i>
        </button>
      )}

      {showDelete && (
        <button
          onClick={handleDelete}
          className="px-2.5 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
          title="Eliminar"
        >
          <i className="fas fa-trash"></i>
        </button>
      )}
    </div>
  )
}

TableActions.propTypes = {
  itemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onCustom: PropTypes.func,
  viewPath: PropTypes.string,
  editPath: PropTypes.string,
  showView: PropTypes.bool,
  showEdit: PropTypes.bool,
  showDelete: PropTypes.bool,
  customActions: PropTypes.arrayOf(
    PropTypes.shape({
      onClick: PropTypes.func.isRequired,
      icon: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      color: PropTypes.string,
      disabled: PropTypes.bool,
    })
  ),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
}

export default TableActions

