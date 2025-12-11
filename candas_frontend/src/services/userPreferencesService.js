import api from './api'

const userPreferencesService = {
  getBarcodeConfig: async () => {
    const response = await api.get('/api/v1/preferences/barcode_config/')
    return response.data
  },

  updateBarcodeConfig: async (config) => {
    const response = await api.put('/api/v1/preferences/barcode_config/', {
      barcode_scan_config: config
    })
    return response.data
  },

  getExportConfig: async () => {
    const response = await api.get('/api/v1/preferences/export_config/')
    return response.data
  },

  updateExportConfig: async (config) => {
    const response = await api.put('/api/v1/preferences/export_config/', {
      export_config: config
    })
    return response.data
  }
}

export default userPreferencesService
