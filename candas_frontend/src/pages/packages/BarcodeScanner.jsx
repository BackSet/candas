import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import packagesService from '../../services/packagesService'
import userPreferencesService from '../../services/userPreferencesService'
import { Card, Button, FormField, LoadingSpinner, FieldConfigModal } from '../../components'

const BarcodeScanner = () => {
  const [barcode, setBarcode] = useState('')
  const [currentPackage, setCurrentPackage] = useState(null)
  const [editedData, setEditedData] = useState({})
  const [config, setConfig] = useState({
    visible_fields: [],
    editable_fields: []
  })
  const [loading, setLoading] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const barcodeInputRef = useRef(null)

  const STATUS_CHOICES = [
    { value: 'NO_RECEPTADO', label: 'No Receptado' },
    { value: 'EN_BODEGA', label: 'En Bodega' },
    { value: 'EN_TRANSITO', label: 'En Transito' },
    { value: 'ENTREGADO', label: 'Entregado' },
    { value: 'DEVUELTO', label: 'Devuelto' },
    { value: 'RETENIDO', label: 'Retenido' },
  ]

  useEffect(() => {
    loadConfig()
  }, [])

  useEffect(() => {
    // Auto-focus en el input del codigo de barras
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [currentPackage])

  const loadConfig = async () => {
    try {
      const data = await userPreferencesService.getBarcodeConfig()
      setConfig(data.barcode_scan_config)
    } catch (error) {
      console.error('Error loading config:', error)
      // Config por defecto
      setConfig({
        visible_fields: ['guide_number', 'name', 'city', 'status', 'notes'],
        editable_fields: ['status', 'notes']
      })
    }
  }

  const saveConfig = async (newConfig) => {
    try {
      await userPreferencesService.updateBarcodeConfig(newConfig)
      setConfig(newConfig)
      toast.success('Configuracion guardada')
    } catch (error) {
      toast.error('Error al guardar configuracion')
      console.error(error)
    }
  }

  const searchPackage = async (code) => {
    if (!code.trim()) {
      toast.error('Ingresa un codigo de barras')
      return
    }

    // Guardar cambios del paquete anterior si hay
    if (hasUnsavedChanges && currentPackage) {
      await saveCurrentPackage()
    }

    setLoading(true)
    try {
      const response = await packagesService.searchByBarcode(code)
      setCurrentPackage(response)
      setEditedData({})
      setHasUnsavedChanges(false)
      setBarcode('')
      toast.success(`Paquete encontrado: ${response.guide_number}`)
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error(`Paquete no encontrado: ${code}`)
      } else {
        toast.error('Error al buscar paquete')
      }
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const saveCurrentPackage = async () => {
    if (!currentPackage || Object.keys(editedData).length === 0) {
      return
    }

    try {
      await packagesService.partialUpdate(currentPackage.id, editedData)
      toast.success('Cambios guardados automaticamente')
      setHasUnsavedChanges(false)
    } catch (error) {
      toast.error('Error al guardar cambios')
      console.error(error)
    }
  }

  const handleFieldChange = (fieldName, value) => {
    setEditedData({
      ...editedData,
      [fieldName]: value
    })
    setHasUnsavedChanges(true)
  }

  const handleBarcodeSubmit = (e) => {
    e.preventDefault()
    searchPackage(barcode)
  }

  const getFieldValue = (fieldName) => {
    if (editedData.hasOwnProperty(fieldName)) {
      return editedData[fieldName]
    }
    return currentPackage?.[fieldName] || ''
  }

  const isFieldEditable = (fieldName) => {
    return config.editable_fields.includes(fieldName)
  }

  const renderField = (fieldName) => {
    if (!config.visible_fields.includes(fieldName)) {
      return null
    }

    const labels = {
      guide_number: 'Numero de Guia',
      nro_master: 'Numero Master',
      name: 'Nombre Destinatario',
      address: 'Direccion',
      city: 'Ciudad',
      province: 'Provincia',
      phone_number: 'Telefono',
      status: 'Estado',
      notes: 'Notas',
      hashtags: 'Hashtags'
    }

    const editable = isFieldEditable(fieldName)
    const value = getFieldValue(fieldName)

    if (fieldName === 'status' && editable) {
      return (
        <div key={fieldName} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {labels[fieldName]}
          </label>
          <select
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {STATUS_CHOICES.map(choice => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        </div>
      )
    }

    if (fieldName === 'notes' && editable) {
      return (
        <div key={fieldName} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {labels[fieldName]}
          </label>
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      )
    }

    if (editable) {
      return (
        <FormField
          key={fieldName}
          label={labels[fieldName]}
          value={value}
          onChange={(e) => handleFieldChange(fieldName, e.target.value)}
        />
      )
    }

    // Campo solo lectura
    return (
      <div key={fieldName} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {labels[fieldName]}
        </label>
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white">
          {value || '-'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-barcode text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Búsqueda Rápida con Código de Barras
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Escanea o ingresa el código de barras del paquete
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowConfigModal(true)}
            >
              <i className="fas fa-cog mr-2"></i>
              Configurar Campos
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <form onSubmit={handleBarcodeSubmit} className="flex gap-4">
          <div className="flex-1">
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Escanea o ingresa el codigo de barras..."
              className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            loading={loading}
            icon={<i className="fas fa-search"></i>}
          >
            Buscar
          </Button>
        </form>
      </Card>

      {hasUnsavedChanges && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-amber-800 dark:text-amber-200">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            Hay cambios sin guardar. Se guardaran automaticamente al buscar otro paquete.
          </p>
        </div>
      )}

      {loading && <LoadingSpinner message="Buscando paquete..." />}

      {currentPackage && !loading && (
        <Card
          header={
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Paquete: {currentPackage.guide_number}
              </h2>
              <Button
                variant="secondary"
                onClick={saveCurrentPackage}
                disabled={!hasUnsavedChanges}
                icon={<i className="fas fa-save"></i>}
              >
                Guardar Ahora
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.visible_fields.map(field => renderField(field))}
          </div>
        </Card>
      )}

      <FieldConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        config={config}
        onSave={saveConfig}
      />
    </div>
  )
}

export default BarcodeScanner
