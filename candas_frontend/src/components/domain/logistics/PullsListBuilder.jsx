import { useState } from 'react'
import PropTypes from 'prop-types'
import { Card, Button, FormField } from '../../ui'
import { PackageSelector } from '../../domain/packages'

const PullsListBuilder = ({ pulls, onPullsChange }) => {
  const addPull = () => {
    const newPull = {
      id: Date.now().toString(),
      size: '',
      package_ids: [],
      packages: []
    }
    onPullsChange([...pulls, newPull])
  }

  const removePull = (pullId) => {
    onPullsChange(pulls.filter(p => p.id !== pullId))
  }

  const updatePull = (pullId, field, value) => {
    onPullsChange(
      pulls.map(p => 
        p.id === pullId ? { ...p, [field]: value } : p
      )
    )
  }

  const updatePullPackages = (pullId, packages) => {
    onPullsChange(
      pulls.map(p => 
        p.id === pullId 
          ? { ...p, packages, package_ids: packages.map(pkg => pkg.id) } 
          : p
      )
    )
  }

  // Obtener IDs de paquetes ya seleccionados en otras sacas
  const getExcludedPackageIds = (currentPullId) => {
    return pulls
      .filter(p => p.id !== currentPullId)
      .flatMap(p => p.package_ids)
  }

  return (
    <div className="space-y-4">
      {pulls.length === 0 && (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <i className="fas fa-box-open text-4xl text-gray-400 dark:text-gray-500 mb-3"></i>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No hay sacas configuradas aún
          </p>
          <Button
            type="button"
            variant="primary"
            onClick={addPull}
            icon={<i className="fas fa-plus"></i>}
          >
            Agregar Primera Saca
          </Button>
        </div>
      )}

      {pulls.map((pull, index) => (
        <Card 
          key={pull.id}
          header={
            <div className="flex items-center justify-between">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                Saca #{index + 1}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removePull(pull.id)}
                icon={<i className="fas fa-trash"></i>}
              >
                Eliminar
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <FormField
              label="Tamaño de la Saca"
              name={`size-${pull.id}`}
              type="select"
              value={pull.size}
              onChange={(e) => updatePull(pull.id, 'size', e.target.value)}
              required
              options={[
                { value: '', label: 'Selecciona un tamaño' },
                { value: 'PEQUENO', label: 'Pequeño' },
                { value: 'MEDIANO', label: 'Mediano' },
                { value: 'GRANDE', label: 'Grande' },
              ]}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Paquetes de esta Saca
              </label>
              <PackageSelector
                selectedPackages={pull.packages}
                onPackagesChange={(packages) => updatePullPackages(pull.id, packages)}
                filterAvailable={true}
                allowBarcode={true}
                allowDropdown={true}
                excludePackageIds={getExcludedPackageIds(pull.id)}
              />
              {pull.packages.length > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <i className="fas fa-box mr-1"></i>
                  {pull.packages.length} paquete(s) seleccionado(s)
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}

      {pulls.length > 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={addPull}
          icon={<i className="fas fa-plus"></i>}
          className="w-full"
        >
          Agregar Otra Saca
        </Button>
      )}

      {pulls.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start">
            <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 mt-0.5 mr-2"></i>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">Resumen:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{pulls.length} saca(s) configurada(s)</li>
                <li>
                  {pulls.reduce((sum, p) => sum + p.packages.length, 0)} paquete(s) total
                </li>
                <li>
                  {pulls.filter(p => !p.size).length === 0 
                    ? '✓ Todas las sacas tienen tamaño asignado'
                    : `⚠ ${pulls.filter(p => !p.size).length} saca(s) sin tamaño`
                  }
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

PullsListBuilder.propTypes = {
  pulls: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    size: PropTypes.string,
    package_ids: PropTypes.arrayOf(PropTypes.string),
    packages: PropTypes.array
  })).isRequired,
  onPullsChange: PropTypes.func.isRequired
}

export default PullsListBuilder
