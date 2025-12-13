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

  // Generar manifiesto PDF
  generateManifest: async (id) => {
    const response = await api.get(`/api/v1/dispatches/${id}/generate-manifest/`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `manifiesto_despacho_${id}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    return response.data
  },

  // Generar manifiesto Excel
  generateManifestExcel: async (id) => {
    const response = await api.get(`/api/v1/dispatches/${id}/generate-manifest-excel/`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `manifiesto_despacho_${id}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    return response.data
  },

  // Exportar despacho a Excel con formato personalizado
  exportExcelCustomFormat: async (id, guideStatus = null) => {
    const params = {}
    if (guideStatus) {
      params.guide_status = guideStatus
    }
    const response = await api.get(`/api/v1/dispatches/${id}/export-excel-custom-format/`, {
      params,
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    link.setAttribute('download', `manifiesto_despacho_${timestamp}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    return response.data
  },

  // Obtener despachos por fecha
  getByDate: async (date) => {
    const response = await api.get('/api/v1/dispatches/by-date/', {
      params: { date }
    })
    return response.data
  },
}

export default dispatchesService
