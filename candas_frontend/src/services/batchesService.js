import api from './api'

const batchesService = {
  // Listar todos los lotes
  list: async (params = {}) => {
    const response = await api.get('/api/v1/batches/', { params })
    return response.data
  },

  // Obtener un lote por ID
  get: async (id) => {
    const response = await api.get(`/api/v1/batches/${id}/`)
    return response.data
  },

  // Crear un nuevo lote
  create: async (data) => {
    const response = await api.post('/api/v1/batches/', data)
    return response.data
  },

  // Actualizar un lote
  update: async (id, data) => {
    const response = await api.put(`/api/v1/batches/${id}/`, data)
    return response.data
  },

  // Actualización parcial
  partialUpdate: async (id, data) => {
    const response = await api.patch(`/api/v1/batches/${id}/`, data)
    return response.data
  },

  // Eliminar un lote
  delete: async (id) => {
    const response = await api.delete(`/api/v1/batches/${id}/`)
    return response.data
  },

  // Crear lote con sacas
  createWithPulls: async (data) => {
    const response = await api.post('/api/v1/batches/create_with_pulls/', data)
    return response.data
  },

  // Distribución automática
  autoDistribute: async (data) => {
    const response = await api.post('/api/v1/batches/auto_distribute/', data)
    return response.data
  },

  // Obtener resumen de paquetes
  getPackagesSummary: async (id) => {
    const response = await api.get(`/api/v1/batches/${id}/packages_summary/`)
    return response.data
  },

  // Agregar saca al lote
  addPull: async (id, pullId) => {
    const response = await api.post(`/api/v1/batches/${id}/add_pull/`, {
      pull_id: pullId
    })
    return response.data
  },

  // Quitar saca del lote
  removePull: async (id, pullId) => {
    const response = await api.post(`/api/v1/batches/${id}/remove_pull/`, {
      pull_id: pullId
    })
    return response.data
  },

  // Exportar lotes
  export: async (exportData) => {
    const response = await api.post('/api/v1/batches/export/', exportData, {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    const timestamp = new Date().toISOString().split('T')[0]
    link.setAttribute('download', `lotes_${timestamp}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return response
  },
  
  // Generar manifiesto PDF del lote
  generateManifestPDF: async (id) => {
    const response = await api.get(`/api/v1/batches/${id}/generate_manifest_pdf/`, {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    link.setAttribute('download', `manifiesto_lote_${timestamp}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return response
  },
  
  // Generar manifiesto Excel del lote
  generateManifestExcel: async (id) => {
    const response = await api.get(`/api/v1/batches/${id}/generate_manifest_excel/`, {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    link.setAttribute('download', `manifiesto_lote_${timestamp}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return response
  },
  
  // Generar etiquetas de sacas del lote
  generateLabels: async (id) => {
    const response = await api.get(`/api/v1/batches/${id}/generate_labels/`, {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    link.setAttribute('download', `etiquetas_sacas_${timestamp}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return response
  },

  // Cambiar estado de todos los paquetes del lote
  changePackagesStatus: async (id, status) => {
    const response = await api.post(`/api/v1/batches/${id}/change-packages-status/`, {
      status
    })
    return response.data
  },
}

export default batchesService
