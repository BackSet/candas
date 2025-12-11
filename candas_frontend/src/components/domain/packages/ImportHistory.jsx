import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from 'flowbite-react'
import { Card, Button, LoadingSpinner, EmptyState, Modal, ModalHeader, ModalBody, ModalFooter } from '../../'
import { packagesService } from '../../../services/packagesService'

const ImportHistory = () => {
  const [imports, setImports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedErrorLog, setSelectedErrorLog] = useState(null)
  const [showErrorModal, setShowErrorModal] = useState(false)

  useEffect(() => {
    loadImportHistory()
  }, [])

  const loadImportHistory = async () => {
    try {
      setLoading(true)
      const data = await packagesService.getImportHistory(20)
      setImports(data)
    } catch (error) {
      console.error('Error al cargar historial:', error)
      toast.error('Error al cargar el historial de importaciones')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDIENTE': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: 'fa-clock' },
      'PROCESANDO': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: 'fa-spinner fa-spin' },
      'COMPLETADO': { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: 'fa-check-circle' },
      'ERROR': { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: 'fa-exclamation-circle' },
    }

    const config = statusConfig[status] || statusConfig['PENDIENTE']

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <i className={`fas ${config.icon}`}></i>
        {status}
      </span>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSuccessRate = (importRecord) => {
    if (importRecord.total_rows === 0) return 0
    return Math.round((importRecord.successful_imports / importRecord.total_rows) * 100)
  }

  const handleViewErrors = (importRecord) => {
    setSelectedErrorLog(importRecord)
    setShowErrorModal(true)
  }

  const handleCloseModal = () => {
    setShowErrorModal(false)
    setSelectedErrorLog(null)
  }

  if (loading) {
    return (
      <Card>
        <div className="p-8 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <i className="fas fa-history text-gray-600 dark:text-gray-400"></i>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Historial de Importaciones
              </h2>
            </div>
            <Button variant="ghost" size="sm" onClick={loadImportHistory}>
              <i className="fas fa-sync-alt"></i>
            </Button>
          </div>

          {imports.length === 0 ? (
            <EmptyState
              icon="fa-inbox"
              title="No hay importaciones"
              message="Aún no se han realizado importaciones de paquetes"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableHeadCell>Fecha</TableHeadCell>
                  <TableHeadCell className="text-center">Estado</TableHeadCell>
                  <TableHeadCell className="text-center">Total</TableHeadCell>
                  <TableHeadCell className="text-center">Exitosos</TableHeadCell>
                  <TableHeadCell className="text-center">Errores</TableHeadCell>
                  <TableHeadCell className="text-center">Tasa de Éxito</TableHeadCell>
                  <TableHeadCell className="text-center">Acciones</TableHeadCell>
                </TableHead>
                <TableBody className="divide-y">
                  {imports.map((importRecord) => {
                    const successRate = getSuccessRate(importRecord)
                    
                    return (
                      <TableRow key={importRecord.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                        <TableCell>
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {formatDate(importRecord.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(importRecord.status)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{importRecord.total_rows}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {importRecord.successful_imports}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            {importRecord.failed_imports}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  successRate === 100
                                    ? 'bg-green-500'
                                    : successRate >= 80
                                    ? 'bg-blue-500'
                                    : successRate >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${successRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{successRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {importRecord.error_log && importRecord.failed_imports > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewErrors(importRecord)}
                              title="Ver errores"
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de errores */}
      <Modal show={showErrorModal && selectedErrorLog} onClose={handleCloseModal} size="4xl">
        <ModalHeader
          icon="fas fa-exclamation-triangle"
          iconGradient="from-red-500 to-rose-600"
          subtitle={selectedErrorLog ? `Importación del ${formatDate(selectedErrorLog.created_at)}` : ''}
        >
          Errores de Importación
        </ModalHeader>
        <ModalBody>
          {selectedErrorLog && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
              <pre className="text-sm text-red-400 whitespace-pre-wrap font-mono leading-relaxed">
                {selectedErrorLog.error_log}
              </pre>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <div className="flex justify-end w-full">
            <Button variant="primary" onClick={handleCloseModal}>
              <i className="fas fa-times mr-2"></i>
              Cerrar
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default ImportHistory
