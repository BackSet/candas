import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { toast } from 'react-toastify'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '../../ui'
import batchesService from '../../../services/batchesService'
import pullsService from '../../../services/pullsService'
import packagesService from '../../../services/packagesService'

/**
 * Modal para mostrar mensajes de notificación con funcionalidad de copiar al portapapeles
 */
const MessageModal = ({
  show,
  onClose,
  message,
  details,
  entityId,
  type = 'batch',
}) => {
  const [copied, setCopied] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [packageStatus, setPackageStatus] = useState('') // '' | 'dispatching' | 'in_route'

  // Función para obtener el saludo según la hora del día
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      return 'Buenos días'
    } else if (hour >= 12 && hour < 19) {
      return 'Buenas tardes'
    } else {
      return 'Buenas noches'
    }
  }

  // Formatear el mensaje con saludo y formato WhatsApp
  const formatMessage = (msg, msgDetails, entityType, statusOption) => {
    if (!msg && !msgDetails) return ''
    
    const greeting = getGreeting()
    
    // Si hay detalles, construir el mensaje con formato específico
    if (msgDetails && (msgDetails.agency_name || msgDetails.guide_number || msgDetails.total_packages !== undefined)) {
      const parts = []
      
      // Remitente
      parts.push('*MV SERVICES CURIER INC*')
      parts.push('')
      
      // Título con emoji y estado del paquete (ajustado según tipo de entidad)
      let title = '📦 *Envío de Paquete Realizado*'
      if (statusOption === 'dispatching') {
        if (entityType === 'package') {
          title = '📦 *El paquete está siendo despachado, y sale hoy en la tarde en ruta.*'
        } else {
          // batch o pull (plural)
          title = '📦 *Los paquetes están siendo despachados, y salen hoy en la tarde en ruta.*'
        }
      } else if (statusOption === 'in_route') {
        if (entityType === 'package') {
          title = '📦 *El paquete ya está en ruta.*'
        } else {
          // batch o pull (plural)
          title = '📦 *Los paquetes ya están en ruta.*'
        }
      }
      parts.push(title)
      parts.push('')
      parts.push(`¡${greeting}!`)
      parts.push('')
      
      // Información importante en negrilla
      if (msgDetails.agency_name) {
        parts.push(`*Agencia de Envío:* ${msgDetails.agency_name}`)
      }
      
      if (msgDetails.guide_number) {
        parts.push(`*Número de Guía:* ${msgDetails.guide_number}`)
      }
      
      // Información específica según el tipo de entidad
      if (entityType === 'batch') {
        // Para lotes: mostrar número de cada saca, paquetes por saca y total
        if (msgDetails.pulls_list && msgDetails.pulls_list.length > 0) {
          parts.push('*Detalle de Sacas:*')
          // Ordenar por número para asegurar el orden correcto
          const sortedPulls = [...msgDetails.pulls_list].sort((a, b) => a.number - b.number)
          sortedPulls.forEach((pull) => {
            const packageText = pull.packages_count === 1 ? 'paquete' : 'paquetes'
            parts.push(`Saca ${pull.number}/${pull.total}: ${pull.packages_count} ${packageText}`)
          })
        } else if (msgDetails.pulls_count !== undefined) {
          const sacaText = msgDetails.pulls_count === 1 ? 'saca' : 'sacas'
          parts.push(`*Cantidad de Sacas:* ${msgDetails.pulls_count} ${sacaText}`)
        }
        
        if (msgDetails.total_packages !== undefined) {
          const packageText = msgDetails.total_packages === 1 ? 'paquete' : 'paquetes'
          parts.push(`*Total de Paquetes Enviados:* ${msgDetails.total_packages} ${packageText}`)
        }
        
        parts.push('')
        parts.push('*Nota:* El manifiesto está dentro de una de las sacas.')
        
      } else if (entityType === 'pull') {
        // Para sacas: mostrar que es una saca y cuántos paquetes tiene
        parts.push('*Tipo de Envío:* Saca')
        
        if (msgDetails.total_packages !== undefined) {
          const packageText = msgDetails.total_packages === 1 ? 'paquete' : 'paquetes'
          parts.push(`*Cantidad de Paquetes:* ${msgDetails.total_packages} ${packageText}`)
        }
        
        parts.push('')
        parts.push('*Nota:* El manifiesto está dentro de la saca.')
        
      } else if (entityType === 'package') {
        // Para paquetes individuales
        if (msgDetails.total_packages !== undefined) {
          const packageText = msgDetails.total_packages === 1 ? 'paquete' : 'paquetes'
          parts.push(`*Cantidad de Paquetes:* ${msgDetails.total_packages} ${packageText}`)
        }
        
        parts.push('')
        parts.push('*Nota:* El manifiesto se encuentra pegado en el paquete.')
      }
      
      return parts.join('\n')
    }
    
    // Si solo hay mensaje, agregar saludo si no está presente
    if (msg) {
      let formattedMessage = msg
      if (!msg.toLowerCase().includes('buenos días') && 
          !msg.toLowerCase().includes('buenas tardes') && 
          !msg.toLowerCase().includes('buenas noches')) {
        formattedMessage = `${greeting},\n\n${msg}`
      }
      return formattedMessage
    }
    
    return ''
  }

  const formattedMessage = formatMessage(message, details, type, packageStatus)

  const handleCopyToClipboard = async () => {
    if (!formattedMessage) return

    try {
      await navigator.clipboard.writeText(formattedMessage)
      setCopied(true)
      toast.success('Mensaje copiado al portapapeles')
      
      // Resetear el estado de copiado después de 2 segundos
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error)
      toast.error('Error al copiar al portapapeles')
    }
  }

  const handleDownloadManifestPDF = async () => {
    if (!entityId) {
      toast.error('No se puede generar el PDF: ID de entidad no disponible')
      return
    }

    setDownloadingPDF(true)
    try {
      if (type === 'batch') {
        await batchesService.generateManifestPDF(entityId)
      } else if (type === 'pull') {
        await pullsService.generateManifest(entityId)
      } else if (type === 'package') {
        await packagesService.generateManifestPDF(entityId)
      }
      toast.success('PDF del manifiesto descargado. Puedes adjuntarlo a WhatsApp.')
    } catch (error) {
      console.error('Error al descargar PDF:', error)
      toast.error('Error al descargar el PDF del manifiesto')
    } finally {
      setDownloadingPDF(false)
    }
  }

  // Resetear estado del paquete cuando se cierra el modal
  useEffect(() => {
    if (!show) {
      setPackageStatus('')
    }
  }, [show])

  // Copiar automáticamente al abrir el modal (solo si no hay estado seleccionado)
  useEffect(() => {
    if (show && formattedMessage && packageStatus === '') {
      handleCopyToClipboard()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, formattedMessage])

  const getTypeLabel = () => {
    const labels = {
      batch: 'Lote',
      pull: 'Saca',
      package: 'Paquete Individual',
    }
    return labels[type] || 'Entidad'
  }

  if (!message && !details) return null

  return (
    <Modal show={show} onClose={onClose} size="lg">
      <ModalHeader
        icon="fas fa-envelope"
        iconGradient="from-purple-500 to-indigo-600"
      >
        Mensaje de Notificación - {getTypeLabel()}
      </ModalHeader>

      <ModalBody>
        <div className="space-y-4">
          {/* Selector de Estado del Paquete */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado del Paquete:
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="packageStatus"
                  value=""
                  checked={packageStatus === ''}
                  onChange={(e) => setPackageStatus(e.target.value)}
                  className="mr-3 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Sin estado adicional
                </span>
              </label>
              <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="packageStatus"
                  value="dispatching"
                  checked={packageStatus === 'dispatching'}
                  onChange={(e) => setPackageStatus(e.target.value)}
                  className="mr-3 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  El paquete está siendo despachado, y sale hoy en la tarde en ruta
                </span>
              </label>
              <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="packageStatus"
                  value="in_route"
                  checked={packageStatus === 'in_route'}
                  onChange={(e) => setPackageStatus(e.target.value)}
                  className="mr-3 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  El paquete ya está en ruta
                </span>
              </label>
            </div>
          </div>

          {/* Vista previa estilo WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vista Previa (Formato WhatsApp):
            </label>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800 shadow-sm">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                <div 
                  className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed font-sans"
                  style={{ 
                    fontSize: '15px',
                    lineHeight: '1.5',
                    wordWrap: 'break-word'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: formattedMessage
                      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>')
                  }}
                />
              </div>
            </div>
          </div>

          {/* Área de mensaje para copiar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mensaje para copiar:
            </label>
            <textarea
              readOnly
              value={formattedMessage}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              rows={8}
              onClick={(e) => e.target.select()}
            />
          </div>

          {/* Detalles adicionales */}
          {details && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Detalles:
              </h4>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {details.agency_name && (
                  <div className="flex items-center gap-2">
                    <i className="fas fa-truck w-4"></i>
                    <span>Agencia: <strong className="text-gray-900 dark:text-gray-100">{details.agency_name}</strong></span>
                  </div>
                )}
                {details.guide_number && (
                  <div className="flex items-center gap-2">
                    <i className="fas fa-barcode w-4"></i>
                    <span>Número de guía: <strong className="text-gray-900 dark:text-gray-100 font-mono">{details.guide_number}</strong></span>
                  </div>
                )}
                {details.total_packages !== undefined && (
                  <div className="flex items-center gap-2">
                    <i className="fas fa-box w-4"></i>
                    <span>Total de paquetes: <strong className="text-gray-900 dark:text-gray-100">{details.total_packages}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="primary"
            onClick={handleCopyToClipboard}
            icon={copied ? 'fas fa-check' : 'fas fa-copy'}
            iconPosition="left"
            className="min-w-[180px]"
          >
            {copied ? '¡Copiado!' : 'Copiar mensaje'}
          </Button>
          {entityId && (
            <Button
              variant="secondary"
              onClick={handleDownloadManifestPDF}
              icon={downloadingPDF ? 'fas fa-spinner fa-spin' : 'fas fa-file-pdf'}
              iconPosition="left"
              disabled={downloadingPDF}
              className="min-w-[200px]"
            >
              {downloadingPDF ? 'Descargando...' : 'Descargar PDF Manifiesto'}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

MessageModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  message: PropTypes.string,
  details: PropTypes.shape({
    agency_name: PropTypes.string,
    guide_number: PropTypes.string,
    total_packages: PropTypes.number,
    pulls_count: PropTypes.number,
    packages_per_pull: PropTypes.number,
    pulls_list: PropTypes.arrayOf(
      PropTypes.shape({
        number: PropTypes.number,
        total: PropTypes.number,
        packages_count: PropTypes.number,
      })
    ),
  }),
  entityId: PropTypes.string,
  type: PropTypes.oneOf(['batch', 'pull', 'package']),
}

export default MessageModal
