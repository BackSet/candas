const EmptyState = ({
  icon = 'fa-inbox',
  title = 'No hay datos',
  message = 'No se encontraron elementos',
  action = null,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
        <i className={`fas ${icon} text-4xl text-gray-400 dark:text-gray-600`}></i>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-300 text-center max-w-md mb-6">
        {message}
      </p>
      {action && <div>{action}</div>}
    </div>
  )
}

export default EmptyState
