import { useState } from 'react'
import { toast } from 'react-toastify'
import { Card, Button, LoadingSpinner } from '../../components'
import excelMapperService from '../../services/excelMapperService'

const ExcelMapper = () => {
  const [file, setFile] = useState(null)
  const [columns, setColumns] = useState([])
  const [sampleRows, setSampleRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [mapping, setMapping] = useState({
    fecha: 'today',
    hora: 'now',
    hawb: '',
    estado: '',
    observacion_agency: '',
    observacion_col1: '',
    observacion_col2: '',
  })

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setColumns([])
      setSampleRows([])
      setMapping({
        fecha: 'today',
        hora: 'now',
        hawb: '',
        estado: '',
        observacion_agency: '',
        observacion_col1: '',
        observacion_col2: '',
      })
    }
  }

  const handleReadColumns = async () => {
    if (!file) {
      toast.error('Por favor selecciona un archivo Excel')
      return
    }

    setLoading(true)
    try {
      const data = await excelMapperService.readColumns(file)
      setColumns(data.columns)
      setSampleRows(data.sample_rows)
      toast.success(`Archivo leído correctamente. ${data.total_rows} filas encontradas.`)
    } catch (error) {
      console.error('Error leyendo columnas:', error)
      toast.error(error.response?.data?.error || 'Error al leer el archivo Excel')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateOutput = async () => {
    if (!file) {
      toast.error('Por favor selecciona un archivo Excel')
      return
    }

    if (!mapping.hawb) {
      toast.error('Por favor mapea la columna HAWB/REFERENCIA')
      return
    }

    setLoading(true)
    try {
      await excelMapperService.generateOutput(file, mapping)
      toast.success('Excel generado y descargado correctamente')
    } catch (error) {
      console.error('Error generando Excel:', error)
      toast.error(error.response?.data?.error || 'Error al generar el Excel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <i className="fas fa-file-excel text-2xl text-white"></i>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Mapeador de Excel
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Mapea un Excel de entrada al formato de manifiesto personalizado
            </p>
          </div>
        </div>
      </div>

      {/* Subir Archivo */}
      <Card className="border-l-4 border-blue-400">
        <div className="p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <i className="fas fa-upload mr-2 text-blue-500"></i>
            Subir Archivo Excel
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seleccionar archivo Excel (.xlsx, .xls)
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  dark:file:bg-blue-900/20 dark:file:text-blue-300
                  dark:hover:file:bg-blue-900/30"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  Archivo seleccionado: {file.name}
                </p>
              )}
            </div>
            <Button
              variant="primary"
              onClick={handleReadColumns}
              disabled={!file || loading}
              loading={loading}
            >
              <i className="fas fa-search mr-2"></i>
              Leer Columnas del Archivo
            </Button>
          </div>
        </div>
      </Card>

      {/* Columnas Encontradas */}
      {columns.length > 0 && (
        <Card className="border-l-4 border-green-400">
          <div className="p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <i className="fas fa-columns mr-2 text-green-500"></i>
              Columnas Encontradas ({columns.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {columns.map((col, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                >
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">#{idx}</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{col}</p>
                </div>
              ))}
            </div>

            {/* Filas de Ejemplo */}
            {sampleRows.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Filas de Ejemplo:
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="px-2 py-1 text-left border">Fila</th>
                        {columns.map((col, idx) => (
                          <th key={idx} className="px-2 py-1 text-left border">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sampleRows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-t">
                          <td className="px-2 py-1 border font-mono text-xs">{row.row}</td>
                          {row.data.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-2 py-1 border text-xs">
                              {cell || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Mapeo de Columnas */}
      {columns.length > 0 && (
        <Card className="border-l-4 border-purple-400">
          <div className="p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <i className="fas fa-map mr-2 text-purple-500"></i>
              Configurar Mapeo
            </h2>
            <div className="space-y-4">
              {/* FECHA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  FECHA (YYYY-MM-DD)
                </label>
                <select
                  value={mapping.fecha}
                  onChange={(e) => setMapping({ ...mapping, fecha: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="today">Usar fecha de hoy</option>
                  {columns.map((col, idx) => (
                    <option key={idx} value={`col_${idx}`}>
                      Columna #{idx}: {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* HORA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  HORA (HH:MM)
                </label>
                <select
                  value={mapping.hora}
                  onChange={(e) => setMapping({ ...mapping, hora: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="now">Usar hora actual</option>
                  {columns.map((col, idx) => (
                    <option key={idx} value={`col_${idx}`}>
                      Columna #{idx}: {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* HAWB/REFERENCIA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  HAWB/REFERENCIA (Número de Guía) *
                </label>
                <select
                  value={mapping.hawb}
                  onChange={(e) => setMapping({ ...mapping, hawb: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                >
                  <option value="">Seleccionar columna...</option>
                  {columns.map((col, idx) => (
                    <option key={idx} value={`col_${idx}`}>
                      Columna #{idx}: {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* ESTADO DE GUIA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ESTADO DE GUIA
                </label>
                <select
                  value={mapping.estado}
                  onChange={(e) => setMapping({ ...mapping, estado: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Seleccionar...</option>
                  <option value="DEVOLUCION TRANSPORTADORA">DEVOLUCION TRANSPORTADORA</option>
                  <option value="ENTREGADA A DESTINATARIO">ENTREGADA A DESTINATARIO</option>
                  <option value="ENTREGADA A TRANSPORTADORA">ENTREGADA A TRANSPORTADORA</option>
                  <option value="SALE PARA ENTREGA">SALE PARA ENTREGA</option>
                  <option value="SE RETIRA DEL DESPACHO">SE RETIRA DEL DESPACHO</option>
                  {columns.map((col, idx) => (
                    <option key={idx} value={`col_${idx}`}>
                      Columna #{idx}: {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* OBSERVACION */}
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  OBSERVACION (Formato: {`{Agencia} - {Columna1} - {Columna2}`})
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Agencia
                  </label>
                  <select
                    value={mapping.observacion_agency}
                    onChange={(e) => setMapping({ ...mapping, observacion_agency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Ninguna</option>
                    <option value="YOBEL">YOBEL</option>
                    <option value="MUNDO">MUNDO</option>
                    <option value="SERVIENTREGA">SERVIENTREGA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primera Columna
                  </label>
                  <select
                    value={mapping.observacion_col1}
                    onChange={(e) => setMapping({ ...mapping, observacion_col1: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Ninguna</option>
                    {columns.map((col, idx) => (
                      <option key={idx} value={`col_${idx}`}>
                        Columna #{idx}: {col}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Segunda Columna
                  </label>
                  <select
                    value={mapping.observacion_col2}
                    onChange={(e) => setMapping({ ...mapping, observacion_col2: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Ninguna</option>
                    {columns.map((col, idx) => (
                      <option key={idx} value={`col_${idx}`}>
                        Columna #{idx}: {col}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botón Generar */}
              <div className="pt-4">
                <Button
                  variant="success"
                  onClick={handleGenerateOutput}
                  disabled={loading || !mapping.hawb}
                  loading={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <i className="fas fa-file-download mr-2"></i>
                  {loading ? 'Generando...' : 'Generar Excel de Salida'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default ExcelMapper

