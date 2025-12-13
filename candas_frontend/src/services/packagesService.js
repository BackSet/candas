import api from './api'
import { downloadBlob, generateFilename } from '../utils/downloadHelper'

export const packagesService = {
  // Listar todos los paquetes
  list: async (params = {}) => {
    const response = await api.get('/api/v1/packages/', { params })
    return response.data
  },

  // Obtener un paquete por ID
  get: async (id) => {
    const response = await api.get(`/api/v1/packages/${id}/`)
    return response.data
  },

  // Crear un nuevo paquete
  create: async (data) => {
    const response = await api.post('/api/v1/packages/', data)
    return response.data
  },

  // Actualizar un paquete completo
  update: async (id, data) => {
    const response = await api.put(`/api/v1/packages/${id}/`, data)
    return response.data
  },

  // Actualizar parcialmente un paquete
  partialUpdate: async (id, data) => {
    const response = await api.patch(`/api/v1/packages/${id}/`, data)
    return response.data
  },

  // Eliminar un paquete
  delete: async (id) => {
    const response = await api.delete(`/api/v1/packages/${id}/`)
    return response.data
  },

  // Obtener paquetes disponibles para pull
  getAvailable: async () => {
    const response = await api.get('/api/v1/packages/available_for_pull/')
    return response.data
  },

  // Cambiar estado de un paquete
  changeStatus: async (id, status) => {
    const response = await api.post(`/api/v1/packages/${id}/change_status/`, {
      status
    })
    return response.data
  },

  // Asignar paquete a un pull
  assignToPull: async (id, pullId) => {
    const response = await api.post(`/api/v1/packages/${id}/assign_to_pull/`, {
      pull_id: pullId
    })
    return response.data
  },

  // Obtener estadísticas de paquetes
  getStatistics: async () => {
    const response = await api.get('/api/v1/packages/statistics/')
    return response.data
  },

  // Buscar paquete por código de barras
  searchByBarcode: async (barcode) => {
    const response = await api.get(`/api/v1/packages/search_by_barcode/?barcode=${barcode}`)
    return response.data
  },

  // Exportar paquetes a Excel o PDF
  exportPackages: async (exportData) => {
    // exportData incluye: format, columns, filters, scope, page_ids
    const response = await api.post('/api/v1/packages/export/', exportData, {
      responseType: 'blob'  // Importante para archivos binarios
    })
    
    const extension = exportData?.format === 'excel' ? 'xlsx' : 'pdf'
    const filename = generateFilename('paquetes', extension)
    downloadBlob(new Blob([response.data]), filename)
    
    return response
  },

  // Descargar plantilla de importación
  downloadImportTemplate: async (selectedFields = [], fieldOrder = null) => {
    const payload = {
      selected_fields: selectedFields,
      ...(fieldOrder && { field_order: fieldOrder })
    }
    
    const response = await api.post('/api/v1/packages/download-import-template/', payload, {
      responseType: 'blob'
    })
    
    const filename = generateFilename('plantilla_importacion_paquetes', 'xlsx')
    downloadBlob(new Blob([response?.data ?? []]), filename)
    
    return response?.data
  },

  // Previsualizar columnas de archivo antes de importar
  previewImportFile: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post('/api/v1/packages/preview-import-file/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response.data
  },

  // Importar paquetes desde archivo
  importPackages: async (file, selectedFields = [], columnMapping = null, columnOrder = null, fieldOrder = null) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('selected_fields', JSON.stringify(selectedFields))
    
    // Usar Object.entries para agregar campos opcionales de manera más eficiente
    const optionalFields = {
      column_mapping: columnMapping,
      column_order: columnOrder,
      field_order: fieldOrder
    }
    
    Object.entries(optionalFields).forEach(([key, value]) => {
      if (value) {
        formData.append(key, JSON.stringify(value))
      }
    })
    
    const response = await api.post('/api/v1/packages/import-packages/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response?.data
  },

  // Obtener historial de importaciones
  getImportHistory: async (limit = 20) => {
    const response = await api.get('/api/v1/packages/import-history/', {
      params: { limit }
    })
    return response.data
  },

  // Generar manifiesto PDF del paquete individual
  generateManifestPDF: async (id) => {
    const response = await api.get(`/api/v1/packages/${id}/generate_manifest_pdf/`, {
      responseType: 'blob'
    })
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    downloadBlob(new Blob([response?.data ?? []]), `manifiesto_paquete_${timestamp}.pdf`)
    
    return response
  },
  
  // Generar manifiesto Excel del paquete individual
  generateManifestExcel: async (id) => {
    const response = await api.get(`/api/v1/packages/${id}/generate_manifest_excel/`, {
      responseType: 'blob'
    })
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    downloadBlob(new Blob([response?.data ?? []]), `manifiesto_paquete_${timestamp}.xlsx`)
    
    return response
  },
  
  // Generar etiqueta del paquete individual
  generateLabel: async (id) => {
    const response = await api.get(`/api/v1/packages/${id}/generate_label/`, {
      responseType: 'blob'
    })
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    downloadBlob(new Blob([response?.data ?? []]), `etiqueta_paquete_${timestamp}.pdf`)
    
    return response
  },

  // Generar etiqueta de envío (formato de guía con código de barras)
  generateShippingLabel: async (id) => {
    const response = await api.get(`/api/v1/packages/${id}/generate-shipping-label/`, {
      responseType: 'blob'
    })
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    downloadBlob(new Blob([response?.data ?? []]), `guia_paquete_${timestamp}.pdf`)
    
    return response
  },

  // Actualizar paquetes en lote
  batchUpdate: async (packageIds, attribute, value) => {
    const response = await api.post('/api/v1/packages/batch-update/', {
      package_ids: packageIds,
      attribute,
      value
    })
    return response?.data
  },

  // Crear paquete hijo asociado a un padre
  createChild: async (parentId, childData) => {
    const response = await api.post(`/api/v1/packages/${parentId}/create-child/`, childData)
    return response.data
  },

  // Migrar código de paquete (crear nuevo padre y convertir actual en hijo)
  migrateCode: async (packageId, newGuideNumber) => {
    const response = await api.post(`/api/v1/packages/${packageId}/migrate-code/`, {
      new_guide_number: newGuideNumber
    })
    return response.data
  },

  // Asociar paquetes existentes como hijos de un padre
  associateChildren: async (parentId, childIds) => {
    // Usar el endpoint específico para asociar hijos
    const response = await api.post(`/api/v1/packages/${parentId}/associate-children/`, {
      child_ids: childIds
    })
    return response.data
  },

  // Obtener URL de la imagen del código de barras
  getBarcodeImageUrl: (id) => {
    const baseURL = api.defaults.baseURL || ''
    return `${baseURL}/api/v1/packages/${id}/barcode-image/`
  },

  // Generar mensaje de notificación
  generateNotificationMessage: async (id) => {
    const response = await api.get(`/api/v1/packages/${id}/generate_notification_message/`)
    return response.data
  },
}

export default packagesService
