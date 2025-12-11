import { useState } from 'react'
import PropTypes from 'prop-types'
import { Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from 'flowbite-react'
import { LoadingSpinner, EmptyState } from '../feedback'

/**
 * Componente DataTable basado en Flowbite con búsqueda, filtros y paginación
 */
const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  error = null,
  searchValue = '',
  onSearch,
  searchPlaceholder = 'Search',
  filterOptions = [],
  onFilter,
  showCheckboxes = false,
  onRowSelect,
  selectedRows = [],
  onSelectAll,
  pagination = null,
  keyExtractor = (item, index) => item.id ?? index,
  emptyMessage = 'No hay datos disponibles',
  emptyTitle = 'Sin datos',
  emptyDescription = 'No se encontraron registros',
  onEmptyAction,
  emptyActionLabel,
  className = '',
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState(null)

  const handleFilterClick = (filter) => {
    setSelectedFilter(filter)
    setIsFilterOpen(false)
    if (onFilter) {
      onFilter(filter)
    }
  }

  const handleSearchChange = (e) => {
    if (onSearch) {
      onSearch(e.target.value)
    }
  }

  const handleCheckboxChange = (item, checked) => {
    if (onRowSelect) {
      onRowSelect(item, checked)
    }
  }

  const handleSelectAll = (checked) => {
    if (onSelectAll) {
      onSelectAll(checked, data)
    }
  }

  // Validar que data sea un array
  const safeData = Array.isArray(data) ? data : []

  const allSelected = showCheckboxes && safeData.length > 0 && selectedRows.length === safeData.length
  const someSelected = showCheckboxes && selectedRows.length > 0 && selectedRows.length < safeData.length

  if (loading) {
    return <LoadingSpinner message="Cargando datos..." />
  }

  if (error) {
    return (
      <div className="text-red-600 dark:text-red-400 p-4 text-center bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <i className="fas fa-exclamation-triangle mr-2"></i>
        {error.message ?? 'Error al cargar los datos'}
      </div>
    )
  }

  return (
    <div className={`relative overflow-x-auto bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Barra de búsqueda y filtros */}
      {(onSearch || filterOptions.length > 0) && (
        <div className="p-4 flex items-center justify-between space-x-4">
          {onSearch && (
            <label htmlFor="table-search" className="sr-only">Search</label>
          )}
          {onSearch && (
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/>
                </svg>
              </div>
              <input
                type="text"
                id="table-search"
                value={searchValue}
                onChange={handleSearchChange}
                className="block w-full max-w-96 ps-9 pe-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-400"
                placeholder={searchPlaceholder}
              />
            </div>
          )}

          {filterOptions.length > 0 && (
            <div className="relative">
              <button
                id="dropdownDefaultButton"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="shrink-0 inline-flex items-center justify-center text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 shadow-sm font-medium leading-5 rounded-lg text-sm px-3 py-2 focus:outline-none"
                type="button"
              >
                <svg className="w-4 h-4 me-1.5 -ms-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M18.796 4H5.204a1 1 0 0 0-.753 1.659l5.302 6.058a1 1 0 0 1 .247.659v4.874a.5.5 0 0 0 .2.4l3 2.25a.5.5 0 0 0 .8-.4v-7.124a1 1 0 0 1 .247-.659l5.302-6.059c.566-.646.106-1.658-.753-1.658Z"/>
                </svg>
                Filter by
                <svg className="w-4 h-4 ms-1.5 -me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7"/>
                </svg>
              </button>

              {/* Dropdown menu */}
              {isFilterOpen && (
                <div className="z-10 absolute right-0 mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg w-48">
                  <ul className="p-2 text-sm text-gray-700 dark:text-gray-300 font-medium" aria-labelledby="dropdownDefaultButton">
                    {filterOptions.map((option, index) => (
                      <li key={index}>
                        <button
                          onClick={() => handleFilterClick(option)}
                          className={`inline-flex items-center w-full p-2 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white rounded ${
                            selectedFilter?.value === option.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
                          }`}
                        >
                          {option.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tabla */}
      {safeData.length === 0 ? (
        <div className="p-8">
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
          />
        </div>
      ) : (
        <>
          <Table className="w-full text-sm text-left table-auto">
              <TableHead className="text-sm bg-gray-50 dark:bg-gray-700 border-b border-t border-gray-200 dark:border-gray-600">
              <TableRow>
                {showCheckboxes && (
                  <TableHeadCell className="p-4">
                    <div className="flex items-center">
                      <input
                        id="table-checkbox-all"
                        type="checkbox"
                        checked={allSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = someSelected && !allSelected
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                      />
                      <label htmlFor="table-checkbox-all" className="sr-only">Select all</label>
                    </div>
                  </TableHeadCell>
                )}
                {columns.map((column, index) => (
                  <TableHeadCell
                    key={column.key ?? column.accessor ?? index}
                    className={`px-6 py-3 font-medium text-gray-900 dark:text-gray-100 ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}`}
                  >
                    {column.header}
                  </TableHeadCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
              {safeData.map((item, index) => {
                const key = keyExtractor(item, index)
                const isSelected = selectedRows.some(row => keyExtractor(row, 0) === key)

                return (
                  <TableRow
                    key={key}
                    className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {showCheckboxes && (
                      <TableCell className="w-4 p-4">
                        <div className="flex items-center">
                          <input
                            id={`table-checkbox-${key}`}
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleCheckboxChange(item, e.target.checked)}
                            className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                          />
                          <label htmlFor={`table-checkbox-${key}`} className="sr-only">Table checkbox</label>
                        </div>
                      </TableCell>
                    )}
                    {columns.map((column, colIndex) => {
                      const cellKey = column.key ?? column.accessor ?? colIndex
                      const cellValue = column.cell
                        ? column.cell(item, index)
                        : column.accessor
                        ? item[column.accessor]
                        : null

                      return (
                        <TableCell
                          key={cellKey}
                          className={`px-6 py-4 break-words leading-relaxed ${
                            column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                          } ${column.maxWidth ? `max-w-${column.maxWidth}` : ''}`}
                        >
                          <div className="min-w-0 text-gray-900 dark:text-gray-100">
                            {cellValue}
                          </div>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Paginación */}
          {pagination && pagination.totalCount > 0 && pagination.totalPages > 0 && (() => {
            // Validar y corregir currentPage si está fuera de rango
            const validCurrentPage = Math.min(Math.max(1, pagination.currentPage), pagination.totalPages)
            const validTotalPages = Math.max(1, pagination.totalPages)
            
            // Calcular índices de visualización seguros
            const startIndex = ((validCurrentPage - 1) * pagination.pageSize) + 1
            const endIndex = Math.min(validCurrentPage * pagination.pageSize, pagination.totalCount)
            
            return (
              <nav className="flex items-center flex-column flex-wrap md:flex-row justify-between p-4" aria-label="Table navigation">
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 mb-4 md:mb-0 block w-full md:inline md:w-auto">
                  Showing <span className="font-semibold text-gray-900 dark:text-white">
                    {startIndex}
                  </span> to <span className="font-semibold text-gray-900 dark:text-white">
                    {endIndex}
                  </span> of <span className="font-semibold text-gray-900 dark:text-white">
                    {pagination.totalCount}
                  </span>
                </span>
                <ul className="flex -space-x-px text-sm">
                  <li>
                    <button
                      onClick={() => pagination.onPageChange(validCurrentPage - 1)}
                      disabled={validCurrentPage <= 1}
                      className="flex items-center justify-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white font-medium rounded-l-lg text-sm px-3 h-9 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                  </li>
                  {Array.from({ length: Math.min(5, validTotalPages) }, (_, i) => {
                    let pageNum
                    if (validTotalPages <= 5) {
                      pageNum = i + 1
                    } else if (validCurrentPage <= 3) {
                      pageNum = i + 1
                    } else if (validCurrentPage >= validTotalPages - 2) {
                      pageNum = validTotalPages - 4 + i
                    } else {
                      pageNum = validCurrentPage - 2 + i
                    }
                    
                    // Asegurar que pageNum esté en rango válido
                    if (pageNum < 1 || pageNum > validTotalPages) return null

                    return (
                      <li key={pageNum}>
                        <button
                          onClick={() => pagination.onPageChange(pageNum)}
                          disabled={pageNum < 1 || pageNum > validTotalPages}
                          aria-current={validCurrentPage === pageNum ? 'page' : undefined}
                          className={`flex items-center justify-center text-sm w-9 h-9 focus:outline-none ${
                            validCurrentPage === pageNum
                              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 font-medium'
                              : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white font-medium'
                          }`}
                        >
                          {pageNum}
                        </button>
                      </li>
                    )
                  })}
                  {validTotalPages > 5 && validCurrentPage < validTotalPages - 2 && (
                    <li>
                      <span className="flex items-center justify-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm w-9 h-9">
                        ...
                      </span>
                    </li>
                  )}
                  {validTotalPages > 5 && validCurrentPage < validTotalPages - 2 && (
                    <li>
                      <button
                        onClick={() => pagination.onPageChange(validTotalPages)}
                        className="flex items-center justify-center text-sm w-9 h-9 focus:outline-none text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white font-medium"
                      >
                        {validTotalPages}
                      </button>
                    </li>
                  )}
                  <li>
                    <button
                      onClick={() => pagination.onPageChange(validCurrentPage + 1)}
                      disabled={validCurrentPage >= validTotalPages}
                      className="flex items-center justify-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white font-medium rounded-r-lg text-sm px-3 h-9 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            )
          })()}
        </>
      )}
    </div>
  )
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      accessor: PropTypes.string,
      header: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
      cell: PropTypes.func,
      align: PropTypes.oneOf(['left', 'center', 'right']),
      maxWidth: PropTypes.string,
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.instanceOf(Error),
  searchValue: PropTypes.string,
  onSearch: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  filterOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  onFilter: PropTypes.func,
  showCheckboxes: PropTypes.bool,
  onRowSelect: PropTypes.func,
  selectedRows: PropTypes.array,
  onSelectAll: PropTypes.func,
  pagination: PropTypes.shape({
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    totalCount: PropTypes.number.isRequired,
    pageSize: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
  }),
  keyExtractor: PropTypes.func,
  emptyMessage: PropTypes.string,
  emptyTitle: PropTypes.string,
  emptyDescription: PropTypes.string,
  onEmptyAction: PropTypes.func,
  emptyActionLabel: PropTypes.string,
  className: PropTypes.string,
}

export default DataTable
