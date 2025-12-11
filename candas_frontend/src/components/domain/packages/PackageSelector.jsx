import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import Select from 'react-select'
import packagesService from '../../../services/packagesService'
import { getSelectStyles, getSelectTheme } from '../../../utils/selectStyles'
import usePackageDisplayConfig from '../../../hooks/usePackageDisplayConfig'
import PackageDisplayConfigModal from './PackageDisplayConfigModal'
import PackageListItem from './PackageListItem'

/**
 * Componente reutilizable para seleccionar paquetes
 * Soporta selección múltiple desde dropdown con búsqueda y escaneo de códigos de barras
 */
const PackageSelector = ({
  selectedPackages,
  onPackagesChange,
  filterAvailable = true,
  allowBarcode = true,
  allowDropdown = true,
  label = 'Agregar Paquetes',
  showConfig = true,
  excludeWithParent = false, // Excluir paquetes que ya tienen padre
  excludePackageIds = [], // IDs de paquetes a excluir
}) => {
  const [availablePackages, setAvailablePackages] = useState([])
  const [loading, setLoading] = useState(false)
  const [scanCode, setScanCode] = useState('')
  const [showConfigModal, setShowConfigModal] = useState(false)

  const {
    visibleFields,
    dropdownFormat,
    listFormat,
    setVisibleFields,
    setDropdownFormat,
    setListFormat,
    formatDropdownLabel,
  } = usePackageDisplayConfig()

  useEffect(() => {
    if (allowDropdown) {
      loadAvailablePackages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowDropdown, filterAvailable, excludeWithParent, JSON.stringify(excludePackageIds)])

  const loadAvailablePackages = async () => {
    try {
      setLoading(true)
      const data = filterAvailable
        ? await packagesService.getAvailable()
        : await packagesService.list()
      
      let packages = data.results || data
      
      // Filtrar paquetes que ya tienen padre si excludeWithParent está activo
      if (excludeWithParent) {
        packages = packages.filter(pkg => !pkg.parent || pkg.parent === null)
      }
      
      // Excluir paquetes por IDs si se proporcionan
      if (excludePackageIds.length > 0) {
        const excludeSet = new Set(excludePackageIds)
        packages = packages.filter(pkg => !excludeSet.has(pkg.id))
      }
      
      setAvailablePackages(packages)
    } catch (error) {
      console.error('Error al cargar paquetes:', error)
      toast.error('Error al cargar paquetes disponibles')
    } finally {
      setLoading(false)
    }
  }

  const handleDropdownChange = async (selectedOptions) => {
    const options = selectedOptions || []
    const currentIds = new Set(selectedPackages.map(p => p.id))
    const newOptions = options.filter(opt => !currentIds.has(opt.id))
    
    // Si hay nuevos paquetes, obtener información completa para cada uno
    if (newOptions.length > 0) {
      const enrichedPackages = await Promise.all(
        newOptions.map(async (opt) => {
          // Si el paquete no tiene información completa, obtenerlo
          if (!opt.name && !opt.city && !opt.address) {
            try {
              return await packagesService.get(opt.id)
            } catch (error) {
              console.error(`Error al obtener detalles del paquete ${opt.id}:`, error)
              return opt // Retornar el paquete parcial si falla
            }
          }
          return opt
        })
      )
      
      // Nuevos paquetes van al inicio (arriba en la pila)
      const existing = options.filter(opt => currentIds.has(opt.id))
      onPackagesChange([...enrichedPackages.reverse(), ...existing])
    } else {
      // Solo se removieron paquetes, mantener el orden
      onPackagesChange(options)
    }
  }

  const handleScan = async (e) => {
    if (e.key === 'Enter' && scanCode.trim()) {
      e.preventDefault()
      const code = scanCode.trim()
      
      try {
        // Primero intentar buscar por código de barras (método específico que devuelve el paquete completo)
        let pkg = null
        try {
          pkg = await packagesService.searchByBarcode(code)
        } catch (barcodeError) {
          // Si no se encuentra por barcode, intentar con búsqueda general
          const data = await packagesService.list({ 
            search: code,
            status: 'EN_BODEGA'
          })
          
          const packages = data.results || data
          
          if (packages.length === 0) {
            toast.error(`Paquete ${code} no encontrado o no está disponible`)
            setScanCode('')
            return
          }
          
          pkg = packages.find(p => 
            p.guide_number === code || 
            p.nro_master === code ||
            p.agency_guide_number === code
          )
          
          if (!pkg) {
            pkg = packages[0]
          }
        }
        
        if (!pkg) {
          toast.error(`Paquete ${code} no encontrado o no está disponible`)
          setScanCode('')
          return
        }
        
        // Si el paquete no tiene todos los campos, obtenerlo completo
        if (!pkg.name && !pkg.city && !pkg.address) {
          try {
            pkg = await packagesService.get(pkg.id)
          } catch (getError) {
            console.error('Error al obtener detalles del paquete:', getError)
            // Continuar con el paquete parcial si falla
          }
        }
        
        if (filterAvailable && pkg.pull) {
          toast.error('El paquete ya está asignado a una saca')
          setScanCode('')
          return
        }
        
        if (selectedPackages.find((p) => p.id === pkg.id)) {
          toast.warning('Paquete ya agregado')
          setScanCode('')
          return
        }
        
        // Agregar al inicio (ultimo agregado arriba en la pila)
        onPackagesChange([pkg, ...selectedPackages])
        toast.success(`Paquete ${pkg.guide_number} agregado`)
        
      } catch (error) {
        console.error('Error al buscar paquete:', error)
        toast.error('Error al buscar el paquete')
      }
      
      setScanCode('')
    }
  }

  const handleRemovePackage = (packageId) => {
    onPackagesChange(selectedPackages.filter((p) => p.id !== packageId))
  }

  const handleSaveConfig = ({ visibleFields: newFields, dropdownFormat: newFormat, listFormat: newListFormat }) => {
    setVisibleFields(newFields)
    setDropdownFormat(newFormat)
    setListFormat(newListFormat)
    toast.success('Configuración guardada')
  }

  // Filtro personalizado para react-select
  const customFilter = (option, searchText) => {
    if (!searchText) return true
    
    const search = searchText.toLowerCase()
    const pkg = option.data
    
    return (
      pkg.guide_number?.toLowerCase().includes(search) ||
      pkg.name?.toLowerCase().includes(search) ||
      pkg.address?.toLowerCase().includes(search) ||
      pkg.city?.toLowerCase().includes(search) ||
      pkg.province?.toLowerCase().includes(search) ||
      pkg.nro_master?.toLowerCase().includes(search)
    )
  }

  return (
    <div className="space-y-4">
      {/* Dropdown con búsqueda múltiple */}
      {allowDropdown && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              {label}
            </label>
            {showConfig && (
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
                title="Configurar visualización"
              >
                <i className="fas fa-cog"></i>
                <span>Configurar</span>
              </button>
            )}
          </div>
          <Select
            isMulti
            options={availablePackages}
            value={selectedPackages}
            onChange={handleDropdownChange}
            getOptionLabel={(option) => formatDropdownLabel(option)}
            getOptionValue={(option) => option.id}
            placeholder="Buscar por guía, nombre, ciudad o dirección..."
            noOptionsMessage={() => 'No hay paquetes disponibles'}
            loadingMessage={() => 'Cargando paquetes...'}
            isLoading={loading}
            filterOption={customFilter}
            styles={getSelectStyles()}
            theme={getSelectTheme}
            className="react-select-container"
            classNamePrefix="react-select"
          />
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            <i className="fas fa-info-circle mr-1"></i>
            Usa Ctrl/Cmd + Click para seleccionar múltiples paquetes
          </p>
        </div>
      )}

      {/* Campo de escaneo de código de barras */}
      {allowBarcode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <i className="fas fa-barcode text-gray-400"></i>
            Escanear código de barras
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 text-lg border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={scanCode}
            onChange={(e) => setScanCode(e.target.value)}
            onKeyPress={handleScan}
            placeholder="Coloca el cursor aquí y escanea..."
            autoFocus={!allowDropdown}
          />
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            <i className="fas fa-keyboard mr-1"></i>
            Escanea el código de barras y presiona Enter
          </p>
        </div>
      )}

      {/* Lista de paquetes seleccionados */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            Paquetes Seleccionados
            <span className="ml-1 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
              {selectedPackages.length}
            </span>
          </h3>
          {showConfig && selectedPackages.length > 0 && (
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
            >
              <i className="fas fa-sliders-h"></i>
            </button>
          )}
        </div>
        {selectedPackages.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <i className="fas fa-box-open text-3xl text-gray-300 dark:text-gray-600 mb-2"></i>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No hay paquetes agregados
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              Usa el buscador o escanea un código
            </p>
          </div>
        ) : (
          <div className={`space-y-2 max-h-96 overflow-y-auto pr-1 ${
            listFormat === 'card' ? 'space-y-3' : ''
          }`}>
            {selectedPackages.map((pkg) => (
              <PackageListItem
                key={pkg.id}
                package={pkg}
                onRemove={handleRemovePackage}
                showRemove={true}
                showStatus={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de configuración */}
      <PackageDisplayConfigModal
        show={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        visibleFields={visibleFields}
        dropdownFormat={dropdownFormat}
        listFormat={listFormat}
        onSave={handleSaveConfig}
      />
    </div>
  )
}

export default PackageSelector
