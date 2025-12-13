import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import Select from 'react-select'
import pullsService from '../../../services/pullsService'
import { getSelectStyles, getSelectTheme } from '../../../utils/selectStyles'

/**
 * Componente reutilizable para seleccionar sacas (pulls)
 * Soporta selección múltiple desde dropdown con búsqueda
 */
const PullSelector = ({
  selectedPulls,
  onPullsChange,
  filterAvailable = true,
  label = 'Agregar Sacas',
  excludePullIds = [], // IDs de sacas a excluir
}) => {
  const [availablePulls, setAvailablePulls] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAvailablePulls()
  }, [filterAvailable, JSON.stringify(excludePullIds), JSON.stringify(selectedPulls.map(p => p.id))])

  const loadAvailablePulls = async () => {
    try {
      setLoading(true)
      const params = filterAvailable ? { available: true } : {}
      const data = await pullsService.list(params)
      
      let pulls = data.results || data
      
      // Filtrar solo sacas que NO tienen batch asociado (sacas individuales)
      // El batch puede venir como ID (string) o como objeto, o null/undefined
      pulls = pulls.filter(pull => {
        const batchValue = pull.batch
        // Si es null, undefined, o string vacío, no tiene batch
        if (!batchValue || batchValue === null || batchValue === '') {
          return true
        }
        // Si es un objeto, verificar que no tenga id válido
        if (typeof batchValue === 'object' && !batchValue.id) {
          return true
        }
        // Si tiene batch, excluir
        return false
      })
      
      // Excluir sacas ya seleccionadas
      const selectedIds = new Set(selectedPulls.map(p => p.id))
      pulls = pulls.filter(pull => !selectedIds.has(pull.id))
      
      // Excluir sacas por IDs si se proporcionan
      if (excludePullIds.length > 0) {
        const excludeSet = new Set(excludePullIds)
        pulls = pulls.filter(pull => !excludeSet.has(pull.id))
      }
      
      setAvailablePulls(pulls)
    } catch (error) {
      console.error('Error al cargar sacas:', error)
      toast.error('Error al cargar sacas disponibles')
    } finally {
      setLoading(false)
    }
  }

  const handleDropdownChange = (selectedOptions) => {
    onPullsChange(selectedOptions || [])
  }

  const handleRemovePull = (pullId) => {
    onPullsChange(selectedPulls.filter((p) => p.id !== pullId))
  }

  // Filtro personalizado para react-select
  const customFilter = (option, searchText) => {
    if (!searchText) return true
    
    const search = searchText.toLowerCase()
    const pull = option.data
    
    return (
      pull.common_destiny?.toLowerCase().includes(search) ||
      pull.guide_number?.toLowerCase().includes(search) ||
      pull.size?.toLowerCase().includes(search)
    )
  }

  // Formato de label para las opciones
  const getOptionLabel = (pull) => {
    const packagesCount = pull.packages_count || pull.packages?.length || 0
    const size = pull.size === 'PEQUENO' ? 'Pequeña' : 
                 pull.size === 'MEDIANO' ? 'Mediana' : 
                 pull.size === 'GRANDE' ? 'Grande' : pull.size
    
    // Formatear fecha si existe
    let dateStr = ''
    if (pull.created_at) {
      const date = new Date(pull.created_at)
      dateStr = `📅 ${date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} - `
    }
    
    return `${dateStr}${pull.common_destiny} - ${size} (${packagesCount} paq.) ${pull.guide_number ? `- Guía: ${pull.guide_number}` : ''}`
  }

  // Formato con resaltado de fecha
  const formatOptionLabel = (option) => {
    // react-select puede pasar el objeto directamente o con estructura { label, value, data }
    let pull = option
    if (option && typeof option === 'object' && 'data' in option) {
      pull = option.data
    }
    
    // Si pull es null o undefined, usar getOptionLabel como fallback
    if (!pull) {
      return getOptionLabel(option || {})
    }
    
    const packagesCount = pull.packages_count || pull.packages?.length || 0
    const size = pull.size === 'PEQUENO' ? 'Pequeña' : 
                 pull.size === 'MEDIANO' ? 'Mediana' : 
                 pull.size === 'GRANDE' ? 'Grande' : pull.size
    
    let dateStr = null
    if (pull.created_at) {
      const date = new Date(pull.created_at)
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
        <span>{pull.common_destiny || 'Sin destino'}</span>
        <span> - {size} ({packagesCount} paq.) {pull.guide_number ? `- Guía: ${pull.guide_number}` : ''}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Dropdown con búsqueda múltiple */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
          {label}
        </label>
        <Select
          isMulti
          options={availablePulls}
          value={selectedPulls}
          onChange={handleDropdownChange}
          getOptionLabel={getOptionLabel}
          formatOptionLabel={formatOptionLabel}
          getOptionValue={(option) => option.id}
          placeholder="Buscar por destino, guía o tamaño..."
          noOptionsMessage={() => 'No hay sacas disponibles'}
          loadingMessage={() => 'Cargando sacas...'}
          isLoading={loading}
          filterOption={customFilter}
          styles={getSelectStyles()}
          theme={getSelectTheme}
          className="react-select-container"
          classNamePrefix="react-select"
        />
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          <i className="fas fa-info-circle mr-1"></i>
          Usa Ctrl/Cmd + Click para seleccionar múltiples sacas
        </p>
      </div>

      {/* Lista de sacas seleccionadas */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Sacas Seleccionadas ({selectedPulls.length})
        </h3>
        {selectedPulls.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            No hay sacas agregadas
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {selectedPulls.map((pull) => {
              const packagesCount = pull.packages_count || pull.packages?.length || 0
              const sizeDisplay = pull.size === 'PEQUENO' ? 'Pequeña' : 
                                 pull.size === 'MEDIANO' ? 'Mediana' : 
                                 pull.size === 'GRANDE' ? 'Grande' : pull.size
              
              return (
                <div
                  key={pull.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {pull.common_destiny}
                    </p>
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-300 flex-wrap">
                      {pull.created_at && (
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          📅 {new Date(pull.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      )}
                      <span>Tamaño: {sizeDisplay}</span>
                      <span>Paquetes: {packagesCount}</span>
                      {pull.guide_number && <span>Guía: {pull.guide_number}</span>}
                    </div>
                    {pull.transport_agency_name && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Agencia: {pull.transport_agency_name}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                    onClick={() => handleRemovePull(pull.id)}
                    title="Remover saca"
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

export default PullSelector
