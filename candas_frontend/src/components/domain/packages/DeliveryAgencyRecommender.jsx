import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { toast } from 'react-toastify'
import deliveryAgenciesService from '../../../services/deliveryAgenciesService'
import { Badge, Button } from '../../'

/**
 * Componente que muestra recomendaciones de agencias de reparto basadas en la ciudad
 */
const DeliveryAgencyRecommender = ({ city, province, onSelect, currentAgency }) => {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [bestMatch, setBestMatch] = useState(null)
  
  useEffect(() => {
    if (city) {
      loadRecommendations()
    } else {
      setRecommendations([])
      setBestMatch(null)
    }
  }, [city, province])
  
  const loadRecommendations = async () => {
    if (!city) return
    
    setLoading(true)
    try {
      const data = await deliveryAgenciesService.getRecommendations(city, province)
      setRecommendations(data.recommendations || [])
      setBestMatch(data.best_match || null)
    } catch (error) {
      // No mostrar error si no hay recomendaciones, es normal
      if (error.response?.status !== 404) {
        console.error('Error cargando recomendaciones:', error)
      }
      setRecommendations([])
      setBestMatch(null)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSelect = (agency) => {
    if (onSelect) {
      onSelect(agency.id)
      toast.success(`Agencia "${agency.name}" seleccionada`)
    }
  }
  
  if (!city || (recommendations.length === 0 && !loading)) {
    return null
  }
  
  const displayRecommendations = showAll ? recommendations : recommendations.slice(0, 3)
  
  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
          <i className="fas fa-lightbulb"></i>
          Recomendaciones de Agencia de Reparto
        </h4>
        {recommendations.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {showAll ? 'Ver menos' : `Ver todas (${recommendations.length})`}
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <i className="fas fa-spinner fa-spin"></i>
          Cargando recomendaciones...
        </div>
      ) : (
        <div className="space-y-2">
          {displayRecommendations.map((rec, index) => {
            const isSelected = currentAgency === rec.agency.id
            const isBest = index === 0
            
            return (
              <div
                key={rec.agency.id}
                className={`
                  flex items-start justify-between p-3 rounded-lg border transition-all
                  ${isSelected
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }
                `}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {rec.agency.name}
                    </span>
                    {isBest && (
                      <Badge variant="success" size="sm">
                        <i className="fas fa-star mr-1"></i>
                        Mejor opción
                      </Badge>
                    )}
                    <Badge variant="info" size="sm">
                      Score: {Math.round(rec.score)}
                    </Badge>
                    {isSelected && (
                      <Badge variant="success" size="sm">
                        <i className="fas fa-check mr-1"></i>
                        Seleccionada
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {rec.agency.address && (
                      <div className="flex items-start gap-1">
                        <i className="fas fa-map-marker-alt mt-0.5 flex-shrink-0"></i>
                        <span className="break-words">{rec.agency.address}</span>
                      </div>
                    )}
                    {rec.agency.phone_number && (
                      <div className="flex items-center gap-1">
                        <i className="fas fa-phone"></i>
                        <span>{rec.agency.phone_number}</span>
                      </div>
                    )}
                    {rec.agency.contact_person && (
                      <div className="flex items-center gap-1">
                        <i className="fas fa-user"></i>
                        <span>{rec.agency.contact_person}</span>
                      </div>
                    )}
                  </div>
                </div>
                {!isSelected && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleSelect(rec.agency)}
                    className="ml-4 flex-shrink-0"
                  >
                    <i className="fas fa-check-circle mr-1"></i>
                    Seleccionar
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

DeliveryAgencyRecommender.propTypes = {
  city: PropTypes.string,
  province: PropTypes.string,
  onSelect: PropTypes.func,
  currentAgency: PropTypes.string,
}

export default DeliveryAgencyRecommender

