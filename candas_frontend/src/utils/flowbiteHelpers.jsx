/**
 * Funciones helper para mapear props personalizadas a props de Flowbite React
 */

/**
 * Mapea props personalizadas de Button a props de Flowbite Button
 * @param {Object} props - Props personalizadas
 * @returns {Object} Props de Flowbite Button
 */
export const mapButtonProps = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled = false,
  ...restProps
}) => {
  // Mapeo de variantes a colores de Flowbite
  const colorMap = {
    primary: 'blue',
    secondary: 'gray',
    success: 'green',
    danger: 'red',
    warning: 'yellow',
    info: 'cyan',
    ghost: 'light',
    outline: 'blue',
  }

  // Mapeo de tamaños
  const sizeMap = {
    sm: 'xs',
    md: 'md',
    lg: 'xl',
  }

  const flowbiteColor = colorMap[variant] ?? 'blue'
  const flowbiteSize = sizeMap[size] ?? 'md'

  const flowbiteProps = {
    ...restProps,
    size: flowbiteSize,
    disabled: disabled || loading,
    className: `${fullWidth ? 'w-full' : ''} ${className}`.trim(),
  }

  // Para variante outline, Flowbite usa outline={true}
  if (variant === 'outline') {
    flowbiteProps.outline = true
    flowbiteProps.color = 'gray'
    flowbiteProps.className = `${flowbiteProps.className} !border-gray-300 dark:!border-gray-600 !text-gray-700 dark:!text-gray-300 hover:!bg-gray-100 dark:hover:!bg-gray-700`.trim()
  } else if (variant === 'ghost') {
    // Ghost: estilo transparente visible en ambos temas
    flowbiteProps.color = 'gray'
    flowbiteProps.className = `${flowbiteProps.className} bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600`.trim()
  } else if (variant === 'primary') {
    // Primary: azul brillante visible en ambos temas
    flowbiteProps.color = 'blue'
    flowbiteProps.className = `${flowbiteProps.className} !bg-blue-600 hover:!bg-blue-700 !text-white font-semibold shadow-md hover:shadow-lg`.trim()
  } else if (variant === 'secondary') {
    // Secondary: gris visible en ambos temas
    flowbiteProps.color = 'gray'
    flowbiteProps.className = `${flowbiteProps.className} !bg-gray-200 dark:!bg-gray-600 hover:!bg-gray-300 dark:hover:!bg-gray-500 !text-gray-800 dark:!text-white`.trim()
  } else if (variant === 'success') {
    // Success: verde visible en ambos temas
    flowbiteProps.color = 'green'
    flowbiteProps.className = `${flowbiteProps.className} !bg-green-600 hover:!bg-green-700 !text-white font-semibold shadow-md`.trim()
  } else if (variant === 'danger') {
    // Danger: rojo visible en ambos temas
    flowbiteProps.color = 'red'
    flowbiteProps.className = `${flowbiteProps.className} !bg-red-600 hover:!bg-red-700 !text-white font-semibold shadow-md`.trim()
  } else if (variant === 'warning') {
    // Warning: amarillo visible en ambos temas
    flowbiteProps.color = 'yellow'
    flowbiteProps.className = `${flowbiteProps.className} !bg-yellow-500 hover:!bg-yellow-600 !text-gray-900 font-semibold shadow-md`.trim()
  } else {
    flowbiteProps.color = flowbiteColor
  }

  return {
    flowbiteProps,
    loading,
    icon,
    iconPosition,
  }
}

/**
 * Mapea props personalizadas de Card a estructura de Flowbite Card
 * @param {Object} props - Props personalizadas
 * @returns {Object} Props y estructura para Flowbite Card
 */
export const mapCardProps = ({
  header = null,
  footer = null,
  hoverable = false,
  padding = 'default',
  variant = 'default',
  image = null,
  imageAlt = '',
  onClick = null,
  className = '',
  ...restProps
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    default: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  }

  const variantClasses = {
    default: 'shadow-md',
    elevated: 'shadow-lg',
    outlined: 'shadow-none border-2',
    filled: 'shadow-none bg-gray-50 dark:bg-gray-800',
  }

  const hoverClass = hoverable
    ? 'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ease-in-out cursor-pointer'
    : 'transition-colors duration-300'

  const clickableClass = onClick ? 'cursor-pointer focus-visible-ring focus-visible:outline-none' : ''

  const flowbiteClassName = `${variantClasses[variant]} ${hoverClass} ${clickableClass} ${className}`.trim()

  return {
    flowbiteProps: {
      ...restProps,
      className: flowbiteClassName,
      onClick,
      role: onClick ? 'button' : undefined,
      tabIndex: onClick ? 0 : undefined,
    },
    header,
    footer,
    padding: paddingClasses[padding],
    image,
    imageAlt,
  }
}

/**
 * Mapea props personalizadas de FormField a props de Flowbite
 * @param {Object} props - Props personalizadas
 * @returns {Object} Props de Flowbite para TextInput/Textarea/Select
 */
export const mapFormFieldProps = ({
  name,
  value,
  onChange,
  required = false,
  placeholder = '',
  disabled = false,
  error = null,
  helpText = null,
  leftIcon = null,
  rightIcon = null,
  size = 'md',
  ...restProps
}) => {
  const sizeMap = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  }

  const flowbiteSize = sizeMap[size] ?? 'md'

  // Helper text para Flowbite
  const helperTextContent = error ? (
    <span className="flex items-center gap-1.5">
      <i className="fas fa-exclamation-circle text-xs" aria-hidden="true"></i>
      <span>{error}</span>
    </span>
  ) : helpText ? (
    <span>{helpText}</span>
  ) : null

  return {
    baseProps: {
      id: name,
      name: name,
      value: value ?? '',
      onChange: onChange,
      required: required,
      placeholder: placeholder,
      disabled: disabled,
      sizing: flowbiteSize,
      color: error ? 'failure' : undefined,
      helperText: helperTextContent,
      ...restProps,
    },
    leftIcon,
    rightIcon,
  }
}

/**
 * Mapea props personalizadas de Badge a props de Flowbite Badge
 * @param {Object} props - Props personalizadas
 * @returns {Object} Props de Flowbite Badge
 */
export const mapBadgeProps = ({
  variant = 'default',
  size = 'md',
  rounded = 'default',
  className = '',
  ...restProps
}) => {
  // Mapeo de variantes a colores de Flowbite
  const colorMap = {
    default: 'gray',
    primary: 'indigo',
    success: 'success',
    warning: 'warning',
    danger: 'failure',
    info: 'info',
    secondary: 'dark',
    purple: 'purple',
  }

  // Mapeo de tamaños
  const sizeMap = {
    sm: 'sm',
    md: 'sm', // Flowbite solo tiene sm y xs
    lg: 'sm',
  }

  const flowbiteColor = colorMap[variant] ?? 'gray'
  const flowbiteSize = sizeMap[size] ?? 'sm'

  return {
    ...restProps,
    color: flowbiteColor,
    size: flowbiteSize,
    className: className,
  }
}

/**
 * Mapea props personalizadas de LoadingSpinner a props de Flowbite Spinner
 * @param {Object} props - Props personalizadas
 * @returns {Object} Props de Flowbite Spinner
 */
export const mapSpinnerProps = ({
  size = 'md',
  className = '',
  ...restProps
}) => {
  // Mapeo de tamaños
  const sizeMap = {
    sm: 'md',
    md: 'xl',
    lg: 'xl',
  }

  const flowbiteSize = sizeMap[size] ?? 'xl'

  return {
    ...restProps,
    size: flowbiteSize,
    className: className,
  }
}

