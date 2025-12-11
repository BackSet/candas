import { useState, useEffect } from 'react'
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from '../ui'

const FieldConfigModal = ({ isOpen, onClose, config, onSave }) => {
  const [visibleFields, setVisibleFields] = useState(config.visible_fields || [])
  const [editableFields, setEditableFields] = useState(config.editable_fields || [])

  useEffect(() => {
    setVisibleFields(config.visible_fields || [])
    setEditableFields(config.editable_fields || [])
  }, [config])

  const availableFields = [
    { id: 'guide_number', label: 'Número de Guía', alwaysVisible: true },
    { id: 'nro_master', label: 'Número Master' },
    { id: 'name', label: 'Nombre Destinatario' },
    { id: 'address', label: 'Dirección' },
    { id: 'city', label: 'Ciudad' },
    { id: 'province', label: 'Provincia' },
    { id: 'phone_number', label: 'Teléfono' },
    { id: 'status', label: 'Estado' },
    { id: 'notes', label: 'Notas' },
    { id: 'hashtags', label: 'Hashtags' },
  ]

  const handleSave = () => {
    onSave({ visible_fields: visibleFields, editable_fields: editableFields })
    onClose()
  }

  return (
    <Modal show={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        icon="fas fa-sliders-h"
        iconGradient="from-purple-500 to-indigo-600"
        subtitle="Personaliza qué campos ver y editar"
      >
        Configurar Campos
      </ModalHeader>

      <ModalBody>
        <div className="space-y-6">
          {/* Campos Visibles */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Campos Visibles</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {availableFields.map(field => (
                <label
                  key={field.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    visibleFields.includes(field.id) || field.alwaysVisible
                      ? 'border-blue-500/50 bg-blue-500/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } ${field.alwaysVisible ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={visibleFields.includes(field.id) || field.alwaysVisible}
                    disabled={field.alwaysVisible}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setVisibleFields([...visibleFields, field.id])
                      } else {
                        setVisibleFields(visibleFields.filter(f => f !== field.id))
                        setEditableFields(editableFields.filter(f => f !== field.id))
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
                  {field.alwaysVisible && (
                    <span className="ml-auto text-xs text-gray-400">(requerido)</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Campos Editables */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Campos Editables</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {availableFields
                .filter(f => !f.alwaysVisible && visibleFields.includes(f.id))
                .map(field => (
                  <label
                    key={field.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      editableFields.includes(field.id)
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={editableFields.includes(field.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditableFields([...editableFields, field.id])
                        } else {
                          setEditableFields(editableFields.filter(f => f !== field.id))
                        }
                      }}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
                  </label>
                ))}
            </div>
            {visibleFields.filter(f => !availableFields.find(af => af.id === f)?.alwaysVisible).length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center py-4">
                Selecciona campos visibles primero para poder editarlos
              </p>
            )}
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex justify-end w-full">
          <Button variant="primary" onClick={handleSave}>
            <i className="fas fa-check mr-2"></i>
            Guardar Configuración
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

export default FieldConfigModal
