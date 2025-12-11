import { useState } from 'react'
import { Button } from '../../ui'

const ExportButton = ({ 
  onExport, 
  formats = ['excel', 'pdf', 'csv'],
  loading = false 
}) => {
  const [showMenu, setShowMenu] = useState(false)

  const formatConfig = {
    excel: {
      icon: 'fa-file-excel',
      label: 'Excel',
      color: 'text-green-600 dark:text-green-400',
      description: '.xlsx'
    },
    pdf: {
      icon: 'fa-file-pdf',
      label: 'PDF',
      color: 'text-red-600 dark:text-red-400',
      description: '.pdf'
    },
    csv: {
      icon: 'fa-file-csv',
      label: 'CSV',
      color: 'text-blue-600 dark:text-blue-400',
      description: '.csv'
    }
  }

  const handleExport = (format) => {
    setShowMenu(false)
    onExport(format)
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
      >
        {loading ? (
          <>
            <i className="fas fa-spinner fa-spin mr-2"></i>
            Exportando...
          </>
        ) : (
          <>
            <i className="fas fa-file-export mr-2"></i>
            Exportar
            <i className="fas fa-chevron-down ml-2 text-xs"></i>
          </>
        )}
      </Button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-20">
            <div className="py-1">
              {formats.map(format => {
                const config = formatConfig[format]
                if (!config) return null
                
                return (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center gap-3 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700 rounded"
                  >
                    <i className={`fas ${config.icon} text-xl ${config.color}`}></i>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {config.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {config.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ExportButton
