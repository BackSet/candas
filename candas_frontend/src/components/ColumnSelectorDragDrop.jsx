import { useState } from 'react'
import { Card } from './ui'

const ColumnSelectorDragDrop = ({ availableFields, selectedColumns, onChange }) => {
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  // Obtener campos no seleccionados
  const unselectedFields = Object.keys(availableFields).filter(
    fieldId => !selectedColumns.includes(fieldId)
  )

  const handleSelectField = (fieldId) => {
    if (!selectedColumns.includes(fieldId)) {
      const newColumns = [...selectedColumns, fieldId]
      onChange(newColumns)
    }
  }

  const handleUnselectField = (fieldId) => {
    const newColumns = selectedColumns.filter(id => id !== fieldId)
    onChange(newColumns)
  }

  // Seleccionar todos
  const handleSelectAll = () => {
    onChange(Object.keys(availableFields))
  }

  // Deseleccionar todos
  const handleDeselectAll = () => {
    onChange([])
  }

  // Drag & Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.target.innerHTML)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (draggedItem !== null && draggedItem !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    setDragOverIndex(null)

    if (draggedItem === null || draggedItem === dropIndex) {
      return
    }

    const newColumns = [...selectedColumns]
    const draggedColumn = newColumns[draggedItem]
    
    // Remover el item arrastrado
    newColumns.splice(draggedItem, 1)
    
    // Insertar en la nueva posición
    newColumns.splice(dropIndex, 0, draggedColumn)
    
    onChange(newColumns)
    setDraggedItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverIndex(null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Campos Disponibles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Campos Disponibles
          </h3>
          {unselectedFields.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Seleccionar todos
            </button>
          )}
        </div>
        <Card className="!p-0 overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            {unselectedFields.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-green-600 dark:text-green-400 text-xl"></i>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Todos los campos están seleccionados
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {unselectedFields.map(fieldId => (
                  <label
                    key={fieldId}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors group"
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => handleSelectField(fieldId)}
                        className="w-5 h-5 text-blue-600 bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:ring-offset-0 transition-colors cursor-pointer"
                      />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {availableFields[fieldId]}
                    </span>
                    <i className="fas fa-plus ml-auto text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"></i>
                  </label>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Campos Seleccionados (Ordenables) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Columnas Seleccionadas
          </h3>
          {selectedColumns.length > 0 && (
            <button
              onClick={handleDeselectAll}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
            >
              Quitar todos
            </button>
          )}
        </div>
        <Card className="!p-0 overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            {selectedColumns.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <i className="fas fa-columns text-gray-400 dark:text-gray-500 text-xl"></i>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Selecciona campos de la izquierda
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                  Arrastra para ordenar
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {selectedColumns.map((fieldId, index) => (
                  <div
                    key={fieldId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 px-4 py-3 cursor-move transition-all group ${
                      draggedItem === index
                        ? 'opacity-50 bg-blue-100 dark:bg-blue-900/30'
                        : dragOverIndex === index
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    {/* Grip Icon */}
                    <div className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                      </svg>
                    </div>

                    {/* Order Number */}
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full text-xs font-bold shadow-sm">
                      {index + 1}
                    </span>

                    {/* Field Label */}
                    <span className="flex-grow text-sm text-gray-700 dark:text-gray-300">
                      {availableFields[fieldId]}
                    </span>

                    {/* Unselect Button */}
                    <button
                      type="button"
                      onClick={() => handleUnselectField(fieldId)}
                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all opacity-0 group-hover:opacity-100"
                      title="Quitar campo"
                    >
                      <i className="fas fa-times text-sm"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
        
        {selectedColumns.length > 0 && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <i className="fas fa-grip-vertical text-gray-400"></i>
            Arrastra para reordenar • {selectedColumns.length} {selectedColumns.length === 1 ? 'columna' : 'columnas'}
          </p>
        )}
      </div>
    </div>
  )
}

export default ColumnSelectorDragDrop
