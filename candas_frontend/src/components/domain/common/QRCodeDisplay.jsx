import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { LoadingSpinner } from '../../feedback'
import { Button } from '../../ui'

const QRCodeDisplay = ({ pullId, pullsService }) => {
  const [qrCode, setQrCode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadQRCode()
  }, [pullId])

  const loadQRCode = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await pullsService.getQRCode(pullId)
      setQrCode(data.qr_code)
    } catch (err) {
      console.error('Error cargando QR:', err)
      setError('Error al cargar código QR')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!qrCode) return

    // Convertir base64 a blob y descargar
    const link = document.createElement('a')
    link.href = qrCode
    link.download = `qr_saca_${pullId}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-3"></i>
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadQRCode}
          className="mt-4"
          icon={<i className="fas fa-redo"></i>}
        >
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {qrCode && (
        <>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <img
              src={qrCode}
              alt="Código QR de la saca"
              className="w-64 h-64"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="mt-4"
            icon={<i className="fas fa-download"></i>}
          >
            Descargar QR
          </Button>
        </>
      )}
    </div>
  )
}

QRCodeDisplay.propTypes = {
  pullId: PropTypes.string.isRequired,
  pullsService: PropTypes.object.isRequired,
}

export default QRCodeDisplay
