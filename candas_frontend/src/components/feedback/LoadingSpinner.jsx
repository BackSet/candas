import { Spinner as FlowbiteSpinner } from 'flowbite-react'
import { mapSpinnerProps } from '../../utils/flowbiteHelpers.jsx'
import PropTypes from 'prop-types'

/**
 * Componente LoadingSpinner que usa Flowbite React Spinner
 * Mantiene compatibilidad con la API existente
 */
const LoadingSpinner = ({ message = 'Cargando...', size = 'md', fullScreen = false }) => {
  const spinnerProps = mapSpinnerProps({ size })

  const SpinnerContent = () => (
    <div className="flex flex-col items-center justify-center gap-4">
      <FlowbiteSpinner {...spinnerProps} aria-label={message} />
      {message && (
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 animate-pulse">
          {message}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
        <SpinnerContent />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      <SpinnerContent />
    </div>
  )
}

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullScreen: PropTypes.bool,
}

export default LoadingSpinner
