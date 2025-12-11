import { useState, useEffect } from 'react'
import { Card, Button } from '../../'

const ColumnMapper = ({ previewData, onMappingComplete, onCancel }) => {
  const [columnMapping, setColumnMapping] = useState({})
  const [usedFields, setUsedFields] = useState(new Set())
  const [orderedColumns, setOrderedColumns] = useState([])

  useEffect(() => {
    // Inicializar con el mapeo sugerido
    if (previewData.suggested_mapping) {
      setColumnMapping(previewData.suggested_mapping)
      setUsedFields(new Set(Object.values(previewData.suggested_mapping)))
    }
  }, [previewData])

  useEffect(() => {
    // Inicializar con orden original
    if (previewData.headers) {
      const initial = previewData.headers.map((header, idx) => ({
        originalIndex: idx,
        header: header,
        example: previewData.preview_rows[0]?.[idx] || ''
      }))
      setOrderedColumns(initial)
    }
  }, [previewData])

  const moveColumnUp = (currentIndex) => {
    if (currentIndex === 0) return
    const newOrder = [...orderedColumns]
    const temp = newOrder[currentIndex]
    newOrder[currentIndex] = newOrder[currentIndex - 1]
    newOrder[currentIndex - 1] = temp
    setOrderedColumns(newOrder)
  }

  const moveColumnDown = (currentIndex) => {
    if (currentIndex === orderedColumns.length - 1) return
    const newOrder = [...orderedColumns]
    const temp = newOrder[currentIndex]
    newOrder[currentIndex] = newOrder[currentIndex + 1]
    newOrder[currentIndex + 1] = temp
    setOrderedColumns(newOrder)
  }

  const handleMappingChange = (columnIndex, fieldId) => {
    const newMapping = { ...columnMapping }
    
    // Remover el campo anterior de usedFields si existía
    if (newMapping[columnIndex]) {
      const oldField = newMapping[columnIndex]
      const newUsedFields = new Set(usedFields)
      newUsedFields.delete(oldField)
      setUsedFields(newUsedFields)
    }
    
    // Actualizar mapeo
    if (fieldId === '') {
      delete newMapping[columnIndex]
    } else {
      newMapping[columnIndex] = fieldId
      setUsedFields(new Set([...usedFields, fieldId]))
    }
    
    setColumnMapping(newMapping)
  }

  const getFieldLabel = (fieldId) => {
    return previewData.available_fields[fieldId] || fieldId
  }

  const isRequiredField = (fieldId) => {
    const requiredFields = ['guide_number', 'name', 'address', 'phone_number', 'city', 'province']
    return requiredFields.includes(fieldId)
  }

  const validateMapping = () => {
    // Verificar que todos los campos obligatorios estén mapeados
    const requiredFields = ['guide_number', 'name', 'address', 'phone_number', 'city', 'province']
    const mappedFields = new Set(Object.values(columnMapping))
    
    const missingFields = requiredFields.filter(field => !mappedFields.has(field))
    return missingFields
  }

  const handleConfirm = () => {
    const missingFields = validateMapping()
    
    if (missingFields.length > 0) {
      const missingLabels = missingFields.map(f => getFieldLabel(f)).join(', ')
      alert(`Faltan campos obligatorios por mapear: ${missingLabels}`)
      return
    }
    
    // Crear mapeo con información de orden
    const orderedMapping = orderedColumns.reduce((acc, col, newIndex) => {
      if (columnMapping[col.originalIndex]) {
        acc[col.originalIndex] = {
          field: columnMapping[col.originalIndex],
          order: newIndex
        }
      }
      return acc
    }, {})
    
    onMappingComplete(columnMapping, orderedMapping)
  }

  // Agrupar campos disponibles
  const requiredFieldIds = ['guide_number', 'name', 'address', 'phone_number', 'city', 'province']
  const optionalFieldIds = Object.keys(previewData.available_fields || {}).filter(
    f => !requiredFieldIds.includes(f)
  )

  return (
    <Card className="mb-6">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              <i className="fas fa-columns mr-2"></i>
              Mapear Columnas del Archivo
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Asocia cada columna de tu archivo con un campo del sistema
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <i className="fas fa-times"></i>
          </Button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 mt-1"></i>
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">Mapeo Automático Detectado</p>
              <p>Hemos detectado automáticamente algunas columnas. Revisa y ajusta el mapeo según sea necesario.</p>
            </div>
          </div>
        </div>

        {/* Vista previa de datos */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Vista Previa de Datos del Archivo
          </h3>
          <div className="overflow-x-auto custom-scrollbar bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                  {previewData.headers.map((header, idx) => (
                    <th key={idx} className="px-4 py-3 text-left">
                      <div className="space-y-1">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-primary-600 text-white rounded-full text-xs font-bold mb-1">
                          {idx + 1}
                        </div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white">
                          {header}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.preview_rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-gray-100 dark:border-gray-800">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-2 text-gray-700 dark:text-gray-300 truncate max-w-xs">
                        {cell || <span className="text-gray-400 italic">vacío</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Banner de reordenamiento */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <i className="fas fa-arrows-alt-v text-yellow-600 dark:text-yellow-400 mt-1"></i>
            <div className="text-sm text-yellow-900 dark:text-yellow-100">
              <p className="font-medium mb-1">Puedes reordenar las columnas</p>
              <p>Usa los botones ▲ ▼ para cambiar el orden de procesamiento. El número grande muestra la posición actual después del reordenamiento.</p>
            </div>
          </div>
        </div>

        {/* Mapeo de columnas */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Configuración del Mapeo
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            Para cada columna del archivo (izquierda), selecciona el campo del sistema (derecha) donde se importarán los datos
          </p>
          <div className="space-y-3">
            {orderedColumns.map((column, displayIndex) => {
              const originalIdx = column.originalIndex
              return (
                <div
                  key={originalIdx}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all"
                >
                  {/* Número de posición actualizado */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-600 text-white rounded-lg flex items-center justify-center shadow-md">
                      <span className="text-base font-bold">
                        {displayIndex + 1}
                      </span>
                    </div>
                    <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
                      Col {originalIdx + 1}
                    </div>
                  </div>
                  
                  {/* Botones de reordenamiento */}
                  <div className="flex-shrink-0 flex flex-col gap-1">
                    <button
                      onClick={() => moveColumnUp(displayIndex)}
                      disabled={displayIndex === 0}
                      className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 
                               disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                      title="Mover arriba"
                    >
                      <i className="fas fa-chevron-up"></i>
                    </button>
                    <button
                      onClick={() => moveColumnDown(displayIndex)}
                      disabled={displayIndex === orderedColumns.length - 1}
                      className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 
                               disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                      title="Mover abajo"
                    >
                      <i className="fas fa-chevron-down"></i>
                    </button>
                  </div>

                  {/* Columna del archivo */}
                  <div className="flex-1 min-w-0 max-w-xs">
                    <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">
                        Columna del Archivo
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {column.header}
                      </div>
                      {column.example && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                          Ejemplo: {column.example}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Flecha de mapeo */}
                  <div className="flex-shrink-0 flex items-center">
                    <div className="flex flex-col items-center">
                      <i className="fas fa-long-arrow-alt-right text-2xl text-primary-500 dark:text-primary-400"></i>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">mapea a</span>
                    </div>
                  </div>

                  {/* Campo del sistema */}
                  <div className="flex-1 min-w-0 max-w-xs">
                    <div className="bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">
                        Campo del Sistema
                      </div>
                      <select
                        value={columnMapping[originalIdx] || ''}
                        onChange={(e) => handleMappingChange(originalIdx, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium
                                 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">-- No importar esta columna --</option>
                        
                        <optgroup label="━━━ Campos Obligatorios ━━━">
                          {requiredFieldIds.map(fieldId => {
                            const isUsed = usedFields.has(fieldId) && columnMapping[originalIdx] !== fieldId
                            return (
                              <option
                                key={fieldId}
                                value={fieldId}
                                disabled={isUsed}
                              >
                                {getFieldLabel(fieldId)} {isUsed ? '✓ Ya mapeado' : ''}
                              </option>
                            )
                          })}
                        </optgroup>
                        
                        {optionalFieldIds.length > 0 && (
                          <optgroup label="━━━ Campos Opcionales ━━━">
                            {optionalFieldIds.map(fieldId => {
                              const isUsed = usedFields.has(fieldId) && columnMapping[originalIdx] !== fieldId
                              return (
                                <option
                                  key={fieldId}
                                  value={fieldId}
                                  disabled={isUsed}
                                >
                                  {getFieldLabel(fieldId)} {isUsed ? '✓ Ya mapeado' : ''}
                                </option>
                              )
                            })}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Badge de estado */}
                  <div className="flex-shrink-0 w-24">
                    {columnMapping[originalIdx] && isRequiredField(columnMapping[originalIdx]) && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-sm">
                        <i className="fas fa-star mr-1"></i>
                        Requerido
                      </span>
                    )}
                    {columnMapping[originalIdx] && !isRequiredField(columnMapping[originalIdx]) && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        <i className="fas fa-check mr-1"></i>
                        Opcional
                      </span>
                    )}
                    {!columnMapping[originalIdx] && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        <i className="fas fa-minus mr-1"></i>
                        Sin mapear
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Resumen de mapeo */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <i className="fas fa-check-circle text-green-600 dark:text-green-400 mt-1"></i>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Resumen del Mapeo
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>
                  Columnas mapeadas: <strong>{Object.keys(columnMapping).length}</strong> de <strong>{previewData.headers.length}</strong>
                </p>
                <p>
                  Campos obligatorios mapeados: <strong>{requiredFieldIds.filter(f => Object.values(columnMapping).includes(f)).length}</strong> de <strong>6</strong>
                </p>
              </div>
            </div>
          </div>
          
          {validateMapping().length > 0 && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400 mt-1"></i>
                <div className="text-sm text-red-900 dark:text-red-100">
                  <p className="font-medium mb-1">Campos obligatorios faltantes:</p>
                  <p>{validateMapping().map(f => getFieldLabel(f)).join(', ')}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirm} className="flex-1">
            <i className="fas fa-check mr-2"></i>
            Confirmar y Continuar
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default ColumnMapper
