import api from './api'
import logger from '../utils/logger'

const deliveryAgenciesService = {
  /**
   * Listar todas las agencias de reparto
   */
  async list(params = {}) {
    try {
      const response = await api.get('/api/v1/delivery-agencies/', { params })
      return response.data
    } catch (error) {
      logger.error('Error listando agencias de reparto:', error)
      throw error
    }
  },

  /**
   * Obtener una agencia por ID
   */
  async get(id) {
    try {
      const response = await api.get(`/api/v1/delivery-agencies/${id}/`)
      return response.data
    } catch (error) {
      logger.error('Error obteniendo agencia de reparto:', error)
      throw error
    }
  },

  /**
   * Crear una nueva agencia de reparto
   */
  async create(data) {
    try {
      const response = await api.post('/api/v1/delivery-agencies/', data)
      return response.data
    } catch (error) {
      logger.error('Error creando agencia de reparto:', error)
      throw error
    }
  },

  /**
   * Actualizar una agencia de reparto
   */
  async update(id, data) {
    try {
      const response = await api.put(`/api/v1/delivery-agencies/${id}/`, data)
      return response.data
    } catch (error) {
      logger.error('Error actualizando agencia de reparto:', error)
      throw error
    }
  },

  /**
   * Actualizar parcialmente una agencia de reparto
   */
  async partialUpdate(id, data) {
    try {
      const response = await api.patch(`/api/v1/delivery-agencies/${id}/`, data)
      return response.data
    } catch (error) {
      logger.error('Error actualizando parcialmente agencia de reparto:', error)
      throw error
    }
  },

  /**
   * Eliminar una agencia de reparto
   */
  async delete(id) {
    try {
      const response = await api.delete(`/api/v1/delivery-agencies/${id}/`)
      return response.data
    } catch (error) {
      logger.error('Error eliminando agencia de reparto:', error)
      throw error
    }
  },

  /**
   * Obtener agencias activas
   */
  async getActive() {
    try {
      const response = await api.get('/api/v1/delivery-agencies/', {
        params: { active_only: 'true' }
      })
      return response.data
    } catch (error) {
      logger.error('Error obteniendo agencias activas:', error)
      throw error
    }
  },

  /**
   * Obtener agencias por ubicación
   */
  async getByLocation(locationId) {
    try {
      const response = await api.get('/api/v1/delivery-agencies/', {
        params: { location: locationId }
      })
      return response.data
    } catch (error) {
      logger.error('Error obteniendo agencias por ubicación:', error)
      throw error
    }
  },

  /**
   * Obtener recomendaciones de agencias para una ciudad
   */
  async getRecommendations(city, province = null) {
    try {
      const params = new URLSearchParams({ city })
      if (province) params.append('province', province)
      
      const response = await api.get(`/api/v1/delivery-agencies/recommend/?${params}`)
      return response.data
    } catch (error) {
      logger.error('Error obteniendo recomendaciones:', error)
      throw error
    }
  },

  /**
   * Obtener la mejor recomendación (una sola agencia)
   */
  async getBestRecommendation(city, province = null) {
    try {
      const params = new URLSearchParams({ city })
      if (province) params.append('province', province)
      
      const response = await api.get(`/api/v1/delivery-agencies/recommend-best/?${params}`)
      return response.data
    } catch (error) {
      logger.error('Error obteniendo mejor recomendación:', error)
      throw error
    }
  }
}

export default deliveryAgenciesService

