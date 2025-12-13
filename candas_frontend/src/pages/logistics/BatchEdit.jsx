import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import batchesService from '../../services/batchesService'
import transportAgenciesService from '../../services/transportAgenciesService'
import pullsService from '../../services/pullsService'
import { Card, Button, FormField, LoadingSpinner, PackageSelector, Modal, ModalHeader, ModalBody, ModalFooter } from '../../components'

const BatchEdit = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [batch, setBatch] = useState(null)
  const [transportAgencies, setTransportAgencies] = useState([])
  const [availablePulls, setAvailablePulls] = useState([])
  
  const [formData, setFormData] = useState({
    destiny: '',
    transport_agency: '',
    guide_number: '',
  })
  const [errors, setErrors] = useState({})
  
  // Estado para agregar paquetes a una saca
  const [addPackagesModal, setAddPackagesModal] = useState({
    show: false,
    pullId: null,
    pullDestiny: '',
    currentPackages: [],
  })
  const [selectedPackages, setSelectedPackages] = useState([])
  const [addingPackages, setAddingPackages] = useState(false)
  
  // Estado para gestionar paquetes de sacas
  const [expandedPulls, setExpandedPulls] = useState({}) // { pullId: true/false }
  const [pullPackages, setPullPackages] = useState({}) // { pullId: [packages] }
  const [loadingPackages, setLoadingPackages] = useState({}) // { pullId: true/false }
  const [movePackageModal, setMovePackageModal] = useState({
    show: false,
    packageId: null,
    packageInfo: null,
    sourcePullId: null,
  })
  const [removingPackage, setRemovingPackage] = useState(false)
  const [movingPackage, setMovingPackage] = useState(false)

  useEffect(() => {
    loadBatch()
    loadTransportAgencies()
    loadAvailablePulls()
  }, [id])

  const loadBatch = async () => {
    try {
      setInitialLoading(true)
      const data = await batchesService.get(id)
      setBatch(data)
      setFormData({
        destiny: data.destiny || '',
        transport_agency: data.transport_agency || '',
        guide_number: data.guide_number || '',
      })
    } catch (error) {
      console.error('Error cargando lote:', error)
      toast.error('Error al cargar el lote')
      navigate('/logistica/batches')
    } finally {
      setInitialLoading(false)
    }
  }

  const loadTransportAgencies = async () => {
    try {
      const data = await transportAgenciesService.getActive()
      // Asegurar que siempre sea un array
      const agenciesList = data?.results ?? data ?? []
      setTransportAgencies(Array.isArray(agenciesList) ? agenciesList : [])
      console.log('Agencias cargadas:', agenciesList.length)
    } catch (error) {
      console.error('Error cargando agencias:', error)
      console.error('Error response:', error.response?.data)
    }
  }

  const loadAvailablePulls = async () => {
    try {
      const data = await pullsService.list({ batch__isnull: 'true' })
      setAvailablePulls(data.results || data)
    } catch (error) {
      console.error('Error cargando sacas:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setHasChanges(true)
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.destiny.trim()) {
      setErrors({ destiny: 'El destino es requerido' })
      toast.error('El destino es requerido')
      return
    }

    setLoading(true)
    try {
      const updateData = {
        destiny: formData.destiny,
        transport_agency: formData.transport_agency || null,
        guide_number: formData.guide_number || null,
      }

      await batchesService.partialUpdate(id, updateData)
      toast.success('Lote actualizado correctamente')
      setHasChanges(false)
      navigate(`/logistica/batches/${id}`)
    } catch (error) {
      console.error('Error actualizando lote:', error)
      const errorData = error.response?.data
      if (errorData) {
        setErrors(errorData)
        toast.error(errorData.detail || 'Error al actualizar el lote')
      } else {
        toast.error('Error al actualizar el lote')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddPull = async (pullId) => {
    try {
      await batchesService.addPull(id, pullId)
      toast.success('Saca agregada al lote')
      loadBatch()
      loadAvailablePulls()
    } catch (error) {
      console.error('Error agregando saca:', error)
      toast.error(error.response?.data?.error || 'Error al agregar la saca')
    }
  }

  const handleRemovePull = async (pullId) => {
    if (!window.confirm('¿Está seguro de quitar esta saca del lote?')) return

    try {
      await batchesService.removePull(id, pullId)
      toast.success('Saca quitada del lote')
      loadBatch()
      loadAvailablePulls()
    } catch (error) {
      console.error('Error quitando saca:', error)
      toast.error('Error al quitar la saca')
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (!window.confirm('Tienes cambios sin guardar. ¿Estás seguro de salir?')) {
        return
      }
    }
    navigate(`/logistica/batches/${id}`)
  }

  const handleOpenAddPackages = async (pullId, pullDestiny) => {
    try {
      // Cargar información de la saca para obtener los paquetes actuales
      const pullData = await pullsService.get(pullId)
      setAddPackagesModal({
        show: true,
        pullId,
        pullDestiny,
        currentPackages: pullData.packages || [],
      })
      setSelectedPackages([])
    } catch (error) {
      console.error('Error cargando saca:', error)
      toast.error('Error al cargar la información de la saca')
    }
  }

  const handleCloseAddPackages = () => {
    setAddPackagesModal({
      show: false,
      pullId: null,
      pullDestiny: '',
      currentPackages: [],
    })
    setSelectedPackages([])
  }

  const handleAddPackagesToPull = async () => {
    if (selectedPackages.length === 0) {
      toast.warning('Selecciona al menos un paquete')
      return
    }

    setAddingPackages(true)
    try {
      const packageIds = selectedPackages.map(p => p.id)
      await pullsService.addPackages(addPackagesModal.pullId, packageIds)
      toast.success(`${packageIds.length} paquete(s) agregado(s) correctamente`)
      handleCloseAddPackages()
      loadBatch() // Recargar el lote para actualizar la información
      // Recargar paquetes de la saca si está expandida
      if (expandedPulls[addPackagesModal.pullId]) {
        loadPullPackages(addPackagesModal.pullId)
      }
    } catch (error) {
      console.error('Error agregando paquetes:', error)
      toast.error(error.response?.data?.error || 'Error al agregar paquetes')
    } finally {
      setAddingPackages(false)
    }
  }

  const loadPullPackages = async (pullId) => {
    try {
      setLoadingPackages(prev => ({ ...prev, [pullId]: true }))
      const pullData = await pullsService.get(pullId)
      setPullPackages(prev => ({ ...prev, [pullId]: pullData.packages || [] }))
    } catch (error) {
      console.error('Error cargando paquetes de la saca:', error)
      toast.error('Error al cargar los paquetes de la saca')
    } finally {
      setLoadingPackages(prev => ({ ...prev, [pullId]: false }))
    }
  }

  const togglePullExpanded = async (pullId) => {
    const isExpanded = expandedPulls[pullId]
    setExpandedPulls(prev => ({ ...prev, [pullId]: !isExpanded }))
    
    // Cargar paquetes si se está expandiendo y no están cargados
    if (!isExpanded && !pullPackages[pullId]) {
      await loadPullPackages(pullId)
    }
  }

  const handleRemovePackage = async (pullId, packageId) => {
    if (!window.confirm('¿Estás seguro de eliminar este paquete de la saca?')) {
      return
    }

    setRemovingPackage(true)
    try {
      await pullsService.removePackages(pullId, [packageId])
      toast.success('Paquete eliminado de la saca correctamente')
      loadBatch() // Recargar el lote
      // Recargar paquetes de la saca
      await loadPullPackages(pullId)
    } catch (error) {
      console.error('Error eliminando paquete:', error)
      toast.error(error.response?.data?.error || 'Error al eliminar el paquete')
    } finally {
      setRemovingPackage(false)
    }
  }

  const handleOpenMovePackage = (packageId, packageInfo, sourcePullId) => {
    setMovePackageModal({
      show: true,
      packageId,
      packageInfo,
      sourcePullId,
    })
  }

  const handleCloseMovePackage = () => {
    setMovePackageModal({
      show: false,
      packageId: null,
      packageInfo: null,
      sourcePullId: null,
    })
  }

  const handleMovePackage = async (targetPullId) => {
    if (!targetPullId || targetPullId === movePackageModal.sourcePullId) {
      toast.warning('Selecciona una saca diferente')
      return
    }

    setMovingPackage(true)
    try {
      // Primero remover de la saca origen
      await pullsService.removePackages(movePackageModal.sourcePullId, [movePackageModal.packageId])
      // Luego agregar a la saca destino
      await pullsService.addPackages(targetPullId, [movePackageModal.packageId])
      toast.success('Paquete movido correctamente')
      handleCloseMovePackage()
      loadBatch() // Recargar el lote
      // Recargar paquetes de ambas sacas si están expandidas
      if (expandedPulls[movePackageModal.sourcePullId]) {
        await loadPullPackages(movePackageModal.sourcePullId)
      }
      if (expandedPulls[targetPullId]) {
        await loadPullPackages(targetPullId)
      }
    } catch (error) {
      console.error('Error moviendo paquete:', error)
      toast.error(error.response?.data?.error || 'Error al mover el paquete')
    } finally {
      setMovingPackage(false)
    }
  }

  if (initialLoading) {
    return <LoadingSpinner message="Cargando lote..." />
  }

  if (!batch) {
    return <div className="text-red-500">Lote no encontrado</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-layer-group text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Editar Lote
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Modifica la información del lote
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <Card className="border-l-4 border-orange-400">
          <div className="p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <i className="fas fa-info-circle text-orange-500 mr-2"></i>
              Información Básica
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Destino"
                name="destiny"
                value={formData.destiny}
                onChange={handleInputChange}
                required
                error={errors.destiny}
                placeholder="Ej: GUAYAQUIL - ECUADOR"
              />

              <FormField
                label="Agencia de Transporte"
                name="transport_agency"
                type="select"
                value={formData.transport_agency}
                onChange={handleInputChange}
                error={errors.transport_agency}
                options={[
                  { value: '', label: 'Sin agencia' },
                  ...transportAgencies.map(agency => ({
                    value: agency.id,
                    label: agency.name
                  }))
                ]}
              />

              <div className="md:col-span-2">
                <FormField
                  label="Número de Guía"
                  name="guide_number"
                  value={formData.guide_number}
                  onChange={handleInputChange}
                  error={errors.guide_number}
                  placeholder="Ej: LOTE-2025-001"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Gestión de Sacas */}
        <Card className="border-l-4 border-purple-400">
          <div className="p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <i className="fas fa-boxes text-purple-500 mr-2"></i>
              Sacas del Lote ({batch.pulls_list?.length || 0})
            </h2>

            {/* Sacas Actuales */}
            <div className="space-y-2 mb-6">
              {batch.pulls_list && batch.pulls_list.length > 0 ? (
                batch.pulls_list.map(pull => (
                  <div key={pull.id} className="border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {pull.common_destiny}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {pull.packages_count || 0} paquetes • {pull.size || 'MEDIANO'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePullExpanded(pull.id)}
                        >
                          <i className={`fas ${expandedPulls[pull.id] ? 'fa-chevron-up' : 'fa-chevron-down'} mr-1`}></i>
                          {expandedPulls[pull.id] ? 'Ocultar' : 'Ver'} Paquetes
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenAddPackages(pull.id, pull.common_destiny)}
                        >
                          <i className="fas fa-plus mr-1"></i>
                          Agregar Paquetes
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemovePull(pull.id)}
                        >
                          <i className="fas fa-minus mr-1"></i>
                          Quitar
                        </Button>
                      </div>
                    </div>
                    
                    {/* Lista de paquetes expandida */}
                    {expandedPulls[pull.id] && (
                      <div className="p-3 bg-white dark:bg-gray-800 border-t border-purple-200 dark:border-purple-800">
                        {loadingPackages[pull.id] ? (
                          <div className="text-center py-4">
                            <LoadingSpinner size="sm" />
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Cargando paquetes...</p>
                          </div>
                        ) : pullPackages[pull.id] && pullPackages[pull.id].length > 0 ? (
                          <div className="space-y-2">
                            {pullPackages[pull.id].map((pkg) => (
                              <div key={pkg.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                                    {pkg.guide_number || pkg.id?.substring(0, 8)}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {pkg.name || 'Sin nombre'} • {pkg.city || 'Sin ciudad'}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenMovePackage(pkg.id, pkg, pull.id)}
                                    title="Mover a otra saca"
                                  >
                                    <i className="fas fa-exchange-alt"></i>
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleRemovePackage(pull.id, pkg.id)}
                                    disabled={removingPackage}
                                    title="Eliminar de la saca"
                                  >
                                    <i className="fas fa-trash"></i>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                            <i className="fas fa-box-open text-2xl mb-2 opacity-50"></i>
                            <p className="text-sm">No hay paquetes en esta saca</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <i className="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                  <p>No hay sacas en este lote</p>
                </div>
              )}
            </div>

            {/* Sacas Disponibles */}
            {availablePulls.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                  Agregar Sacas Disponibles
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availablePulls
                    .filter(pull => pull.common_destiny === formData.destiny)
                    .map(pull => (
                      <div key={pull.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {pull.common_destiny}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {pull.packages_count || 0} paquetes • {pull.size || 'MEDIANO'}
                          </div>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAddPull(pull.id)}
                        >
                          <i className="fas fa-plus mr-1"></i>
                          Agregar
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Botones de Acción */}
        <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={loading}
            className="w-auto px-6 py-3"
          >
            <i className="fas fa-times mr-2"></i>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-auto px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Modal para Agregar Paquetes a una Saca */}
      <Modal 
        show={addPackagesModal.show} 
        onClose={handleCloseAddPackages}
        size="lg"
      >
        <ModalHeader
          icon="fas fa-boxes"
          iconGradient="from-purple-500 to-violet-600"
        >
          Agregar Paquetes a Saca
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                <i className="fas fa-map-marker-alt mr-2 text-purple-500"></i>
                {addPackagesModal.pullDestiny}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {addPackagesModal.currentPackages.length} paquete(s) actual(es) en esta saca
              </p>
            </div>

            <PackageSelector
              selectedPackages={selectedPackages}
              onPackagesChange={setSelectedPackages}
              filterAvailable={true}
              allowBarcode={true}
              allowDropdown={true}
              excludePackageIds={addPackagesModal.currentPackages.map(p => p.id)}
              label="Seleccionar Paquetes para Agregar"
            />

            {selectedPackages.length > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <i className="fas fa-info-circle mr-2"></i>
                  <strong>{selectedPackages.length}</strong> paquete(s) seleccionado(s) para agregar
                </p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex gap-2 flex-wrap w-full">
            <Button
              variant="ghost"
              onClick={handleCloseAddPackages}
              disabled={addingPackages}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="ghost"
              onClick={() => setSelectedPackages([])}
              disabled={selectedPackages.length === 0 || addingPackages}
            >
              Limpiar
            </Button>
            <Button
              variant="primary"
              onClick={handleAddPackagesToPull}
              disabled={selectedPackages.length === 0 || addingPackages}
              loading={addingPackages}
              icon={!addingPackages && <i className="fas fa-plus"></i>}
            >
              {addingPackages ? 'Agregando...' : `Agregar ${selectedPackages.length} Paquete(s)`}
            </Button>
          </div>
        </ModalFooter>
      </Modal>

      {/* Modal para Mover Paquete a otra Saca */}
      <Modal 
        show={movePackageModal.show} 
        onClose={handleCloseMovePackage}
        size="md"
      >
        <ModalHeader
          icon="fas fa-exchange-alt"
          iconGradient="from-blue-500 to-cyan-600"
        >
          Mover Paquete a otra Saca
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {movePackageModal.packageInfo && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  <i className="fas fa-box mr-2 text-blue-500"></i>
                  Paquete: {movePackageModal.packageInfo.guide_number || movePackageModal.packageInfo.id?.substring(0, 8)}
                </p>
                {movePackageModal.packageInfo.name && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {movePackageModal.packageInfo.name}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seleccionar Saca Destino:
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {batch.pulls_list && batch.pulls_list.length > 0 ? (
                  batch.pulls_list
                    .filter(pull => pull.id !== movePackageModal.sourcePullId)
                    .map(pull => (
                      <button
                        key={pull.id}
                        onClick={() => handleMovePackage(pull.id)}
                        disabled={movingPackage}
                        className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {pull.common_destiny}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {pull.packages_count || 0} paquetes • {pull.size || 'MEDIANO'}
                        </div>
                      </button>
                    ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No hay otras sacas disponibles
                  </p>
                )}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={handleCloseMovePackage}
            disabled={movingPackage}
            className="w-full"
          >
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default BatchEdit
