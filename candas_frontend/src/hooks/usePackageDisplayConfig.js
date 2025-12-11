import { useState, useEffect, useCallback } from 'react'

/**
 * Campos disponibles para mostrar en paquetes
 */
export const PACKAGE_DISPLAY_FIELDS = {
  guide_number: { label: 'Número de Guía', default: true, alwaysShow: true },
  nro_master: { label: 'Número Master', default: true },
  name: { label: 'Destinatario', default: true },
  address: { label: 'Dirección', default: false },
  city: { label: 'Ciudad', default: true },
  province: { label: 'Provincia', default: true },
  phone_number: { label: 'Teléfono', default: false },
  status: { label: 'Estado', default: true },
  status_display: { label: 'Estado (texto)', default: false },
  notes: { label: 'Notas', default: false },
  hashtags: { label: 'Hashtags', default: false },
  transport_agency_name: { label: 'Agencia Transporte', default: false },
  pull_name: { label: 'Saca', default: false },
  created_at: { label: 'Fecha Creación', default: false },
}

const STORAGE_KEY = 'package_display_config'

/**
 * Hook para manejar la configuración de visualización de paquetes
 */
export const usePackageDisplayConfig = () => {
  const [config, setConfig] = useState(() => {
    // Cargar configuración del localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error('Error loading package display config:', e)
    }
    
    // Configuración por defecto
    return {
      visibleFields: Object.entries(PACKAGE_DISPLAY_FIELDS)
        .filter(([_, field]) => field.default)
        .map(([key]) => key),
      dropdownFormat: '{guide_number} - {nro_master} - {name} ({city})',
      listFormat: 'detailed', // 'compact', 'detailed', 'custom'
    }
  })

  // Guardar configuración cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch (e) {
      console.error('Error saving package display config:', e)
    }
  }, [config])

  /**
   * Actualiza los campos visibles
   */
  const setVisibleFields = useCallback((fields) => {
    setConfig(prev => ({
      ...prev,
      visibleFields: fields,
    }))
  }, [])

  /**
   * Toggle un campo específico
   */
  const toggleField = useCallback((fieldId) => {
    setConfig(prev => {
      const isVisible = prev.visibleFields.includes(fieldId)
      const field = PACKAGE_DISPLAY_FIELDS[fieldId]
      
      // No permitir ocultar campos obligatorios
      if (field?.alwaysShow && isVisible) {
        return prev
      }
      
      return {
        ...prev,
        visibleFields: isVisible
          ? prev.visibleFields.filter(f => f !== fieldId)
          : [...prev.visibleFields, fieldId],
      }
    })
  }, [])

  /**
   * Establece el formato del dropdown
   */
  const setDropdownFormat = useCallback((format) => {
    setConfig(prev => ({
      ...prev,
      dropdownFormat: format,
    }))
  }, [])

  /**
   * Establece el formato de la lista
   */
  const setListFormat = useCallback((format) => {
    setConfig(prev => ({
      ...prev,
      listFormat: format,
    }))
  }, [])

  /**
   * Verifica si un campo es visible
   */
  const isFieldVisible = useCallback((fieldId) => {
    return config.visibleFields.includes(fieldId)
  }, [config.visibleFields])

  /**
   * Obtiene el valor de un campo de un paquete
   * Siempre retorna un string, nunca un objeto
   */
  const getFieldValue = useCallback((pkg, fieldId) => {
    if (!pkg) return ''
    
    switch (fieldId) {
      case 'status_display':
        return pkg.status_display || pkg.status || ''
      case 'transport_agency_name':
        // Manejar transport_agency como objeto o string
        if (pkg.transport_agency && typeof pkg.transport_agency === 'object') {
          return pkg.transport_agency.name || ''
        }
        return pkg.effective_transport_agency || pkg.transport_agency_name || ''
      case 'pull_name':
        if (!pkg.pull) return ''
        if (typeof pkg.pull === 'object') {
          return pkg.pull.common_destiny || `Saca-${(pkg.pull.id || '').substring(0, 8)}`
        }
        return `Saca-${String(pkg.pull).substring(0, 8)}`
      case 'created_at':
        return pkg.created_at ? new Date(pkg.created_at).toLocaleDateString('es-ES') : ''
      case 'hashtags':
        return Array.isArray(pkg.hashtags) ? pkg.hashtags.join(', ') : (pkg.hashtags || '')
      default: {
        const value = pkg[fieldId]
        if (value === null || value === undefined) return ''
        // Asegurar que nunca retornamos un objeto
        if (typeof value === 'object') {
          return value.name || value.id || ''
        }
        return String(value)
      }
    }
  }, [])

  /**
   * Formatea el label del dropdown basado en la configuración
   */
  const formatDropdownLabel = useCallback((pkg) => {
    if (!pkg) return ''
    
    let label = config.dropdownFormat
    
    // Reemplazar placeholders con valores
    Object.keys(PACKAGE_DISPLAY_FIELDS).forEach(fieldId => {
      const value = getFieldValue(pkg, fieldId) || 'N/A'
      label = label.replace(new RegExp(`\\{${fieldId}\\}`, 'g'), value)
    })
    
    return label
  }, [config.dropdownFormat, getFieldValue])

  /**
   * Obtiene los campos visibles para mostrar en la lista
   */
  const getVisibleFieldsData = useCallback((pkg) => {
    return config.visibleFields
      .filter(fieldId => PACKAGE_DISPLAY_FIELDS[fieldId])
      .map(fieldId => ({
        id: fieldId,
        label: PACKAGE_DISPLAY_FIELDS[fieldId].label,
        value: getFieldValue(pkg, fieldId),
      }))
      .filter(field => field.value) // Solo campos con valor
  }, [config.visibleFields, getFieldValue])

  /**
   * Resetea a la configuración por defecto
   */
  const resetConfig = useCallback(() => {
    const defaultConfig = {
      visibleFields: Object.entries(PACKAGE_DISPLAY_FIELDS)
        .filter(([_, field]) => field.default)
        .map(([key]) => key),
      dropdownFormat: '{guide_number} - {nro_master} - {name} ({city})',
      listFormat: 'detailed',
    }
    setConfig(defaultConfig)
  }, [])

  return {
    config,
    visibleFields: config.visibleFields,
    dropdownFormat: config.dropdownFormat,
    listFormat: config.listFormat,
    setVisibleFields,
    toggleField,
    setDropdownFormat,
    setListFormat,
    isFieldVisible,
    getFieldValue,
    formatDropdownLabel,
    getVisibleFieldsData,
    resetConfig,
    availableFields: PACKAGE_DISPLAY_FIELDS,
  }
}

export default usePackageDisplayConfig

