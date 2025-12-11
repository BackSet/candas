import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '../../ui'
import PackageList from './PackageList'
import PackageSelector from './PackageSelector'
import PackageChildForm from './PackageChildForm'
import packagesService from '../../../services/packagesService'
import logger from '../../../utils/logger'

const PackageChildrenManager = ({ parentPackage, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('create') // 'create' o 'associate'
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingChildren, setLoadingChildren] = useState(true)
  const [selectedPackages, setSelectedPackages] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    loadChildren()
  }, [parentPackage?.id])

  const loadChildren = async () => {
    if (!parentPackage?.id) return

    try {
      setLoadingChildren(true)
      
      // Obtener todos los hijos con un page_size grande para evitar paginación
      const response = await packagesService.list({ 
        parent: parentPackage.id,
        page_size: 10000 // Suficientemente grande para obtener todos los hijos
      })
      
      // Manejar respuesta paginada o no paginada
      let childrenList = []
      if (response.results && Array.isArray(response.results)) {
        childrenList = response.results
      } else if (Array.isArray(response)) {
        childrenList = response
      } else if (response.data && Array.isArray(response.data)) {
        childrenList = response.data
      }
      
      setChildren(childrenList)
    } catch (error) {
      logger.error('Error cargando hijos:', error)
      toast.error('Error al cargar los paquetes hijos')
    } finally {
      setLoadingChildren(false)
    }
  }

  const handleCreateChild = async (childData) => {
    // El componente PackageChildForm ya maneja la creación
    // Solo necesitamos recargar la lista
    await loadChildren()
    if (onSuccess) {
      onSuccess()
    }
  }

  const handleAssociateChildren = async () => {
    if (selectedPackages.length === 0) {
      toast.error('Seleccione al menos un paquete para asociar')
      return
    }

    // Validar que no se esté intentando asociar el padre como hijo
    const invalidPackages = selectedPackages.filter(
      pkg => pkg.id === parentPackage.id
    )
    if (invalidPackages.length > 0) {
      toast.error('No se puede asociar el paquete padre como hijo de sí mismo')
      return
    }

    // Validar que los paquetes seleccionados no tengan ya un padre
    // Usar is_child si está disponible, sino verificar parent
    const packagesWithParent = selectedPackages.filter(
      pkg => (pkg.is_child !== undefined ? pkg.is_child : (pkg.parent && pkg.parent !== null))
    )
    if (packagesWithParent.length > 0) {
      const packageNumbers = packagesWithParent.map(p => p.guide_number).join(', ')
      toast.error(
        `Los siguientes paquetes ya tienen un padre asignado: ${packageNumbers}. Primero debe remover su padre actual.`,
        { autoClose: 5000 }
      )
      return
    }

    // Validar que no se esté intentando crear un ciclo
    // Verificar si alguno de los paquetes seleccionados es ancestro del padre
    const selectedIds = new Set(selectedPackages.map(p => p.id))
    const checkForCycle = (packageId) => {
      // Si el paquete seleccionado es el padre, hay ciclo
      if (packageId === parentPackage.id) {
        return true
      }
      // Verificar recursivamente los ancestros
      const selectedPkg = selectedPackages.find(p => p.id === packageId)
      if (selectedPkg && selectedPkg.parent && selectedIds.has(selectedPkg.parent)) {
        return true
      }
      return false
    }

    const hasCycle = selectedPackages.some(pkg => {
      if (pkg.parent) {
        return checkForCycle(pkg.parent)
      }
      return false
    })

    if (hasCycle) {
      toast.error('No se puede asociar estos paquetes porque se crearía un ciclo en la jerarquía')
      return
    }

    setLoading(true)
    try {
      const childIds = selectedPackages.map(pkg => pkg.id)
      const result = await packagesService.associateChildren(parentPackage.id, childIds)
      
      // Manejar respuesta del nuevo endpoint
      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors.map(e => 
          `${e.guide_number || e.child_id}: ${e.error}`
        ).join('\n')
        toast.warning(
          `Se asociaron ${result.associated || 0} paquete(s), pero ${result.failed || 0} fallaron:\n${errorMessages}`,
          { autoClose: 7000 }
        )
      } else {
        toast.success(`${result.associated || selectedPackages.length} paquete(s) asociado(s) exitosamente`)
      }
      
      // Recargar lista de hijos
      await loadChildren()
      
      // Limpiar selección
      setSelectedPackages([])
      
      // Cambiar a la pestaña de lista para ver los resultados
      setActiveTab('list')
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      logger.error('Error asociando hijos:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Error al asociar paquetes'
      
      // Mostrar errores específicos si vienen del backend
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        const errorMessages = errors.map(e => 
          `${e.guide_number || e.child_id}: ${e.error}`
        ).join('\n')
        toast.error(`Error al asociar paquetes:\n${errorMessages}`, { autoClose: 7000 })
      } else if (error.response?.data?.details) {
        const details = error.response.data.details
        if (typeof details === 'object') {
          const errorMessages = Object.entries(details)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n')
          toast.error(`Error de validación:\n${errorMessages}`, { autoClose: 6000 })
        } else {
          toast.error(errorMessage)
        }
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveChild = async (childId) => {
    if (!window.confirm('¿Está seguro de que desea remover este paquete hijo?')) {
      return
    }

    setLoading(true)
    try {
      // Actualizar el paquete para remover el parent
      await packagesService.partialUpdate(childId, { parent: null })
      
      toast.success('Paquete hijo removido exitosamente')
      
      // Recargar lista
      await loadChildren()
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      logger.error('Error removiendo hijo:', error)
      toast.error('Error al remover el paquete hijo')
    } finally {
      setLoading(false)
    }
  }

  const handleChildClick = (pkg) => {
    // Navegar al detalle del paquete hijo
    window.location.href = `/paquetes/${pkg.id}`
  }

  return (
    <>
      <Modal show={true} onClose={onClose} size="4xl">
        <ModalHeader
          icon="fas fa-sitemap"
          iconGradient="from-indigo-500 to-purple-600"
          subtitle={`Gestionar paquetes hijos de ${parentPackage?.guide_number || 'padre'}`}
        >
          Gestionar Paquetes Hijos
        </ModalHeader>

        <ModalBody>
          <div className="space-y-6">
            {/* Pestañas */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === 'create'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <i className="fas fa-plus-circle mr-2"></i>
                  Crear Nuevo Hijo
                </button>
                <button
                  onClick={() => setActiveTab('associate')}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === 'associate'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <i className="fas fa-link mr-2"></i>
                  Asociar Existente
                </button>
                <button
                  onClick={() => setActiveTab('list')}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === 'list'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <i className="fas fa-list mr-2"></i>
                  Hijos Existentes ({children.length})
                </button>
              </nav>
            </div>

            {/* Contenido de pestañas */}
            <div className="min-h-[300px]">
              {activeTab === 'create' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <i className="fas fa-info-circle mr-2"></i>
                      Cree un nuevo paquete hijo asociado a este padre. Si no proporciona un número de guía, se generará automáticamente.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => setShowCreateForm(true)}
                    className="w-full"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Crear Nuevo Paquete Hijo
                  </Button>
                </div>
              )}

              {activeTab === 'associate' && (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <p className="text-sm text-green-800 dark:text-green-300 mb-2">
                      <i className="fas fa-info-circle mr-2"></i>
                      Seleccione paquetes existentes para asociarlos como hijos de este padre.
                    </p>
                    <ul className="text-xs text-green-700 dark:text-green-400 list-disc list-inside space-y-1 mt-2">
                      <li>Los paquetes seleccionados no deben tener un padre asignado</li>
                      <li>No se puede asociar el paquete padre como hijo de sí mismo</li>
                      <li>No se pueden crear ciclos en la jerarquía</li>
                    </ul>
                  </div>
                  <PackageSelector
                    selectedPackages={selectedPackages}
                    onPackagesChange={setSelectedPackages}
                    filterAvailable={false} // Permitir seleccionar cualquier paquete
                    allowBarcode={true}
                    allowDropdown={true}
                    label="Seleccionar Paquetes para Asociar"
                    excludeWithParent={true} // Excluir paquetes que ya tienen padre
                    excludePackageIds={[parentPackage.id]} // Excluir el paquete padre
                  />
                  {selectedPackages.length > 0 && (
                    <div className="space-y-3">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg">
                        <p className="text-sm text-indigo-800 dark:text-indigo-300">
                          <i className="fas fa-check-circle mr-2"></i>
                          <strong>{selectedPackages.length}</strong> paquete(s) seleccionado(s) para asociar
                        </p>
                      </div>
                      
                      {/* Mostrar advertencias si hay paquetes con problemas */}
                      {selectedPackages.some(pkg => pkg.id === parentPackage.id) && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                          <p className="text-sm text-red-800 dark:text-red-300">
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            No se puede asociar el paquete padre como hijo de sí mismo
                          </p>
                        </div>
                      )}
                      
                      {selectedPackages.some(pkg => (pkg.is_child !== undefined ? pkg.is_child : (pkg.parent && pkg.parent !== null))) && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                          <p className="text-sm text-yellow-800 dark:text-yellow-300">
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            Algunos paquetes seleccionados ya tienen un padre. Debe remover su padre actual primero.
                          </p>
                          <ul className="text-xs text-yellow-700 dark:text-yellow-400 list-disc list-inside mt-2 ml-4">
                            {selectedPackages
                              .filter(pkg => (pkg.is_child !== undefined ? pkg.is_child : (pkg.parent && pkg.parent !== null)))
                              .map(pkg => (
                                <li key={pkg.id}>{pkg.guide_number}</li>
                              ))
                            }
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'list' && (
                <div className="space-y-4">
                  {loadingChildren ? (
                    <div className="text-center py-8">
                      <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
                      <p className="text-gray-500 dark:text-gray-400 mt-2">Cargando hijos...</p>
                    </div>
                  ) : children.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <i className="fas fa-box-open text-4xl text-gray-400 mb-3"></i>
                      <p className="text-gray-500 dark:text-gray-400">No hay paquetes hijos asociados</p>
                    </div>
                  ) : (
                    <PackageList
                      packages={children}
                      onRemove={handleRemoveChild}
                      onItemClick={handleChildClick}
                      showRemove={true}
                      showStatus={true}
                      stacked={false}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cerrar
          </Button>
          {activeTab === 'associate' && (
            <Button
              variant="primary"
              onClick={handleAssociateChildren}
              loading={loading}
              disabled={selectedPackages.length === 0}
            >
              <i className="fas fa-link mr-2"></i>
              Asociar {selectedPackages.length > 0 ? `(${selectedPackages.length})` : ''}
            </Button>
          )}
        </ModalFooter>
      </Modal>

      {/* Modal para crear nuevo hijo */}
      {showCreateForm && (
        <PackageChildForm
          parentPackage={parentPackage}
          onClose={() => setShowCreateForm(false)}
          onSuccess={(childData) => {
            setShowCreateForm(false)
            handleCreateChild(childData)
            setActiveTab('list') // Cambiar a la pestaña de lista después de crear
          }}
        />
      )}
    </>
  )
}

export default PackageChildrenManager

