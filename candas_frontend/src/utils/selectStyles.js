/**
 * Estilos personalizados para react-select con soporte para modo oscuro
 */

/**
 * Detecta si el modo oscuro está activo
 */
const isDarkMode = () => {
  return document.documentElement.classList.contains('dark')
}

/**
 * Colores del tema
 */
const colors = {
  light: {
    // Control
    controlBg: '#ffffff',
    controlBorder: '#e5e7eb',
    controlBorderHover: '#d1d5db',
    controlBorderFocus: '#3b82f6',
    controlShadowFocus: 'rgba(59, 130, 246, 0.2)',
    // Text
    text: '#1f2937',
    textMuted: '#6b7280',
    placeholder: '#9ca3af',
    // Menu
    menuBg: '#ffffff',
    menuBorder: '#e5e7eb',
    menuShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
    // Options
    optionBg: '#ffffff',
    optionBgHover: '#f3f4f6',
    optionBgSelected: '#3b82f6',
    optionText: '#1f2937',
    optionTextSelected: '#ffffff',
    // Multi-value
    multiValueBg: '#e0e7ff',
    multiValueText: '#4338ca',
    multiValueRemoveBg: '#c7d2fe',
    // Indicators
    indicatorColor: '#9ca3af',
    indicatorColorHover: '#6b7280',
    // Clear
    clearIndicatorColor: '#9ca3af',
    clearIndicatorColorHover: '#ef4444',
  },
  dark: {
    // Control
    controlBg: '#1f2937',
    controlBorder: '#374151',
    controlBorderHover: '#4b5563',
    controlBorderFocus: '#3b82f6',
    controlShadowFocus: 'rgba(59, 130, 246, 0.3)',
    // Text
    text: '#f3f4f6',
    textMuted: '#9ca3af',
    placeholder: '#6b7280',
    // Menu
    menuBg: '#1f2937',
    menuBorder: '#374151',
    menuShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
    // Options
    optionBg: '#1f2937',
    optionBgHover: '#374151',
    optionBgSelected: '#3b82f6',
    optionText: '#f3f4f6',
    optionTextSelected: '#ffffff',
    // Multi-value
    multiValueBg: '#312e81',
    multiValueText: '#c7d2fe',
    multiValueRemoveBg: '#3730a3',
    // Indicators
    indicatorColor: '#6b7280',
    indicatorColorHover: '#9ca3af',
    // Clear
    clearIndicatorColor: '#6b7280',
    clearIndicatorColorHover: '#ef4444',
  }
}

/**
 * Obtiene los colores según el tema actual
 */
const getColors = () => {
  return isDarkMode() ? colors.dark : colors.light
}

/**
 * Estilos base para react-select
 */
export const getSelectStyles = (customColors = {}) => {
  const c = { ...getColors(), ...customColors }
  
  return {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: c.controlBg,
      borderColor: state.isFocused ? c.controlBorderFocus : c.controlBorder,
      borderWidth: '2px',
      borderRadius: '0.75rem',
      boxShadow: state.isFocused ? `0 0 0 3px ${c.controlShadowFocus}` : 'none',
      minHeight: '44px',
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: state.isFocused ? c.controlBorderFocus : c.controlBorderHover,
      },
    }),
    
    menu: (provided) => ({
      ...provided,
      backgroundColor: c.menuBg,
      zIndex: 9999,
      boxShadow: c.menuShadow,
      border: `1px solid ${c.menuBorder}`,
      borderRadius: '0.75rem',
      marginTop: '6px',
      overflow: 'hidden',
    }),
    
    menuList: (provided) => ({
      ...provided,
      padding: '6px',
      maxHeight: '250px',
    }),
    
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? c.optionBgSelected
        : state.isFocused
        ? c.optionBgHover
        : c.optionBg,
      color: state.isSelected ? c.optionTextSelected : c.optionText,
      cursor: 'pointer',
      padding: '10px 14px',
      borderRadius: '0.5rem',
      marginBottom: '2px',
      fontWeight: state.isSelected ? '500' : '400',
      transition: 'all 0.15s ease',
      '&:active': {
        backgroundColor: c.optionBgSelected,
        color: c.optionTextSelected,
      },
    }),
    
    singleValue: (provided) => ({
      ...provided,
      color: c.text,
    }),
    
    input: (provided) => ({
      ...provided,
      color: c.text,
    }),
    
    placeholder: (provided) => ({
      ...provided,
      color: c.placeholder,
    }),
    
    indicatorSeparator: () => ({
      display: 'none',
    }),
    
    dropdownIndicator: (provided, state) => ({
      ...provided,
      color: state.isFocused ? c.indicatorColorHover : c.indicatorColor,
      padding: '0 12px',
      transition: 'all 0.2s ease',
      transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
      '&:hover': {
        color: c.indicatorColorHover,
      },
    }),
    
    clearIndicator: (provided) => ({
      ...provided,
      color: c.clearIndicatorColor,
      padding: '0 8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        color: c.clearIndicatorColorHover,
      },
    }),
    
    loadingIndicator: (provided) => ({
      ...provided,
      color: c.indicatorColor,
    }),
    
    noOptionsMessage: (provided) => ({
      ...provided,
      color: c.textMuted,
      padding: '16px',
    }),
    
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: c.multiValueBg,
      borderRadius: '0.375rem',
    }),
    
    multiValueLabel: (provided) => ({
      ...provided,
      color: c.multiValueText,
      fontWeight: '500',
      padding: '2px 6px',
    }),
    
    multiValueRemove: (provided) => ({
      ...provided,
      color: c.multiValueText,
      borderRadius: '0 0.375rem 0.375rem 0',
      '&:hover': {
        backgroundColor: c.multiValueRemoveBg,
        color: c.multiValueText,
      },
    }),
    
    valueContainer: (provided) => ({
      ...provided,
      padding: '2px 12px',
    }),
  }
}

/**
 * Tema personalizado para react-select
 */
export const getSelectTheme = (theme) => ({
  ...theme,
  borderRadius: 12,
  colors: {
    ...theme.colors,
    primary: '#3b82f6',
    primary75: '#60a5fa',
    primary50: '#93c5fd',
    primary25: '#dbeafe',
    danger: '#ef4444',
    dangerLight: '#fecaca',
    neutral0: isDarkMode() ? '#1f2937' : '#ffffff',
    neutral5: isDarkMode() ? '#374151' : '#f3f4f6',
    neutral10: isDarkMode() ? '#374151' : '#e5e7eb',
    neutral20: isDarkMode() ? '#4b5563' : '#d1d5db',
    neutral30: isDarkMode() ? '#6b7280' : '#9ca3af',
    neutral40: isDarkMode() ? '#9ca3af' : '#6b7280',
    neutral50: isDarkMode() ? '#9ca3af' : '#6b7280',
    neutral60: isDarkMode() ? '#d1d5db' : '#4b5563',
    neutral70: isDarkMode() ? '#e5e7eb' : '#374151',
    neutral80: isDarkMode() ? '#f3f4f6' : '#1f2937',
    neutral90: isDarkMode() ? '#f9fafb' : '#111827',
  },
})

export default getSelectStyles

