import api from './api'

const reportsService = {
  // Listar todos los reportes
  list: async (params = {}) => {
    const response = await api.get('/api/v1/reports/', { params })
    return response.data
  },

  // Obtener un reporte por ID
  get: async (id) => {
    const response = await api.get(`/api/v1/reports/${id}/`)
    return response.data
  },

  // Generar reporte de paquetes
  packagesReport: async (filters, format = 'json') => {
    const response = await api.post('/api/v1/reports/packages_report/', {
      filters,
      format
    }, {
      responseType: format !== 'json' ? 'blob' : 'json'
    })
    
    if (format !== 'json') {
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const extension = format === 'excel' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv'
      const timestamp = new Date().toISOString().split('T')[0]
      link.setAttribute('download', `reporte_paquetes_${timestamp}.${extension}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    }
    
    return response.data
  },

  // Generar reporte estadístico
  statisticsReport: async (dateFrom, dateTo) => {
    const response = await api.post('/api/v1/reports/statistics_report/', {
      date_from: dateFrom,
      date_to: dateTo
    })
    return response.data
  },

  // Generar reporte de rendimiento de agencias
  agenciesPerformance: async (dateFrom, dateTo) => {
    const response = await api.post('/api/v1/reports/agencies_performance/', {
      date_from: dateFrom,
      date_to: dateTo
    })
    return response.data
  },

  // Generar reporte de destinos
  destinationsReport: async (dateFrom, dateTo) => {
    const response = await api.post('/api/v1/reports/destinations_report/', {
      date_from: dateFrom,
      date_to: dateTo
    })
    return response.data
  },

  // Obtener datos para gráficos
  getChartData: async (days = 30) => {
    const response = await api.get(`/api/v1/reports/chart_data/?days=${days}`)
    return response.data
  },

  // Generar reporte diario
  generateDaily: async (date) => {
    const response = await api.post('/api/v1/reports/generate_daily/', { date })
    return response.data
  },

  // Generar reporte mensual
  generateMonthly: async (year, month) => {
    const response = await api.post('/api/v1/reports/generate_monthly/', { year, month })
    return response.data
  },

  // Descargar PDF
  downloadPDF: async (id) => {
    const response = await api.get(`/api/v1/reports/${id}/download_pdf/`, {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `reporte_${id}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return response
  },

  // Descargar Excel
  downloadExcel: async (id) => {
    const response = await api.get(`/api/v1/reports/${id}/download_excel/`, {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `reporte_${id}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return response
  },

  // Eliminar reporte
  delete: async (id) => {
    const response = await api.delete(`/api/v1/reports/${id}/`)
    return response.data
  },
  // Reportes Programados
  listSchedules: async (params = {}) => {
    const response = await api.get('/api/v1/report-schedules/', { params })
    return response.data
  },
  
  getSchedule: async (id) => {
    const response = await api.get(`/api/v1/report-schedules/${id}/`)
    return response.data
  },
  
  createSchedule: async (data) => {
    const response = await api.post('/api/v1/report-schedules/', data)
    return response.data
  },
  
  updateSchedule: async (id, data) => {
    const response = await api.patch(`/api/v1/report-schedules/${id}/`, data)
    return response.data
  },
  
  deleteSchedule: async (id) => {
    const response = await api.delete(`/api/v1/report-schedules/${id}/`)
    return response.data
  },
  
  toggleScheduleActive: async (id) => {
    const response = await api.post(`/api/v1/report-schedules/${id}/toggle_active/`)
    return response.data
  },
  
  runScheduleNow: async (id) => {
    const response = await api.post(`/api/v1/report-schedules/${id}/run_now/`)
    return response.data
  },

  // Generar reporte diario de despachos
  generateDailyDispatchReport: async (reportDate) => {
    const response = await api.post('/api/v1/reports/generate-daily-dispatch/', {
      report_date: reportDate
    })
    return response.data
  },

  // Generar reporte diario de recepciones
  generateDailyReceptionReport: async (reportDate) => {
    const response = await api.post('/api/v1/reports/generate-daily-reception/', {
      report_date: reportDate
    })
    return response.data
  },
}

export default reportsService
