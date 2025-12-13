import api from './api'

const excelMapperService = {
  // Leer columnas de un archivo Excel
  readColumns: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post('/api/v1/excel-mapper/read-columns/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    return response.data
  },

  // Generar Excel de salida con mapeo
  generateOutput: async (file, mapping) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mapping', JSON.stringify(mapping))
    
    const response = await api.post('/api/v1/excel-mapper/generate-output/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob',
    })
    
    // Descargar el archivo
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    link.setAttribute('download', `manifiesto_mapeado_${timestamp}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return response
  },
}

export default excelMapperService

