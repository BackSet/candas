import { useState } from 'react'
import PropTypes from 'prop-types'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '../../ui'
import { PACKAGE_DISPLAY_FIELDS } from '../../../hooks/usePackageDisplayConfig'

/**
 * Modal para configurar qué campos mostrar en los paquetes
 */
const PackageDisplayConfigModal = ({
  show,
  onClose,
  visibleFields,
  dropdownFormat,
  listFormat,
  onSave,
}) => {
  const [localVisibleFields, setLocalVisibleFields] = useState(visibleFields)
  const [localDropdownFormat, setLocalDropdownFormat] = useState(dropdownFormat)
  const [localListFormat, setLocalListFormat] = useState(listFormat)

  const handleToggleField = (fieldId) => {
    const field = PACKAGE_DISPLAY_FIELDS[fieldId]
    
    // No permitir desmarcar campos obligatorios
    if (field?.alwaysShow && localVisibleFields.includes(fieldId)) {
      return
    }

    setLocalVisibleFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    )
  }

  const handleSave = () => {
    onSave({
      visibleFields: localVisibleFields,
      dropdownFormat: localDropdownFormat,
      listFormat: localListFormat,
    })
    onClose()
  }

  const handleReset = () => {
    const defaultFields = Object.entries(PACKAGE_DISPLAY_FIELDS)
      .filter(([_, field]) => field.default)
      .map(([key]) => key)
    
    setLocalVisibleFields(defaultFields)
    setLocalDropdownFormat('{guide_number} - {nro_master} - {name} ({city})')
    setLocalListFormat('detailed')
  }

  // Formatos predefinidos para el dropdown
  const dropdownPresets = [
    { label: 'Completo', value: '{guide_number} - {nro_master} - {name} ({city})' },
    { label: 'Básico', value: '{guide_number} - {name}' },
    { label: 'Con estado', value: '{guide_number} - {name} - {status}' },
    { label: 'Solo guía y ciudad', value: '{guide_number} ({city})' },
    { label: 'Guía y Fecha', value: '📅 {created_at} - {guide_number}' },
  ]

  return (
    <Modal show={show} onClose={onClose} size="3xl">
      <ModalHeader
        icon="fas fa-cog"
        iconGradient="from-purple-500 to-indigo-600"
        subtitle="Personaliza como se muestra la informacion de paquetes"
      >
        Configurar Visualizacion
      </ModalHeader>

      <ModalBody>
        <div className="space-y-8">
          {/* Campos visibles */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                Campos a Mostrar
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Selecciona los campos que deseas ver en la lista de paquetes
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(PACKAGE_DISPLAY_FIELDS).map(([fieldId, field]) => (
                <label
                  key={fieldId}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all min-h-[52px] ${
                    localVisibleFields.includes(fieldId)
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } ${field.alwaysShow ? 'opacity-75' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={localVisibleFields.includes(fieldId)}
                    onChange={() => handleToggleField(fieldId)}
                    disabled={field.alwaysShow}
                    className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 flex-shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate">
                      {field.label}
                    </span>
                    {field.alwaysShow && (
                      <span className="text-xs text-gray-400">(requerido)</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Formato del dropdown */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                Formato en Dropdown
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Define como se muestran los paquetes en el menu desplegable
            </p>
            
            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-4">
              {dropdownPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setLocalDropdownFormat(preset.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    localDropdownFormat === preset.value
                      ? 'bg-green-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Input personalizado */}
            <div className="relative">
              <input
                type="text"
                value={localDropdownFormat}
                onChange={(e) => setLocalDropdownFormat(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-green-500 transition-colors"
                placeholder="Ej: {guide_number} - {name}"
              />
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              <i className="fas fa-info-circle mr-1"></i>
              Usa {'{campo}'} para insertar valores dinamicos
            </p>
          </div>

          {/* Formato de la lista */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 bg-purple-500 rounded-full"></span>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                Estilo de Lista
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <label
                className={`flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  localListFormat === 'compact'
                    ? 'border-purple-500 bg-purple-500/10 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="listFormat"
                  value="compact"
                  checked={localListFormat === 'compact'}
                  onChange={(e) => setLocalListFormat(e.target.value)}
                  className="sr-only"
                />
                <i className="fas fa-bars text-2xl text-purple-500"></i>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Compacto</span>
                <span className="text-xs text-gray-500 text-center">Una sola linea</span>
              </label>

              <label
                className={`flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  localListFormat === 'detailed'
                    ? 'border-purple-500 bg-purple-500/10 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="listFormat"
                  value="detailed"
                  checked={localListFormat === 'detailed'}
                  onChange={(e) => setLocalListFormat(e.target.value)}
                  className="sr-only"
                />
                <i className="fas fa-th-list text-2xl text-purple-500"></i>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Detallado</span>
                <span className="text-xs text-gray-500 text-center">Multi-linea</span>
              </label>

              <label
                className={`flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  localListFormat === 'card'
                    ? 'border-purple-500 bg-purple-500/10 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="listFormat"
                  value="card"
                  checked={localListFormat === 'card'}
                  onChange={(e) => setLocalListFormat(e.target.value)}
                  className="sr-only"
                />
                <i className="fas fa-id-card text-2xl text-purple-500"></i>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tarjeta</span>
                <span className="text-xs text-gray-500 text-center">Vista expandida</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                Vista Previa
              </h3>
            </div>
            <div className="p-5 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              {localListFormat === 'compact' && (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-900 dark:text-white">ECA0905423774</span>
                  {localVisibleFields.includes('nro_master') && (
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">M:1</span>
                  )}
                  {localVisibleFields.includes('name') && (
                    <span className="text-sm text-gray-600 dark:text-gray-300">VERONICA RAMIREZ</span>
                  )}
                  {localVisibleFields.includes('city') && (
                    <span className="text-xs text-cyan-600 dark:text-cyan-400">(Guayas)</span>
                  )}
                  {localVisibleFields.includes('status') && (
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">En Bodega</span>
                  )}
                </div>
              )}
              {localListFormat === 'detailed' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white">ECA0905423774</span>
                    {localVisibleFields.includes('nro_master') && (
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">Master: 1</span>
                    )}
                    {localVisibleFields.includes('status') && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">En Bodega</span>
                    )}
                  </div>
                  {localVisibleFields.includes('name') && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="text-gray-400">Destinatario:</span> VERONICA RAMIREZ
                    </p>
                  )}
                  {localVisibleFields.includes('address') && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <i className="fas fa-map-marker-alt mr-1"></i>Av. Principal 123
                    </p>
                  )}
                  {(localVisibleFields.includes('city') || localVisibleFields.includes('province')) && (
                    <p className="text-xs text-cyan-600 dark:text-cyan-400">
                      <i className="fas fa-city mr-1"></i>
                      {localVisibleFields.includes('city') && 'Guayas'}
                      {localVisibleFields.includes('city') && localVisibleFields.includes('province') && ', '}
                      {localVisibleFields.includes('province') && 'Guayaquil'}
                    </p>
                  )}
                </div>
              )}
              {localListFormat === 'card' && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {localVisibleFields.map(fieldId => {
                    const field = PACKAGE_DISPLAY_FIELDS[fieldId]
                    if (!field) return null
                    const previewValues = {
                      guide_number: 'ECA0905423774',
                      nro_master: '1',
                      name: 'VERONICA RAMIREZ',
                      address: 'Av. Principal 123',
                      city: 'Guayas',
                      province: 'Guayaquil',
                      phone_number: '0991234567',
                      status: 'En Bodega',
                      status_display: 'En Bodega',
                      notes: 'Paquete fragil',
                      hashtags: '#urgente',
                      transport_agency_name: 'Servientrega',
                      pull_name: 'Saca-001',
                      created_at: '10/12/2025',
                    }
                    return (
                      <div key={fieldId} className="text-sm py-1">
                        <span className="text-gray-500 dark:text-gray-400">{field.label}:</span>
                        <span className="ml-2 text-gray-900 dark:text-white font-medium">
                          {previewValues[fieldId] || '-'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex justify-between w-full">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <i className="fas fa-undo mr-2"></i>
            Restaurar
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all"
            >
              Cancelar
            </button>
            <Button variant="primary" onClick={handleSave}>
              <i className="fas fa-check mr-2"></i>
              Guardar Configuración
            </Button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  )
}

PackageDisplayConfigModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  visibleFields: PropTypes.arrayOf(PropTypes.string).isRequired,
  dropdownFormat: PropTypes.string.isRequired,
  listFormat: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
}

export default PackageDisplayConfigModal

