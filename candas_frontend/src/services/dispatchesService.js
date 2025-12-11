import api from './api'

/**
 * Servicio para gestionar Despachos (Dispatches)
 */
export const dispatchesService = {
  // Listar todos los despachos
  list: async (params = {}) => {
    const response = await api.get('/api/v1/dispatches/', { params })
    return response.data
  },

  // Obtener un despacho por ID
  get: async (id) => {
    const response = await api.get(`/api/v1/dispatches/${id}/`)
    return response.data
  },

  // Crear un nuevo despacho
  create: async (data) => {
    const response = await api.post('/api/v1/dispatches/', data)
    return response.data
  },

  // Actualizar un despacho
  update: async (id, data) => {
    const response = await api.patch(`/api/v1/dispatches/${id}/`, data)
    return response.data
  },

  // Eliminar un despacho
  delete: async (id) => {
    const response = await api.delete(`/api/v1/dispatches/${id}/`)
    return response.data
  },

  // Agregar sacas a un despacho
  addPulls: async (id, pullIds) => {
    const response = await api.post(`/api/v1/dispatches/${id}/add_pulls/`, {
      pull_ids: pullIds
    })
    return response.data
  },

  // Remover sacas de un despacho
  removePulls: async (id, pullIds) => {
    const response = await api.post(`/api/v1/dispatches/${id}/remove_pulls/`, {
      pull_ids: pullIds
    })
    return response.data
  },

  // Agregar paquetes individuales a un despacho
  addPackages: async (id, packageIds) => {
    const response = await api.post(`/api/v1/dispatches/${id}/add_packages/`, {
      package_ids: packageIds
    })
    return response.data
  },

  // Remover paquetes de un despacho
  removePackages: async (id, packageIds) => {
    const response = await api.post(`/api/v1/dispatches/${id}/remove_packages/`, {
      package_ids: packageIds
    })
    return response.data
  },

  // Cambiar estado de un despacho
  changeStatus: async (id, status) => {
    const response = await api.post(`/api/v1/dispatches/${id}/change_status/`, {
      status
    })
    return response.data
  },
}

export default dispatchesService
