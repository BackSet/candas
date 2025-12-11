import api from './api'

const catalogService = {
  // Agencias de Transporte
  getTransportAgencies: async () => {
    const response = await api.get('/api/v1/transport-agencies/')
    return response.data
  },

  getTransportAgency: async (id) => {
    const response = await api.get(`/api/v1/transport-agencies/${id}/`)
    return response.data
  },

  createTransportAgency: async (data) => {
    const response = await api.post('/api/v1/transport-agencies/', data)
    return response.data
  },

  updateTransportAgency: async (id, data) => {
    const response = await api.put(`/api/v1/transport-agencies/${id}/`, data)
    return response.data
  },

  deleteTransportAgency: async (id) => {
    const response = await api.delete(`/api/v1/transport-agencies/${id}/`)
    return response.data
  },

  // Agencias de Reparto
  getDeliveryAgencies: async () => {
    const response = await api.get('/api/v1/delivery-agencies/')
    return response.data
  },

  getDeliveryAgency: async (id) => {
    const response = await api.get(`/api/v1/delivery-agencies/${id}/`)
    return response.data
  },

  createDeliveryAgency: async (data) => {
    const response = await api.post('/api/v1/delivery-agencies/', data)
    return response.data
  },

  updateDeliveryAgency: async (id, data) => {
    const response = await api.put(`/api/v1/delivery-agencies/${id}/`, data)
    return response.data
  },

  deleteDeliveryAgency: async (id) => {
    const response = await api.delete(`/api/v1/delivery-agencies/${id}/`)
    return response.data
  },
}

export default catalogService
