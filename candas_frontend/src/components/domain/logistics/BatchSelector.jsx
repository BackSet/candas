import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import Select from 'react-select'
import batchesService from '../../../services/batchesService'
import { getSelectStyles, getSelectTheme } from '../../../utils/selectStyles'

/**
 * Componente reutilizable para seleccionar lotes (batches)
 * Soporta selección múltiple desde dropdown con búsqueda
 */
const BatchSelector = ({
  selectedBatches,
  onBatchesChange,
  filterAvailable = true,
  label = 'Agregar Lotes',
  excludeBatchIds = [], // IDs de lotes a excluir
}) => {
  const [availableBatches, setAvailableBatches] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAvailableBatches()
  }, [filterAvailable, JSON.stringify(excludeBatchIds), JSON.stringify(selectedBatches.map(b => b.id))])

  const loadAvailableBatches = async () => {
    try {
      setLoading(true)
      const params = filterAvailable ? { available: true } : {}
      const data = await batchesService.list(params)
      
      let batches = data.results || data
      
      // Excluir lotes ya seleccionados
      const selectedIds = new Set(selectedBatches.map(b => b.id))
      batches = batches.filter(batch => !selectedIds.has(batch.id))
      
      // Excluir lotes por IDs si se proporcionan
      if (excludeBatchIds.length > 0) {
        const excludeSet = new Set(excludeBatchIds)
        batches = batches.filter(batch => !excludeSet.has(batch.id))
      }
      
      setAvailableBatches(batches)
    } catch (error) {
      console.error('Error al cargar lotes:', error)
      toast.error('Error al cargar lotes disponibles')
    } finally {
      setLoading(false)
    }
  }

  const handleDropdownChange = (selectedOptions) => {
    onBatchesChange(selectedOptions || [])
  }

  const handleRemoveBatch = (batchId) => {
    onBatchesChange(selectedBatches.filter((b) => b.id !== batchId))
  }

  // Filtro personalizado para react-select
  const customFilter = (option, searchText) => {
    if (!searchText) return true
    
    const search = searchText.toLowerCase()
    const batch = option.data
    
    return (
      batch.destiny?.toLowerCase().includes(search) ||
      batch.guide_number?.toLowerCase().includes(search) ||
      batch.transport_agency_name?.toLowerCase().includes(search)
    )
  }

  // Formato de label para las opciones
  const getOptionLabel = (batch) => {
    const pullsCount = batch.pulls_count || 0
    const packagesCount = batch.total_packages || 0
    
    // Formatear fecha si existe
    let dateStr = ''
    if (batch.created_at) {
      const date = new Date(batch.created_at)
      dateStr = `📅 ${date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} - `
    }
    
    return `${dateStr}${batch.destiny} - ${pullsCount} saca(s) - ${packagesCount} paq. ${batch.guide_number ? `- Guía: ${batch.guide_number}` : ''}`
  }

  // Formato con resaltado de fecha
  const formatOptionLabel = (option) => {
    // react-select puede pasar el objeto directamente o con estructura { label, value, data }
    let batch = option
    if (option && typeof option === 'object' && 'data' in option) {
      batch = option.data
    }
    
    // Si batch es null o undefined, usar getOptionLabel como fallback
    if (!batch) {
      return getOptionLabel(option || {})
    }
    
    const pullsCount = batch.pulls_count || 0
    const packagesCount = batch.total_packages || 0
    
    let dateStr = null
    if (batch.created_at) {
      const date = new Date(batch.created_at)
      const formattedDate = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
      dateStr = (
        <span className="font-bold text-blue-600 dark:text-blue-400 mr-1">
          📅 {formattedDate} -
        </span>
      )
    }
    
    return (
      <div>
        {dateStr}
        <span>{batch.destiny || 'Sin destino'}</span>
        <span> - {pullsCount} saca(s) - {packagesCount} paq. {batch.guide_number ? `- Guía: ${batch.guide_number}` : ''}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Dropdown con búsqueda múltiple */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
          {label}
        </label>
        <Select
          isMulti
          options={availableBatches}
          value={selectedBatches}
          onChange={handleDropdownChange}
          getOptionLabel={getOptionLabel}
          formatOptionLabel={formatOptionLabel}
          getOptionValue={(option) => option.id}
          placeholder="Buscar por destino, guía o agencia..."
          noOptionsMessage={() => 'No hay lotes disponibles'}
          loadingMessage={() => 'Cargando lotes...'}
          isLoading={loading}
          filterOption={customFilter}
          styles={getSelectStyles()}
          theme={getSelectTheme}
          className="react-select-container"
          classNamePrefix="react-select"
        />
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          <i className="fas fa-info-circle mr-1"></i>
          Usa Ctrl/Cmd + Click para seleccionar múltiples lotes
        </p>
      </div>

      {/* Lista de lotes seleccionados */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Lotes Seleccionados ({selectedBatches.length})
        </h3>
        {selectedBatches.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            No hay lotes agregados
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {selectedBatches.map((batch) => {
              const pullsCount = batch.pulls_count || 0
              const packagesCount = batch.total_packages || 0
              
              return (
                <div
                  key={batch.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {batch.destiny}
                    </p>
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-300 flex-wrap">
                      {batch.created_at && (
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          📅 {new Date(batch.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      )}
                      <span>Sacas: {pullsCount}</span>
                      <span>Paquetes: {packagesCount}</span>
                      {batch.guide_number && <span>Guía: {batch.guide_number}</span>}
                    </div>
                    {batch.transport_agency_name && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Agencia: {batch.transport_agency_name}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                    onClick={() => handleRemoveBatch(batch.id)}
                    title="Remover lote"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default BatchSelector
