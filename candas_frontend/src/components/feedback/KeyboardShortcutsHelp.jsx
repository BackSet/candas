import PropTypes from 'prop-types'
import { useKeyboard } from '../../contexts/KeyboardContext'
import { Modal, ModalHeader, ModalBody, ModalFooter, KeyBadge } from '../ui'

/**
 * Formatea la tecla para mostrarla visualmente
 */
const formatKeyDisplay = (key) => {
  const keyMap = {
    'Escape': 'Esc',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Enter': '↵',
    'Space': '␣',
    '/': '/',
    '?': '?',
  }

  // Si es una secuencia (ej: "g h")
  if (key.includes(' ')) {
    return key.split(' ').map((k, i) => (
      <span key={i} className="inline-flex items-center">
        <KeyBadge>{keyMap[k] || k}</KeyBadge>
        {i < key.split(' ').length - 1 && <span className="mx-1.5 text-gray-500 dark:text-gray-400 text-xs">+</span>}
      </span>
    ))
  }

  // Si es una combinación (ej: "Ctrl+S")
  if (key.includes('+')) {
    return key.split('+').map((k, i) => (
      <span key={i} className="inline-flex items-center">
        <KeyBadge>{keyMap[k] || k}</KeyBadge>
        {i < key.split('+').length - 1 && <span className="mx-1.5 text-gray-500 dark:text-gray-400 text-xs">+</span>}
      </span>
    ))
  }

  return <KeyBadge>{keyMap[key] || key}</KeyBadge>
}

/**
 * Modal de ayuda de atajos de teclado
 */
const KeyboardShortcutsHelp = ({ show, onClose }) => {
  const { getShortcutsByCategory, pendingKey } = useKeyboard()
  const categories = getShortcutsByCategory()

  // Iconos por categoría
  const categoryConfig = {
    'Navegación': {
      icon: 'fas fa-compass',
      gradient: 'from-orange-500 to-amber-500',
      dotColor: 'bg-orange-500',
    },
    'General': {
      icon: 'fas fa-keyboard',
      gradient: 'from-gray-600 to-slate-700',
      dotColor: 'bg-gray-500',
    },
    'Acciones': {
      icon: 'fas fa-bolt',
      gradient: 'from-green-500 to-emerald-600',
      dotColor: 'bg-green-500',
    },
    'Ayuda': {
      icon: 'fas fa-question-circle',
      gradient: 'from-orange-500 to-red-500',
      dotColor: 'bg-orange-500',
    },
  }

  // Ordenar categorías: Navegación, General, Ayuda, Acciones
  const orderedCategories = ['Navegación', 'General', 'Ayuda', 'Acciones']
    .filter(cat => categories[cat])
    .map(cat => [cat, categories[cat]])

  return (
    <Modal show={show} onClose={onClose} size="xl">
      <ModalHeader
        icon="fas fa-keyboard"
        iconGradient="from-indigo-500 to-purple-600"
        subtitle="Navega más rápido con el teclado"
      >
        Atajos de Teclado
      </ModalHeader>
      
      <ModalBody>
          {/* Indicador de tecla pendiente */}
          {pendingKey && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-sm text-blue-400">
                <i className="fas fa-info-circle mr-2"></i>
                Presiona otra tecla para completar la secuencia: <KeyBadge>{pendingKey}</KeyBadge> + ...
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {orderedCategories.map(([category, shortcuts]) => {
              const config = categoryConfig[category] || {
                icon: 'fas fa-folder',
                gradient: 'from-gray-500 to-slate-600',
                dotColor: 'bg-gray-500',
              }

              return (
                <div key={category} className="space-y-4">
                  {/* Encabezado de categoría */}
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 ${config.dotColor} rounded-full`}></div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                      {category}
                    </h3>
                  </div>

                  {/* Lista de atajos */}
                  <div className="space-y-1">
                    {shortcuts.map((shortcut) => (
                      <div
                        key={shortcut.key}
                        className="flex items-center justify-between py-2.5 px-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1 ml-4 shrink-0">
                          {formatKeyDisplay(shortcut.key)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer con tips */}
          <div className="mt-8 p-5 bg-gray-100 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700/50">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-yellow-500">💡</span>
              Consejos
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <span>•</span>
                <span>Presiona <KeyBadge>?</KeyBadge> en cualquier momento para ver esta ayuda</span>
              </li>
              <li className="flex items-center gap-2">
                <span>•</span>
                <span>Los atajos no funcionan cuando estás escribiendo en un campo de texto</span>
              </li>
              <li className="flex items-center gap-2">
                <span>•</span>
                <span>Presiona <KeyBadge>Esc</KeyBadge> para cerrar modales y menús</span>
              </li>
              <li className="flex items-center gap-2">
                <span>•</span>
                <span>Usa las flechas <KeyBadge>↑</KeyBadge> <KeyBadge>↓</KeyBadge> para navegar en listas</span>
              </li>
            </ul>
          </div>
        </ModalBody>

      <ModalFooter>
        <div className="flex justify-end w-full">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white bg-transparent hover:bg-gray-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cerrar <span className="ml-2 text-gray-500">(Esc)</span>
          </button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

KeyboardShortcutsHelp.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default KeyboardShortcutsHelp
