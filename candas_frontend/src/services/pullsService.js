import api from './api'

export const pullsService = {
  // Listar todos los pulls
  list: async (params = {}) => {
    const response = await api.get('/api/v1/pulls/', { params })
    return response.data
  },

  // Obtener un pull por ID
  get: async (id) => {
    const response = await api.get(`/api/v1/pulls/${id}/`)
    return response.data
  },

  // Crear un nuevo pull
  create: async (data) => {
    const response = await api.post('/api/v1/pulls/', data)
    return response.data
  },

  // Actualizar un pull
  update: async (id, data) => {
    const response = await api.patch(`/api/v1/pulls/${id}/`, data)
    return response.data
  },

  // Eliminar un pull
  delete: async (id) => {
    const response = await api.delete(`/api/v1/pulls/${id}/`)
    return response.data
  },

  // Obtener sacas disponibles (sin asignar a batch o dispatch)
  getAvailable: async () => {
    const response = await api.get('/api/v1/pulls/?available=true')
    return response.data
  },

  // Agregar paquetes a un pull
  addPackages: async (id, packageIds) => {
    const response = await api.post(`/api/v1/pulls/${id}/add_packages/`, {
      package_ids: packageIds
    })
    return response.data
  },

  // Remover paquetes de un pull
  removePackages: async (id, packageIds) => {
    const response = await api.post(`/api/v1/pulls/${id}/remove_packages/`, {
      package_ids: packageIds
    })
    return response.data
  },

  // Crear múltiples sacas con el mismo destino
  bulkCreate: async (data) => {
    const response = await api.post('/api/v1/pulls/bulk_create/', data)
    return response.data
  },

  // Generar código de barras para un pull
  generateBarcode: async (id) => {
    const response = await api.post(`/api/v1/pulls/${id}/generate_barcode/`)
    return response.data
  },

  // Obtener estadísticas de un pull
  getStatistics: async (id) => {
    const response = await api.get(`/api/v1/pulls/${id}/statistics/`)
    return response.data
  },

  // Generar manifiesto PDF
  generateManifest: async (id) => {
    const response = await api.get(`/api/v1/pulls/${id}/generate_manifest/`, {
      responseType: 'blob'
    })
    // Crear enlace de descarga
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `manifiesto_saca_${id}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    return response.data
  },

  // Generar manifiesto Excel
  generateManifestExcel: async (id) => {
    const response = await api.get(`/api/v1/pulls/${id}/generate_manifest_excel/`, {
      responseType: 'blob'
    })
    // Crear enlace de descarga
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `manifiesto_saca_${id}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    return response.data
  },

  // Generar etiqueta PDF
  generateLabel: async (id) => {
    const response = await api.get(`/api/v1/pulls/${id}/generate_label/`, {
      responseType: 'blob'
    })
    // Crear enlace de descarga
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `etiqueta_saca_${id}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    return response.data
  },

  // Obtener código QR
  getQRCode: async (id) => {
    const response = await api.get(`/api/v1/pulls/${id}/qr_code/`)
    return response.data
  },

  // Cambiar estado de todos los paquetes de la saca
  changePackagesStatus: async (id, status) => {
    const response = await api.post(`/api/v1/pulls/${id}/change-packages-status/`, {
      status
    })
    return response.data
  },

  // Generar mensaje de notificación
  generateNotificationMessage: async (id) => {
    const response = await api.get(`/api/v1/pulls/${id}/generate_notification_message/`)
    return response.data
  },
}

export default pullsService
