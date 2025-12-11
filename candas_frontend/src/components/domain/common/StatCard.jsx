const StatCard = ({ 
  icon, 
  value, 
  label, 
  color = 'blue',
  trend = null, // { value: number, direction: 'up' | 'down' }
  loading = false,
  onClick = null
}) => {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400',
    green: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700 text-green-600 dark:text-green-400',
    purple: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400',
    orange: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400',
    red: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400',
    indigo: 'from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400',
  }

  const bgClass = colorClasses[color] || colorClasses.blue

  return (
    <div
      className={`bg-gradient-to-br ${bgClass} rounded-lg border p-5 ${
        onClick ? 'cursor-pointer hover:shadow-lg transform hover:scale-[1.02] transition-all' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        {icon && (
          <div className="text-3xl">
            {typeof icon === 'string' ? <i className={`${icon} ${bgClass.split(' ').find(c => c.startsWith('text-'))}`}></i> : icon}
          </div>
        )}
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            <i className={`fas fa-arrow-${trend.direction}`}></i>
            <span>{trend.value}%</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {loading ? (
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        ) : (
          <div className={`text-3xl font-bold ${bgClass.split(' ').find(c => c.startsWith('text-'))}`}>
            {value !== null && value !== undefined ? value : '—'}
          </div>
        )}
        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {label}
        </div>
      </div>
    </div>
  )
}

export default StatCard
