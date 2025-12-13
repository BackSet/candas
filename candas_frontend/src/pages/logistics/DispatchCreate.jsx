import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import dispatchesService from '../../services/dispatchesService'
import pullsService from '../../services/pullsService'
import batchesService from '../../services/batchesService'
import { Card, Button, FormField, PullSelector, BatchSelector, PackageSelector } from '../../components'

const DispatchCreate = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    dispatch_date: new Date().toISOString().split('T')[0],
    status: 'PLANIFICADO',
    notes: '',
  })
  const [selectedBatches, setSelectedBatches] = useState([])
  const [selectedPulls, setSelectedPulls] = useState([])
  const [selectedIndividualPackages, setSelectedIndividualPackages] = useState([])
  const [loading, setLoading] = useState(false)
  const [pullsDetails, setPullsDetails] = useState({}) // Almacenar detalles de las sacas seleccionadas
  const [batchesDetails, setBatchesDetails] = useState({}) // Almacenar detalles de los lotes seleccionados

  const STATUS_CHOICES = [
    { value: 'PLANIFICADO', label: 'Planificado' },
    { value: 'EN_CURSO', label: 'En Curso' },
    { value: 'COMPLETADO', label: 'Completado' },
    { value: 'CANCELADO', label: 'Cancelado' },
  ]

  // Cargar detalles de las sacas seleccionadas para obtener sus paquetes
  useEffect(() => {
    const loadPullsDetails = async () => {
      const newDetails = {}
      const pullsToLoad = selectedPulls.filter(pull => !pullsDetails[pull.id])
      
      if (pullsToLoad.length === 0) return
      
      try {
        await Promise.all(
          pullsToLoad.map(async (pull) => {
            try {
              const details = await pullsService.get(pull.id)
              newDetails[pull.id] = details
            } catch (error) {
              console.error(`Error al cargar detalles de saca ${pull.id}:`, error)
            }
          })
        )
        
        if (Object.keys(newDetails).length > 0) {
          setPullsDetails(prev => ({ ...prev, ...newDetails }))
        }
      } catch (error) {
        console.error('Error al cargar detalles de sacas:', error)
      }
    }
    
    loadPullsDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPulls.map(p => p.id).join(',')])

  // Limpiar detalles de sacas que ya no están seleccionadas
  useEffect(() => {
    const selectedIds = new Set(selectedPulls.map(p => p.id))
    setPullsDetails(prev => {
      const filtered = {}
      Object.keys(prev).forEach(id => {
        if (selectedIds.has(id)) {
          filtered[id] = prev[id]
        }
      })
      return filtered
    })
  }, [selectedPulls])

  // Cargar detalles de los lotes seleccionados para obtener sus sacas
  useEffect(() => {
    const loadBatchesDetails = async () => {
      const newDetails = {}
      const batchesToLoad = selectedBatches.filter(batch => !batchesDetails[batch.id])
      
      if (batchesToLoad.length === 0) return
      
      try {
        await Promise.all(
          batchesToLoad.map(async (batch) => {
            try {
              const details = await batchesService.get(batch.id)
              console.log('Detalles de lote cargados:', batch.id, 'pulls_list:', details.pulls_list)
              newDetails[batch.id] = details
            } catch (error) {
              console.error(`Error al cargar detalles de lote ${batch.id}:`, error)
              console.error('Error response:', error.response?.data)
            }
          })
        )
        
        if (Object.keys(newDetails).length > 0) {
          console.log('Actualizando batchesDetails con:', Object.keys(newDetails).length, 'lotes')
          setBatchesDetails(prev => ({ ...prev, ...newDetails }))
        }
      } catch (error) {
        console.error('Error al cargar detalles de lotes:', error)
      }
    }
    
    loadBatchesDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatches.map(b => b.id).join(',')])

  // Limpiar detalles de lotes que ya no están seleccionados
  useEffect(() => {
    const selectedIds = new Set(selectedBatches.map(b => b.id))
    setBatchesDetails(prev => {
      const filtered = {}
      Object.keys(prev).forEach(id => {
        if (selectedIds.has(id)) {
          filtered[id] = prev[id]
        }
      })
      return filtered
    })
  }, [selectedBatches])

  // Agregar sacas de lotes seleccionados automáticamente
  useEffect(() => {
    const pullsFromBatches = []
    const pullIds = new Set(selectedPulls.map(p => p.id))
    
    Object.values(batchesDetails).forEach(batchDetail => {
      // El serializer devuelve 'pulls_list' no 'pulls'
      const pulls = batchDetail.pulls_list || batchDetail.pulls
      console.log('Batch detail:', batchDetail.id, 'pulls_list:', pulls)
      if (pulls && Array.isArray(pulls)) {
        pulls.forEach(pull => {
          if (!pullIds.has(pull.id)) {
            pullsFromBatches.push(pull)
            pullIds.add(pull.id)
          }
        })
      }
    })
    
    if (pullsFromBatches.length > 0) {
      console.log('Agregando sacas automáticamente:', pullsFromBatches.length)
      setSelectedPulls(prev => [...prev, ...pullsFromBatches])
    }
  }, [batchesDetails, selectedPulls])

  // Obtener IDs de sacas que están en los lotes seleccionados
  const pullsInSelectedBatches = useMemo(() => {
    const pullIds = new Set()
    Object.values(batchesDetails).forEach(batchDetail => {
      // El serializer devuelve 'pulls_list' no 'pulls'
      const pulls = batchDetail.pulls_list || batchDetail.pulls
      if (pulls && Array.isArray(pulls)) {
        pulls.forEach(pull => {
          pullIds.add(pull.id)
        })
      }
    })
    return Array.from(pullIds)
  }, [batchesDetails])

  // Obtener IDs de paquetes que están en las sacas seleccionadas y en lotes
  const packagesInSelectedPulls = useMemo(() => {
    const packageIds = new Set()
    Object.values(pullsDetails).forEach(pullDetail => {
      if (pullDetail.packages && Array.isArray(pullDetail.packages)) {
        pullDetail.packages.forEach(pkg => {
          packageIds.add(pkg.id)
        })
      }
    })
    
    // También incluir paquetes de sacas que están en lotes seleccionados
    Object.values(batchesDetails).forEach(batchDetail => {
      // El serializer devuelve 'pulls_list' no 'pulls'
      const pulls = batchDetail.pulls_list || batchDetail.pulls
      if (pulls && Array.isArray(pulls)) {
        pulls.forEach(pull => {
          if (pull.packages && Array.isArray(pull.packages)) {
            pull.packages.forEach(pkg => {
              packageIds.add(pkg.id)
            })
          }
        })
      }
    })
    
    return Array.from(packageIds)
  }, [pullsDetails, batchesDetails])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.dispatch_date) {
      toast.error('La fecha de despacho es obligatoria')
      return
    }

    if (selectedBatches.length === 0 && selectedPulls.length === 0 && selectedIndividualPackages.length === 0) {
      toast.error('Debes agregar al menos un lote, una saca o un paquete individual')
      return
    }

    setLoading(true)
    try {
      // Obtener todas las sacas: las seleccionadas directamente + las de los lotes
      const allPullIds = new Set(selectedPulls.map((p) => p.id))
      
      // Agregar sacas de lotes seleccionados
      Object.values(batchesDetails).forEach(batchDetail => {
        const pulls = batchDetail.pulls_list || batchDetail.pulls || []
        if (Array.isArray(pulls)) {
          pulls.forEach(pull => {
            if (pull && pull.id) {
              allPullIds.add(pull.id)
            }
          })
        }
      })
      
      const pullIds = Array.from(allPullIds)
      const packageIds = selectedIndividualPackages.map((p) => p.id)
      
      const data = {
        ...formData,
        pull_ids: pullIds,
        package_ids: packageIds,
      }
      
      await dispatchesService.create(data)
      toast.success('Despacho creado correctamente')
      navigate('/logistica/dispatches')
    } catch (error) {
      console.error('Error al crear despacho:', error)
      toast.error(error.response?.data?.detail || 'Error al crear el despacho')
    } finally {
      setLoading(false)
    }
  }

  const getTotalItems = () => {
    // Contar paquetes en lotes
    const packagesInBatches = Object.values(batchesDetails).reduce((sum, batchDetail) => {
      return sum + (batchDetail.total_packages || 0)
    }, 0)
    
    // Contar paquetes en sacas individuales (que no están en lotes)
    const pullsNotInBatches = selectedPulls.filter(pull => !pullsInSelectedBatches.includes(pull.id))
    const packagesInPulls = pullsNotInBatches.reduce((sum, pull) => {
      return sum + (pull.packages_count || pull.packages?.length || 0)
    }, 0)
    
    return {
      batches: selectedBatches.length,
      pulls: selectedPulls.length,
      individualPackages: selectedIndividualPackages.length,
      totalPackages: packagesInBatches + packagesInPulls + selectedIndividualPackages.length,
    }
  }

  const totals = getTotalItems()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-shipping-fast text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Crear Despacho
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Agrupa sacas y paquetes para un envío específico por fecha
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Despacho */}
        <Card header={
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Información del Despacho
          </h2>
        }>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Fecha de Despacho"
                name="dispatch_date"
                type="date"
                value={formData.dispatch_date}
                onChange={handleInputChange}
                required
              />
              
              <FormField
                label="Estado"
                name="status"
                type="select"
                value={formData.status}
                onChange={handleInputChange}
                required
                options={STATUS_CHOICES}
              />
            </div>

            <FormField
              label="Notas"
              name="notes"
              type="textarea"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Observaciones o instrucciones especiales..."
              rows={3}
            />
          </div>
        </Card>

        {/* Resumen */}
        {(selectedBatches.length > 0 || selectedPulls.length > 0 || selectedIndividualPackages.length > 0) && (
          <Card>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-orange-600 dark:text-orange-400">Lotes</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {totals.batches}
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400">Sacas</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {totals.pulls}
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">Paq. Individuales</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {totals.individualPackages}
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-purple-600 dark:text-purple-400">Total Paquetes</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {totals.totalPackages}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Agregar Lotes */}
        <Card header={
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Agregar Lotes al Despacho
          </h2>
        }>
          <BatchSelector
            selectedBatches={selectedBatches}
            onBatchesChange={setSelectedBatches}
            filterAvailable={false}
            label="Seleccionar Lotes"
          />
          <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              <i className="fas fa-info-circle mr-2"></i>
              Al seleccionar un lote, todas sus sacas se agregarán automáticamente al despacho.
            </p>
          </div>
        </Card>

        {/* Agregar Sacas */}
        <Card header={
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Agregar Sacas al Despacho
          </h2>
        }>
          <PullSelector
            selectedPulls={selectedPulls}
            onPullsChange={setSelectedPulls}
            filterAvailable={true}
            label="Seleccionar Sacas Individuales"
            excludePullIds={pullsInSelectedBatches}
          />
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <i className="fas fa-info-circle mr-2"></i>
              Solo se muestran sacas individuales (que no tienen asociado ningún lote y no están en otro despacho). Las sacas de lotes seleccionados se agregan automáticamente.
            </p>
          </div>
        </Card>

        {/* Agregar Paquetes Individuales */}
        <Card header={
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Agregar Paquetes Individuales
          </h2>
        }>
          <PackageSelector
            selectedPackages={selectedIndividualPackages}
            onPackagesChange={setSelectedIndividualPackages}
            filterAvailable={true}
            allowBarcode={true}
            allowDropdown={true}
            label="Seleccionar Paquetes Individuales"
            excludePackageIds={packagesInSelectedPulls}
          />
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <i className="fas fa-info-circle mr-2"></i>
              Solo se muestran paquetes de envío individual (que no pertenecen a una saca ni a un lote, pero tienen agencia de transporte asignada). Los paquetes que están en sacas o lotes seleccionados se excluyen automáticamente.
            </p>
          </div>
        </Card>

        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/logistica/dispatches')}
            disabled={loading}
            className="w-auto px-6 py-3"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            loading={loading}
            icon={!loading && <i className="fas fa-save"></i>}
            className="w-auto px-6 py-3"
          >
            {loading ? 'Creando...' : 'Crear Despacho'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default DispatchCreate
