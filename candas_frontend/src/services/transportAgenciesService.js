import api from './api'

/**
 * Servicio para gestionar Agencias de Transporte
 */
export const transportAgenciesService = {
  // Listar todas las agencias
  list: async (params = {}) => {
    const response = await api.get('/api/v1/transport-agencies/', { params })
    return response.data
  },

  // Obtener una agencia por ID
  get: async (id) => {
    const response = await api.get(`/api/v1/transport-agencies/${id}/`)
    return response.data
  },

  // Crear una nueva agencia
  create: async (data) => {
    const response = await api.post('/api/v1/transport-agencies/', data)
    return response.data
  },

  // Actualizar una agencia
  update: async (id, data) => {
    const response = await api.patch(`/api/v1/transport-agencies/${id}/`, data)
    return response.data
  },

  // Eliminar una agencia
  delete: async (id) => {
    const response = await api.delete(`/api/v1/transport-agencies/${id}/`)
    return response.data
  },

  // Obtener solo agencias activas
  getActive: async () => {
    const response = await api.get('/api/v1/transport-agencies/?active_only=true')
    return response.data
  },

  // Actualización parcial
  partialUpdate: async (id, data) => {
    const response = await api.patch(`/api/v1/transport-agencies/${id}/`, data)
    return response.data
  },

  // Obtener estadísticas de la agencia
  getStatistics: async (id) => {
    const response = await api.get(`/api/v1/transport-agencies/${id}/statistics/`)
    return response.data
  },

  // Obtener envíos de la agencia
  getShipments: async (id, type = 'packages') => {
    const response = await api.get(`/api/v1/transport-agencies/${id}/shipments/?type=${type}`)
    return response.data
  },

  // Exportar agencias
  export: async (exportData) => {
    const response = await api.post('/api/v1/transport-agencies/export/', exportData, {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    const extension = exportData.format === 'excel' ? 'xlsx' : 'pdf'
    const timestamp = new Date().toISOString().split('T')[0]
    link.setAttribute('download', `agencias_${timestamp}.${extension}`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return response
  },
}

export default transportAgenciesService
