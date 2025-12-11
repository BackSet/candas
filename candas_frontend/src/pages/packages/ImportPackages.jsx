import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, Button, LoadingSpinner, ImportHistory, ColumnMapper } from '../../components'
import { packagesService } from '../../services/packagesService'

// Campos obligatorios (siempre incluidos)
const mandatoryFields = [
  { id: 'guide_number', label: 'Guía', description: 'Número de guía del paquete', mandatory: true },
  { id: 'name', label: 'Nombre', description: 'Nombre del destinatario', mandatory: true },
  { id: 'address', label: 'Dirección', description: 'Dirección de entrega', mandatory: true },
  { id: 'phone_number', label: 'Teléfono', description: 'Número de contacto', mandatory: true },
  { id: 'city', label: 'Ciudad', description: 'Ciudad de destino', mandatory: true },
  { id: 'province', label: 'Provincia', description: 'Provincia de destino', mandatory: true },
]

// Campos opcionales disponibles para importar
const optionalFieldsData = [
  { id: 'nro_master', label: 'Número Master', description: 'Número maestro del paquete', mandatory: false },
  { id: 'status', label: 'Estado', description: 'Estado inicial del paquete', mandatory: false },
  { id: 'notes', label: 'Notas', description: 'Observaciones adicionales', mandatory: false },
  { id: 'hashtags', label: 'Hashtags', description: 'Etiquetas (#urgente #fragil)', mandatory: false },
  { id: 'agency_guide_number', label: 'Guía de Agencia', description: 'Número de guía de la agencia', mandatory: false },
  { id: 'transport_agency', label: 'Agencia de Transporte', description: 'Nombre de la agencia de transporte', mandatory: false },
  { id: 'delivery_agency', label: 'Agencia de Reparto', description: 'Nombre de la agencia de reparto', mandatory: false },
]

const ImportPackages = () => {
  const navigate = useNavigate()
  const [selectedFields, setSelectedFields] = useState([])
  // Inicializar con TODOS los campos (obligatorios y opcionales)
  const [fieldOrder, setFieldOrder] = useState([...mandatoryFields, ...optionalFieldsData])
  const [file, setFile] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
  const [showColumnMapper, setShowColumnMapper] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [columnMapping, setColumnMapping] = useState(null)
  const [columnOrder, setColumnOrder] = useState(null)
  const [isPreviewing, setIsPreviewing] = useState(false)

  // Sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const optionalFields = optionalFieldsData

  const handleFieldToggle = (fieldId, checked) => {
    if (checked) {
      setSelectedFields([...selectedFields, fieldId])
      // Mover el campo al final de los activos
      setFieldOrder((currentOrder) => {
        const field = currentOrder.find(f => f.id === fieldId)
        const withoutField = currentOrder.filter(f => f.id !== fieldId)
        // Encontrar el último campo activo
        const lastActiveIndex = withoutField.findLastIndex(f => 
          f.mandatory || selectedFields.includes(f.id)
        )
        // Insertar después del último activo
        const newOrder = [...withoutField]
        newOrder.splice(lastActiveIndex + 1, 0, field)
        return newOrder
      })
    } else {
      setSelectedFields(selectedFields.filter(f => f !== fieldId))
      // Mover el campo al final de todos (sección inactivos)
      setFieldOrder((currentOrder) => {
        const field = currentOrder.find(f => f.id === fieldId)
        const withoutField = currentOrder.filter(f => f.id !== fieldId)
        return [...withoutField, field]
      })
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setFieldOrder((items) => {
        const activeField = items.find(item => item.id === active.id)
        const overField = items.find(item => item.id === over.id)
        
        // No permitir mover un campo activo a la zona de inactivos
        const activeIsActive = activeField.mandatory || selectedFields.includes(activeField.id)
        const overIsActive = overField.mandatory || selectedFields.includes(overField.id)
        
        if (activeIsActive && !overIsActive) {
          // No permitir mover activos a inactivos
          return items
        }
        
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true)
      // Pasar orden de campos al backend
      const orderedFieldIds = fieldOrder.map(f => f.id)
      await packagesService.downloadImportTemplate(selectedFields, orderedFieldIds)
      toast.success('Plantilla descargada correctamente')
    } catch (error) {
      console.error('Error al descargar plantilla:', error)
      toast.error('Error al descargar la plantilla')
    } finally {
      setIsDownloadingTemplate(false)
    }
  }

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      // Validar extensión
      const validExtensions = ['.xlsx', '.xls', '.csv']
      const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'))
      
      if (!validExtensions.includes(fileExtension)) {
        toast.error('Formato de archivo no válido. Use .xlsx, .xls o .csv')
        e.target.value = ''
        return
      }
      
      setFile(selectedFile)
      setImportResult(null) // Limpiar resultado anterior
      setColumnMapping(null) // Limpiar mapeo anterior
      setShowColumnMapper(false)
      
      // Previsualizar automáticamente
      await handlePreviewFile(selectedFile)
    }
  }

  const handlePreviewFile = async (fileToPreview) => {
    try {
      setIsPreviewing(true)
      const preview = await packagesService.previewImportFile(fileToPreview || file)
      setPreviewData(preview)
      setShowColumnMapper(true)
      toast.info('Revisa y ajusta el mapeo de columnas')
    } catch (error) {
      console.error('Error al previsualizar:', error)
      toast.error('Error al previsualizar el archivo')
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleMappingComplete = (mapping, orderedMapping) => {
    setColumnMapping(mapping)
    setColumnOrder(orderedMapping)
    setShowColumnMapper(false)
    toast.success('Mapeo y orden configurados correctamente')
  }

  const handleCancelMapping = () => {
    setShowColumnMapper(false)
    setFile(null)
    setPreviewData(null)
    setColumnMapping(null)
    setColumnOrder(null)
    document.getElementById('file-input').value = ''
  }

  const handleImport = async () => {
    if (!file) {
      toast.error('Debe seleccionar un archivo')
      return
    }

    if (!columnMapping) {
      toast.error('Debe configurar el mapeo de columnas primero')
      return
    }

    try {
      setIsImporting(true)
      // Pasar orden de campos definido por el usuario
      const orderedFieldIds = fieldOrder.map(f => f.id)
      const result = await packagesService.importPackages(file, selectedFields, columnMapping, columnOrder, orderedFieldIds)
      
      setImportResult(result)
      
      if (result.successful_imports > 0) {
        toast.success(
          `Importación completada: ${result.successful_imports} paquetes importados correctamente`
        )
      }
      
      if (result.failed_imports > 0) {
        toast.warning(
          `${result.failed_imports} filas con errores. Revise el detalle a continuación.`
        )
      }

      // Limpiar archivo y mapeo
      setFile(null)
      setColumnMapping(null)
      setPreviewData(null)
      document.getElementById('file-input').value = ''
      
    } catch (error) {
      console.error('Error al importar:', error)
      toast.error(error.response?.data?.error || 'Error al importar paquetes')
    } finally {
      setIsImporting(false)
    }
  }

  // Componente sortable para cada campo
  const SortableField = ({ field, position, isMandatory, isActive, showNumber }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: field.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : !isActive ? 0.6 : 1,
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-3 p-3 border-2 ${
          isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 
          !isActive ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900' :
          isMandatory ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10' : 
          'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
        } rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all`}
      >
        {/* Checkbox (ahora primero y para todos) */}
        <div className="flex-shrink-0">
          {isMandatory ? (
            <div className="w-5 h-5 bg-red-500 rounded flex items-center justify-center">
              <i className="fas fa-lock text-white text-xs"></i>
            </div>
          ) : (
            <input
              type="checkbox"
              checked={selectedFields.includes(field.id)}
              onChange={(e) => {
                e.stopPropagation()
                handleFieldToggle(field.id, e.target.checked)
              }}
              className="h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
          )}
        </div>

        {/* Número de orden - solo si está activo */}
        {showNumber ? (
          <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-lg flex items-center justify-center shadow-md">
            <span className="text-lg font-bold">{position}</span>
          </div>
        ) : (
          <div className="flex-shrink-0 w-10 h-10 bg-transparent flex items-center justify-center">
            <i className="fas fa-minus text-gray-400 text-lg"></i>
          </div>
        )}

        {/* Handle de drag */}
        <div
          {...attributes}
          {...listeners}
          className={`flex-shrink-0 cursor-grab active:cursor-grabbing transition-colors ${
            !isActive ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <i className="fas fa-grip-vertical text-xl"></i>
        </div>

        {/* Información del campo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className={`font-semibold text-sm ${
              !isActive ? 'text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-white'
            }`}>
              {field.label}
            </div>
            {isMandatory && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-500 text-white">
                <i className="fas fa-star mr-1 text-xs"></i>
                Obligatorio
              </span>
            )}
            {!isMandatory && isActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-600 text-white">
                <i className="fas fa-check mr-1 text-xs"></i>
                Activo
              </span>
            )}
            {!isMandatory && !isActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-400 text-white">
                Inactivo
              </span>
            )}
          </div>
          <div className={`text-xs mt-0.5 ${
            !isActive ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400'
          }`}>
            {field.description}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-file-import text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Importar Paquetes
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Importe múltiples paquetes desde un archivo Excel o CSV
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección 1: Orden y Selección de campos */}
      <Card className="mb-6">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <i className="fas fa-sort text-primary-600"></i>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Orden y Campos a Importar
            </h2>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <i className="fas fa-arrows-alt-v text-yellow-600 dark:text-yellow-400 mt-1"></i>
              <div className="text-sm text-yellow-900 dark:text-yellow-100">
                <p className="font-medium mb-1">Arrastra para reordenar • Activa campos opcionales</p>
                <p>Puedes reordenar TODOS los campos arrastrándolos. Los obligatorios (🔒) siempre están activos. Los opcionales se activan con el checkbox.</p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Los números indican el orden de procesamiento. Solo los campos activos (✓) se incluirán en la importación.
            </p>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fieldOrder.map(f => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {(() => {
                  // Separar campos activos e inactivos
                  const activeFields = fieldOrder.filter(f => f.mandatory || selectedFields.includes(f.id))
                  const inactiveFields = fieldOrder.filter(f => !f.mandatory && !selectedFields.includes(f.id))
                  
                  return (
                    <>
                      {/* Campos activos con número */}
                      {activeFields.map((field, index) => (
                        <SortableField
                          key={field.id}
                          field={field}
                          position={index + 1}
                          isMandatory={field.mandatory}
                          isActive={true}
                          showNumber={true}
                        />
                      ))}
                      
                      {/* Separador visual */}
                      {inactiveFields.length > 0 && (
                        <div className="flex items-center gap-3 py-2">
                          <div className="flex-1 border-t-2 border-dashed border-gray-300 dark:border-gray-600"></div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Campos Opcionales Inactivos
                          </span>
                          <div className="flex-1 border-t-2 border-dashed border-gray-300 dark:border-gray-600"></div>
                        </div>
                      )}
                      
                      {/* Campos inactivos sin número */}
                      {inactiveFields.map((field) => (
                        <SortableField
                          key={field.id}
                          field={field}
                          position={null}
                          isMandatory={field.mandatory}
                          isActive={false}
                          showNumber={false}
                        />
                      ))}
                    </>
                  )
                })()}
              </div>
            </SortableContext>
          </DndContext>

          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Total de campos:</strong> {fieldOrder.length} 
              <span className="mx-2">•</span>
              <strong>Obligatorios:</strong> {mandatoryFields.length}
              <span className="mx-2">•</span>
              <strong>Opcionales activos:</strong> {selectedFields.length}
            </p>
          </div>
        </div>
      </Card>

      {/* Sección 2: Descargar plantilla */}
      <Card className="mb-6">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <i className="fas fa-download text-green-600"></i>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Plantilla de Importación
            </h2>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Descargue la plantilla Excel con los campos seleccionados. La plantilla incluye 
            encabezados, ejemplos y instrucciones detalladas.
          </p>

          <Button
            variant="success"
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
          >
            {isDownloadingTemplate ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Descargando...
              </>
            ) : (
              <>
                <i className="fas fa-file-excel mr-2"></i>
                Descargar Plantilla Excel
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Sección 3: Subir archivo */}
      <Card className="mb-6">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <i className="fas fa-upload text-primary-600"></i>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Cargar Archivo
            </h2>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Seleccione el archivo Excel (.xlsx, .xls) o CSV (.csv) con los datos de los paquetes.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={isPreviewing}
                className="block w-full text-sm text-gray-900 dark:text-gray-100 
                         border border-gray-300 dark:border-gray-600 rounded-lg 
                         cursor-pointer bg-gray-50 dark:bg-gray-700 
                         focus:outline-none file:mr-4 file:py-2 file:px-4 
                         file:rounded-l-lg file:border-0 file:text-sm file:font-semibold 
                         file:bg-primary-50 dark:file:bg-primary-900/50 
                         file:text-primary-700 dark:file:text-primary-300 
                         hover:file:bg-primary-100 dark:hover:file:bg-primary-900
                         disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {isPreviewing && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <i className="fas fa-spinner fa-spin text-primary-600"></i>
                <span>Analizando archivo...</span>
              </div>
            )}

            {file && !showColumnMapper && columnMapping && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <i className="fas fa-file text-primary-600"></i>
                  <span>Archivo: <strong>{file.name}</strong></span>
                  <span className="text-xs">({(file.size / 1024).toFixed(2)} KB)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <i className="fas fa-check-circle"></i>
                  <span>Mapeo de columnas configurado</span>
                  <button
                    onClick={() => setShowColumnMapper(true)}
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 underline ml-2"
                  >
                    Editar mapeo
                  </button>
                </div>
              </div>
            )}

            {file && columnMapping && !showColumnMapper && (
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={isImporting}
                size="lg"
              >
                {isImporting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Importando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-file-import mr-2"></i>
                    Importar Paquetes
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Sección de Mapeo de Columnas */}
      {showColumnMapper && previewData && (
        <ColumnMapper
          previewData={previewData}
          onMappingComplete={handleMappingComplete}
          onCancel={handleCancelMapping}
        />
      )}

      {/* Sección 4: Resultados */}
      {importResult && (
        <Card className="mb-6">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <i className={`fas ${importResult.failed_imports === 0 ? 'fa-check-circle text-green-600' : 'fa-exclamation-triangle text-yellow-600'}`}></i>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Resultado de Importación
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total de Filas
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {importResult.total_rows}
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="text-sm text-green-700 dark:text-green-400 mb-1">
                  Importados Correctamente
                </div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {importResult.successful_imports}
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <div className="text-sm text-red-700 dark:text-red-400 mb-1">
                  Errores
                </div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {importResult.failed_imports}
                </div>
              </div>
            </div>

            {importResult.error_log && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  <i className="fas fa-list-ul mr-2"></i>
                  Errores Detallados
                </h3>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-red-900 dark:text-red-100 whitespace-pre-wrap font-mono">
                    {importResult.error_log}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Sección 5: Historial */}
      <ImportHistory />
    </div>
  )
}

export default ImportPackages
