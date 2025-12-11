import { TextInput, Textarea, Select, Label, HelperText } from 'flowbite-react'
import { mapFormFieldProps } from '../../utils/flowbiteHelpers.jsx'
import PropTypes from 'prop-types'

/**
 * Componente FormField que usa directamente Flowbite React
 * Mantiene compatibilidad con la API existente mediante mapeo de props
 */
const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required = false,
  placeholder = '',
  options = [],
  rows = 3,
  error = null,
  helpText = null,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  size = 'md',
  floatingLabel = false,
  ...restProps
}) => {
  // Generar label automático si no se proporciona
  const displayLabel = label || name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  // Generar título para el tooltip (usar helpText si está disponible, sino el label)
  const labelTitle = helpText || displayLabel

  const { baseProps, leftIcon: mappedLeftIcon, rightIcon: mappedRightIcon } = mapFormFieldProps({
    name,
    value,
    onChange,
    required,
    placeholder,
    disabled,
    error,
    helpText,
    leftIcon,
    rightIcon,
    size,
    ...restProps,
  })

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <div>
            <Textarea
              {...baseProps}
              rows={rows}
            />
          </div>
        )
      case 'select':
        return (
          <div>
            <Select
              {...baseProps}
            >
              <option value="">-- Seleccionar --</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        )
      default:
        return (
          <div>
            <TextInput
              {...baseProps}
              type={type}
              icon={mappedLeftIcon}
              rightIcon={mappedRightIcon}
            />
          </div>
        )
    }
  }

  return (
    <div className="mb-4">
      {!floatingLabel && (
        <div className="mb-2">
          <Label
            htmlFor={name}
            className="text-gray-900 dark:text-gray-100 font-medium"
            title={labelTitle}
          >
            {displayLabel}
            {required && <span className="text-red-500 dark:text-red-400 ml-1" aria-label="requerido" title="Campo obligatorio">*</span>}
          </Label>
        </div>
      )}
      {floatingLabel && (
        <Label
          htmlFor={name}
          value={displayLabel}
          className={`absolute left-4 top-2 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 pointer-events-none ${
            value ? 'top-0 left-3 text-xs bg-white dark:bg-gray-800 px-1 text-gray-900 dark:text-gray-100' : ''
          }`}
          title={labelTitle}
        >
          {required && <span className="text-red-500 dark:text-red-400 ml-1" title="Campo obligatorio">*</span>}
        </Label>
      )}
      {floatingLabel && <div className="relative mt-6"></div>}
      {renderInput()}
    </div>
  )
}

FormField.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  rows: PropTypes.number,
  error: PropTypes.string,
  helpText: PropTypes.string,
  disabled: PropTypes.bool,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  floatingLabel: PropTypes.bool,
}

export default FormField
