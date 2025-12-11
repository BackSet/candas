import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Card, Button, FormField } from '../ui'
import { PackageSelector, PackageList } from '../domain/packages'

const AutoDistributionConfig = ({ 
  selectedPackages, 
  onPackagesChange,
  pullsConfig,
  onPullsConfigChange,
  onDistributionPreview
}) => {
  const [preview, setPreview] = useState([])

  const addPullConfig = () => {
    const newConfig = {
      id: Date.now().toString(),
      size: '',
      max_packages: 10
    }
    onPullsConfigChange([...pullsConfig, newConfig])
  }

  const removePullConfig = (configId) => {
    onPullsConfigChange(pullsConfig.filter(c => c.id !== configId))
  }

  const updatePullConfig = (configId, field, value) => {
    onPullsConfigChange(
      pullsConfig.map(c => 
        c.id === configId ? { ...c, [field]: value } : c
      )
    )
  }

  // Calcular preview de distribución
  useEffect(() => {
    if (selectedPackages.length === 0 || pullsConfig.length === 0) {
      setPreview([])
      return
    }

    const distributionPreview = []
    let packageIndex = 0

    pullsConfig.forEach((config, index) => {
      if (packageIndex >= selectedPackages.length) return

      const packagesForPull = selectedPackages.slice(
        packageIndex,
        packageIndex + config.max_packages
      )

      distributionPreview.push({
        pullNumber: index + 1,
        size: config.size || 'Sin definir',
        packages: packagesForPull.length,
        packagesList: packagesForPull
      })

      packageIndex += packagesForPull.length
    })

    setPreview(distributionPreview)
    
    if (onDistributionPreview) {
      onDistributionPreview(distributionPreview)
    }
  }, [selectedPackages, pullsConfig, onDistributionPreview])

  const totalCapacity = pullsConfig.reduce(
    (sum, c) => sum + (Number.parseInt(c.max_packages, 10) ?? 0),
    0
  )
  const isCapacitySufficient = totalCapacity >= selectedPackages.length

  return (
    <div className="space-y-6">
      {/* Selector de Paquetes Global */}
      <Card header={
        <h3 className="text-md font-semibold text-gray-900 dark:text-white">
          Seleccionar Paquetes a Distribuir
        </h3>
      }>
        <PackageSelector
          selectedPackages={selectedPackages}
          onPackagesChange={onPackagesChange}
          filterAvailable={true}
          allowBarcode={true}
          allowDropdown={true}
        />
        {selectedPackages.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
            <p className="text-sm text-green-800 dark:text-green-200">
              <i className="fas fa-check-circle mr-2"></i>
              <strong>{selectedPackages.length}</strong> paquete(s) seleccionado(s) para distribuir
            </p>
          </div>
        )}
      </Card>

      {/* Configuración de Sacas */}
      <Card header={
        <h3 className="text-md font-semibold text-gray-900 dark:text-white">
          Configuración de Sacas
        </h3>
      }>
        <div className="space-y-4">
          {pullsConfig.length === 0 && (
            <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              <i className="fas fa-cog text-3xl text-gray-400 dark:text-gray-500 mb-3"></i>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Configura las sacas para distribución automática
              </p>
              <Button
                type="button"
                variant="primary"
                onClick={addPullConfig}
                icon={<i className="fas fa-plus"></i>}
              >
                Agregar Configuración de Saca
              </Button>
            </div>
          )}

          {pullsConfig.map((config, index) => (
            <div 
              key={config.id}
              className="p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Saca #{index + 1}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePullConfig(config.id)}
                  icon={<i className="fas fa-times"></i>}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  label="Tamaño"
                  name={`size-${config.id}`}
                  type="select"
                  value={config.size}
                  onChange={(e) => updatePullConfig(config.id, 'size', e.target.value)}
                  required
                  options={[
                    { value: '', label: 'Selecciona un tamaño' },
                    { value: 'PEQUENO', label: 'Pequeño' },
                    { value: 'MEDIANO', label: 'Mediano' },
                    { value: 'GRANDE', label: 'Grande' },
                  ]}
                />
                <FormField
                  label="Máximo de Paquetes"
                  name={`max-${config.id}`}
                  type="number"
                  value={config.max_packages}
                  onChange={(e) => updatePullConfig(config.id, 'max_packages', parseInt(e.target.value) || 0)}
                  min="1"
                  required
                />
              </div>
            </div>
          ))}

          {pullsConfig.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={addPullConfig}
              icon={<i className="fas fa-plus"></i>}
              className="w-full"
            >
              Agregar Otra Configuración
            </Button>
          )}
        </div>

        {/* Información de Capacidad */}
        {pullsConfig.length > 0 && (
          <div className={`mt-4 p-4 border rounded-lg ${
            isCapacitySufficient 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          }`}>
            <p className={`text-sm ${
              isCapacitySufficient
                ? 'text-green-800 dark:text-green-200'
                : 'text-yellow-800 dark:text-yellow-200'
            }`}>
              <i className={`fas ${isCapacitySufficient ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-2`}></i>
              <strong>Capacidad Total:</strong> {totalCapacity} paquete(s)
              {selectedPackages.length > 0 && (
                <span className="ml-2">
                  / {selectedPackages.length} paquete(s) a distribuir
                </span>
              )}
            </p>
            {!isCapacitySufficient && selectedPackages.length > 0 && (
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                ⚠ Necesitas {selectedPackages.length - totalCapacity} espacio(s) más
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Preview de Distribución */}
      {preview.length > 0 && (
        <Card header={
          <h3 className="text-md font-semibold text-gray-900 dark:text-white">
            <i className="fas fa-eye mr-2"></i>
            Preview de Distribución
          </h3>
        }>
          <div className="space-y-3">
            {preview.map((pullPreview) => (
              <div 
                key={pullPreview.pullNumber}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Saca #{pullPreview.pullNumber}
                  </h4>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                    {pullPreview.size}
                  </span>
                </div>
                {pullPreview.packagesList.length > 0 && (
                  <PackageList
                    packages={pullPreview.packagesList}
                    title=""
                    showRemove={false}
                    showConfig={false}
                    showCount={false}
                    maxHeight="200px"
                  />
                )}
              </div>
            ))}

            {selectedPackages.length > preview.reduce((sum, p) => sum + p.packages, 0) && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <i className="fas fa-exclamation-circle mr-2"></i>
                  {selectedPackages.length - preview.reduce((sum, p) => sum + p.packages, 0)} paquete(s) 
                  no serán distribuidos (capacidad insuficiente)
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

AutoDistributionConfig.propTypes = {
  selectedPackages: PropTypes.array.isRequired,
  onPackagesChange: PropTypes.func.isRequired,
  pullsConfig: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    size: PropTypes.string,
    max_packages: PropTypes.number
  })).isRequired,
  onPullsConfigChange: PropTypes.func.isRequired,
  onDistributionPreview: PropTypes.func
}

export default AutoDistributionConfig
