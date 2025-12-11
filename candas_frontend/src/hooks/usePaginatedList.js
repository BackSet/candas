import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook personalizado para manejar listas paginadas
 * @param {Function} fetchFunction - Función que realiza la petición (debe retornar { results, count })
 * @param {Object} options - Opciones de configuración
 * @param {number} options.pageSize - Tamaño de página por defecto
 * @param {Array} options.dependencies - Dependencias para recargar la lista
 * @param {boolean} options.autoLoad - Si debe cargar automáticamente al montar
 * @returns {Object} Estado y funciones de la lista paginada
 */
export const usePaginatedList = (fetchFunction, options = {}) => {
  const {
    // PAGE_SIZE del backend Django es 50, debe coincidir
    pageSize = 50,
    dependencies = [],
    autoLoad = true,
  } = options

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  // Usar ref para evitar que loadData dependa de fetchFunction
  const fetchFunctionRef = useRef(fetchFunction)
  
  // Actualizar ref cuando cambie fetchFunction
  useEffect(() => {
    fetchFunctionRef.current = fetchFunction
  }, [fetchFunction])

  const loadData = useCallback(async (page = 1, params = {}, isRetry = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const requestParams = {
        page,
        page_size: pageSize,
        ...params,
      }
      
      const response = await fetchFunctionRef.current(requestParams)
      
      // Debug: Log de la respuesta para depuración
      console.log('usePaginatedList - Response recibida:', response)
      
      // Manejar diferentes formatos de respuesta usando destructuring mejorado
      // Django REST Framework retorna { results: [...], count: ... }
      let results = []
      let count = 0
      
      if (Array.isArray(response)) {
        // Si la respuesta es un array directo
        results = response
        count = response.length
      } else if (response && typeof response === 'object') {
        // Usar destructuring y optional chaining para extraer datos
        const { results: responseResults, count: responseCount, data: responseData } = response ?? {}
        
        // Intentar obtener results de diferentes ubicaciones
        const extractedResults = responseResults ?? responseData?.results ?? (Array.isArray(responseData) ? responseData : [])
        const extractedCount = responseCount ?? responseData?.count ?? response.count ?? extractedResults.length
        
        results = Array.isArray(extractedResults) ? extractedResults : []
        count = extractedCount ?? results.length
      }
      
      // Asegurar que results es un array
      if (!Array.isArray(results)) {
        console.warn('usePaginatedList - results no es un array:', results)
        results = []
        count = 0
      }
      
      console.log('usePaginatedList - Datos extraídos:', { results: results.length, count })
      
      // Calcular el nuevo total de páginas
      const newTotalPages = Math.ceil(count / pageSize)
      
      // Si la página solicitada está más allá del total de páginas disponibles
      // y hay datos disponibles, cargar la última página válida
      // Evitar bucles infinitos con isRetry
      if (!isRetry && page > newTotalPages && newTotalPages > 0) {
        return loadData(newTotalPages, params, true)
      }
      
      // Si la página está vacía pero hay datos en otras páginas, ir a la página 1
      if (!isRetry && results.length === 0 && count > 0 && page > 1) {
        return loadData(1, params, true)
      }
      
      setData(results)
      setTotalCount(count)
      setCurrentPage((page > newTotalPages && newTotalPages > 0) ? newTotalPages : page)
      
      // Scroll al inicio de la página
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      return { results, count }
    } catch (err) {
      // Si el error es por página inválida (404), intentar cargar la página 1
      const isInvalidPageError = 
        err.response?.status === 404 || 
        err.message?.toLowerCase().includes('invalid page') ||
        err.response?.data?.detail?.toLowerCase().includes('invalid page')
      
      if (!isRetry && isInvalidPageError && page > 1) {
        try {
          return await loadData(1, params, true)
        } catch {
          // Si falla de nuevo, propagar el error original
        }
      }
      
      setError(err)
      setData([])
      throw err
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  const handlePageChange = useCallback((newPage) => {
    loadData(newPage)
  }, [loadData])

  const refresh = useCallback(() => {
    loadData(currentPage)
  }, [loadData, currentPage])

  // Cargar datos automáticamente al montar o cuando cambien las dependencias
  // Usar JSON.stringify para comparar dependencias ya que son valores primitivos
  const dependenciesKey = JSON.stringify(dependencies)
  
  useEffect(() => {
    if (autoLoad) {
      loadData(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, loadData, dependenciesKey])

  const totalPages = Math.ceil(totalCount / pageSize)

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    loadData,
    handlePageChange,
    refresh,
    setData,
  }
}

export default usePaginatedList

