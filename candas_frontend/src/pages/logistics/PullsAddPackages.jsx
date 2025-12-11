import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from 'flowbite-react'
import pullsService from '../../services/pullsService'
import { Card, Button, LoadingSpinner, DataTable, PackageSelector } from '../../components'

const PullsAddPackages = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pull, setPull] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedPackages, setSelectedPackages] = useState([])
  const [currentPackages, setCurrentPackages] = useState([])

  useEffect(() => {
    loadPull()
  }, [id])

  const loadPull = async () => {
    try {
      setLoading(true)
      const data = await pullsService.get(id)
      setPull(data)
      setCurrentPackages(data.packages || [])
    } catch (error) {
      toast.error('Error al cargar la saca')
      console.error(error)
      navigate('/logistica/pulls')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPackages = async () => {
    if (selectedPackages.length === 0) {
      toast.warning('Selecciona al menos un paquete')
      return
    }

    setSaving(true)
    try {
      const packageIds = selectedPackages.map(p => p.id)
      await pullsService.addPackages(id, packageIds)
      toast.success(`${packageIds.length} paquete(s) agregado(s) correctamente`)
      setSelectedPackages([])
      loadPull() // Recargar datos
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al agregar paquetes')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleRemovePackage = async (packageId) => {
    if (!window.confirm('¿Estás seguro de remover este paquete de la saca?')) {
      return
    }

    try {
      await pullsService.removePackages(id, [packageId])
      toast.success('Paquete removido correctamente')
      loadPull() // Recargar datos
    } catch (error) {
      toast.error('Error al remover paquete')
      console.error(error)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Cargando saca..." />
  }

  if (!pull) {
    return null
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <i className="fas fa-boxes text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                Agregar Paquetes a Saca
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {pull.common_destiny}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Paquetes Actuales */}
      <Card header={
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            <i className="fas fa-boxes mr-2"></i>
            Paquetes Actuales ({currentPackages.length})
          </h2>
        </div>
      }>
        {currentPackages.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Guía</TableHeadCell>
                  <TableHeadCell>Destinatario</TableHeadCell>
                  <TableHeadCell>Ciudad</TableHeadCell>
                  <TableHeadCell>Provincia</TableHeadCell>
                  <TableHeadCell>
                    <span className="sr-only">Acciones</span>
                  </TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentPackages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      <span className="font-mono text-sm">{pkg.guide_number}</span>
                    </TableCell>
                    <TableCell>{pkg.name || '-'}</TableCell>
                    <TableCell>{pkg.city || '-'}</TableCell>
                    <TableCell>{pkg.province || '-'}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleRemovePackage(pkg.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Remover de la saca"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <i className="fas fa-box-open text-4xl text-gray-300 dark:text-gray-600 mb-3"></i>
            <p className="text-gray-500 dark:text-gray-400">
              No hay paquetes en esta saca
            </p>
          </div>
        )}
      </Card>

      {/* Agregar Nuevos Paquetes */}
      <Card header={
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          <i className="fas fa-plus-circle mr-2"></i>
          Agregar Nuevos Paquetes
        </h2>
      }>
        <div className="space-y-4">
          <PackageSelector
            selectedPackages={selectedPackages}
            onPackagesChange={setSelectedPackages}
            filterAvailable={true}
            allowBarcode={true}
            allowDropdown={true}
            excludePackageIds={currentPackages.map(p => p.id)}
          />

          {selectedPackages.length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <i className="fas fa-info-circle mr-2"></i>
                <strong>{selectedPackages.length}</strong> paquete(s) seleccionado(s) para agregar
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedPackages([])}
              disabled={selectedPackages.length === 0}
            >
              Limpiar Selección
            </Button>
            <Button
              variant="primary"
              onClick={handleAddPackages}
              disabled={selectedPackages.length === 0 || saving}
              loading={saving}
              icon={!saving && <i className="fas fa-plus"></i>}
            >
              {saving ? 'Agregando...' : `Agregar ${selectedPackages.length} Paquete(s)`}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default PullsAddPackages
