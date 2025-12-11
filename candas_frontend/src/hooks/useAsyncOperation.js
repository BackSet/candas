import { useState, useCallback } from 'react'
import { toast } from 'react-toastify'

/**
 * Hook para manejar operaciones asíncronas con estado de loading, error y success
 * @param {Object} options - Opciones de configuración
 * @param {Function} options.onSuccess - Callback cuando la operación es exitosa
 * @param {Function} options.onError - Callback cuando hay error
 * @param {boolean} options.showToast - Si debe mostrar toasts automáticamente
 * @param {string} options.successMessage - Mensaje de éxito para el toast
 * @param {string} options.errorMessage - Mensaje de error para el toast
 * @returns {Object} Estado y función execute
 */
export const useAsyncOperation = (options = {}) => {
  const {
    onSuccess,
    onError,
    showToast = true,
    successMessage,
    errorMessage,
  } = options

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (asyncFunction, customOptions = {}) => {
    const {
      successMsg = successMessage,
      errorMsg = errorMessage,
      showSuccessToast = showToast,
      showErrorToast = showToast,
    } = customOptions

    try {
      setLoading(true)
      setError(null)

      const result = await asyncFunction()

      if (showSuccessToast && successMsg) {
        toast.success(successMsg)
      }

      if (onSuccess) {
        onSuccess(result)
      }

      return { success: true, data: result }
    } catch (err) {
      const errorMessage = err.response?.data?.error ?? err.message ?? errorMsg ?? 'Error en la operación'
      setError(err)

      if (showErrorToast) {
        toast.error(errorMessage)
      }

      if (onError) {
        onError(err)
      }

      return { success: false, error: err }
    } finally {
      setLoading(false)
    }
  }, [onSuccess, onError, showToast, successMessage, errorMessage])

  return {
    loading,
    error,
    execute,
    setError,
  }
}

export default useAsyncOperation

