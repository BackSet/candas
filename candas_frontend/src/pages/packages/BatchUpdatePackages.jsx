import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import packagesService from '../../services/packagesService'
import transportAgenciesService from '../../services/transportAgenciesService'
import catalogService from '../../services/catalogService'
import { Card, Button, LoadingSpinner, ConfirmDialog, PackageList } from '../../components'

const BatchUpdatePackages = () => {
  const [searchCode, setSearchCode] = useState('')
  const [selectedPackages, setSelectedPackages] = useState([])
  const [attribute, setAttribute] = useState('')
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingAgencies, setLoadingAgencies] = useState(false)
  const [transportAgencies, setTransportAgencies] = useState([])
  const [deliveryAgencies, setDeliveryAgencies] = useState([])
  const [updateResults, setUpdateResults] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const searchInputRef = useRef(null)

  const STATUS_CHOICES = [
    { value: 'NO_RECEPTADO', label: 'No Receptado' },
    { value: 'EN_BODEGA', label: 'En Bodega' },
    { value: 'EN_TRANSITO', label: 'En Tránsito' },
    { value: 'ENTREGADO', label: 'Entregado' },
    { value: 'DEVUELTO', label: 'Devuelto' },
    { value: 'RETENIDO', label: 'Retenido' },
  ]

  useEffect(() => {
    loadAgencies()
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    if (attribute === 'transport_agency' || attribute === 'delivery_agency') {
      loadAgencies()
    }
  }, [attribute])

  const loadAgencies = async () => {
    try {
      setLoadingAgencies(true)
      const [transportData, deliveryData] = await Promise.all([
        transportAgenciesService.getActive(),
        catalogService.getDeliveryAgencies()
      ])
      setTransportAgencies(transportData.results || transportData || [])
      setDeliveryAgencies(deliveryData.results || deliveryData || [])
    } catch (error) {
      console.error('Error cargando agencias:', error)
      toast.error('Error al cargar las agencias')
    } finally {
      setLoadingAgencies(false)
    }
  }

  const handleSearch = async (e) => {
    if (e) {
      e.preventDefault()
    }

    if (!searchCode.trim()) {
      toast.warning('Ingrese un número de guía')
      return
    }

    try {
      setLoading(true)
      // Buscar paquete por número de guía
      const params = { search: searchCode.trim(), page_size: 1 }
      const data = await packagesService.list(params)
      const packages = data.results || []

      if (packages.length === 0) {
        toast.error('No se encontró ningún paquete con ese número de guía')
        setSearchCode('')
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
        return
      }

      const packageFound = packages[0]

      // Verificar si ya está en la lista
      if (selectedPackages.some(p => p.id === packageFound.id)) {
        toast.info('Este paquete ya está en la lista')
        setSearchCode('')
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
        return
      }

      // Agregar al inicio de la lista (para apilamiento - ultimo agregado arriba)
      setSelectedPackages([packageFound, ...selectedPackages])
      toast.success(`Paquete ${packageFound.guide_number} agregado a la cola`)
      setSearchCode('')
      
      // Re-enfocar para el siguiente escaneo
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 100)
    } catch (error) {
      console.error('Error buscando paquete:', error)
      toast.error('Error al buscar el paquete')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const removePackage = (packageId) => {
    setSelectedPackages(selectedPackages.filter(p => p.id !== packageId))
  }

  const clearQueue = () => {
    setSelectedPackages([])
    setUpdateResults(null)
  }

  const handleApplyChanges = async () => {
    if (!attribute) {
      toast.error('Seleccione un atributo a cambiar')
      return
    }

    if (attribute !== 'notes' && attribute !== 'hashtags' && !value) {
      toast.error('Ingrese un valor para el atributo')
      return
    }

    if (selectedPackages.length === 0) {
      toast.error('No hay paquetes en la cola')
      return
    }

    setShowConfirm(true)
  }

  const confirmUpdate = async () => {
    setShowConfirm(false)
    setLoading(true)
    setUpdateResults(null)

    try {
      const packageIds = selectedPackages.map(p => p.id)
      const result = await packagesService.batchUpdate(packageIds, attribute, value)

      setUpdateResults(result)

      if (result.success) {
        toast.success(`Se actualizaron ${result.updated} paquetes correctamente`)
        // Limpiar formulario
        setAttribute('')
        setValue('')
        setSelectedPackages([])
      } else {
        toast.warning(`Se actualizaron ${result.updated} paquetes, ${result.failed} fallaron`)
      }
    } catch (error) {
      console.error('Error actualizando paquetes:', error)
      toast.error(error.response?.data?.error || 'Error al actualizar los paquetes')
    } finally {
      setLoading(false)
    }
  }

  const renderValueInput = () => {
    if (!attribute) return null

    switch (attribute) {
      case 'status':
        return (
          <select
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          >
            <option value="">Seleccione un estado</option>
            {STATUS_CHOICES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        )

      case 'transport_agency':
        return (
          <select
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={loadingAgencies}
          >
            <option value="">Seleccione una agencia (o deje vacío para quitar)</option>
            {transportAgencies.map((agency) => (
              <option key={agency.id} value={agency.id}>
                {agency.name}
              </option>
            ))}
          </select>
        )

      case 'delivery_agency':
        return (
          <select
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={loadingAgencies}
          >
            <option value="">Seleccione una agencia (o deje vacío para quitar)</option>
            {deliveryAgencies.map((agency) => (
              <option key={agency.id} value={agency.id}>
                {agency.name} - {agency.location?.city || ''}
              </option>
            ))}
          </select>
        )

      case 'notes':
        return (
          <textarea
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={4}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ingrese las notas..."
          />
        )

      case 'hashtags':
        return (
          <input
            type="text"
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ej: #urgente #fragil #express"
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-edit text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Cambio de Parámetros en Lotes
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Busque paquetes por número de guía y actualice atributos en lote
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Búsqueda de paquetes */}
      <Card padding="default">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Buscar Paquete por Número de Guía
          </label>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-barcode text-gray-400"></i>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                className="w-full pl-10 pr-4 py-2.5 border-2 border-blue-400 dark:border-blue-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Escanear o ingresar número de guía..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              icon={<i className="fas fa-search"></i>}
              disabled={loading}
            >
              Buscar
            </Button>
          </form>
        </div>
      </Card>

      {/* Lista de paquetes en cola */}
      {selectedPackages.length > 0 && (
        <Card padding="default">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Paquetes en Cola
            </h2>
            <Button
              variant="danger"
              size="sm"
              icon={<i className="fas fa-trash"></i>}
              onClick={clearQueue}
            >
              Limpiar Cola
            </Button>
          </div>
          <PackageList
            packages={selectedPackages}
            onRemove={removePackage}
            title=""
            showConfig={true}
            showRemove={true}
            showStatus={true}
            maxHeight="320px"
          />
        </Card>
      )}

      {/* Formulario de cambio */}
      {selectedPackages.length > 0 && (
        <Card padding="default">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Cambiar Atributo
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Atributo a Cambiar
              </label>
              <select
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={attribute}
                onChange={(e) => {
                  setAttribute(e.target.value)
                  setValue('')
                }}
              >
                <option value="">Seleccione un atributo</option>
                <option value="status">Estado</option>
                <option value="transport_agency">Agencia de Transporte</option>
                <option value="delivery_agency">Agencia de Reparto</option>
                <option value="notes">Notas</option>
                <option value="hashtags">Hashtags</option>
              </select>
            </div>

            {attribute && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nuevo Valor
                </label>
                {renderValueInput()}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="primary"
                icon={<i className="fas fa-check"></i>}
                onClick={handleApplyChanges}
                disabled={loading || !attribute || (!value && attribute !== 'notes' && attribute !== 'hashtags')}
              >
                Aplicar Cambios a {selectedPackages.length} Paquete{selectedPackages.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Resultados */}
      {updateResults && (
        <Card padding="default">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Resultados de la Actualización
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {updateResults.updated}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Actualizados correctamente
                </div>
              </div>
              {updateResults.failed > 0 && (
                <div className="flex-1 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {updateResults.failed}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Fallaron
                  </div>
                </div>
              )}
            </div>

            {updateResults.errors && updateResults.errors.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Errores:
                </h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {updateResults.errors.map((error, index) => (
                    <div
                      key={index}
                      className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-400"
                    >
                      <span className="font-mono">{error.guide_number}</span>: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <ConfirmDialog
        show={showConfirm}
        title="Confirmar Actualización en Lote"
        message={`¿Está seguro de que desea cambiar el atributo "${attribute}" para ${selectedPackages.length} paquete${selectedPackages.length !== 1 ? 's' : ''}?`}
        confirmText="Aplicar Cambios"
        onConfirm={confirmUpdate}
        onCancel={() => setShowConfirm(false)}
        variant="primary"
      />
    </div>
  )
}

export default BatchUpdatePackages

