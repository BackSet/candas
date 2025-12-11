# Guía de Diseño Responsive

## Breakpoints de Tailwind CSS

- **sm**: 640px - Tablets pequeñas
- **md**: 768px - Tablets
- **lg**: 1024px - Desktop
- **xl**: 1280px - Desktop grande
- **2xl**: 1536px - Pantallas muy grandes

## Características Responsive Implementadas

### 1. Layout General

- **Navbar**: Se adapta ocultando texto en móviles
- **Sidebar**: 
  - Desktop: Visible fijo en lateral
  - Móvil: Oculto con botón flotante para abrir
  - Overlay oscuro en móvil cuando está abierto
- **Contenido principal**: Padding adaptativo (p-4 sm:p-6 lg:p-8)

### 2. Componentes

#### Card
- Padding responsive: `p-4 sm:p-6` (default)
- Headers responsive: `px-4 sm:px-6`

#### Table
- Scroll horizontal automático en móvil
- Padding de celdas: `px-3 sm:px-6`
- Font size adaptativo

#### Buttons
- Touch targets mínimos de 44x44px en móvil
- Iconos sin texto en móvil, con texto en desktop

### 3. Páginas

#### Dashboard
- Grid de estadísticas: 1 columna (móvil) → 2 columnas (sm) → 4 columnas (lg)
- Acciones rápidas: 1 columna (móvil) → 2 columnas (sm) → 4 columnas (lg)
- Tamaños de texto adaptativos

#### PackagesList
- Tabla con scroll horizontal en móvil
- Filtros apilados verticalmente en móvil
- Botones con iconos en móvil, texto completo en desktop

#### Forms
- Inputs de ancho completo
- Grids de 2 columnas que se vuelven 1 en móvil
- Labels y texto adaptativo

### 4. Tema Oscuro/Claro

#### Características
- Transiciones suaves (duration-200/300)
- Contrastes mejorados para accesibilidad
- Detección automática de preferencia del sistema
- Persistencia en localStorage
- Toggle manual con animación suave

#### Colores Modo Oscuro
- Fondo principal: `dark:bg-gray-900`
- Fondo secundario: `dark:bg-gray-800`
- Cards: `dark:bg-gray-800` con border `dark:border-gray-700`
- Texto primario: `dark:text-gray-100`
- Texto secundario: `dark:text-gray-400`

#### Colores Modo Claro
- Fondo principal: `bg-gray-50`
- Fondo secundario: `bg-white`
- Cards: `bg-white` con border `border-gray-100`
- Texto primario: `text-gray-900`
- Texto secundario: `text-gray-600`

### 5. Accesibilidad

- Focus rings visibles: `focus:ring-2`
- Touch targets mínimos: clase `.touch-target`
- Contraste WCAG AA compliant
- Aria-labels en iconos
- Navegación por teclado

### 6. Performance

- Lazy loading de imágenes
- Transiciones optimizadas con GPU
- Scroll suave personalizado
- Animaciones con `will-change` implícito

## Testing Responsive

### Breakpoints a Probar
1. **320px**: iPhone SE (móvil pequeño)
2. **375px**: iPhone X/11/12 (móvil estándar)
3. **768px**: iPad (tablet)
4. **1024px**: Desktop pequeño
5. **1440px**: Desktop estándar
6. **1920px**: Desktop grande

### Checklist
- [ ] Sidebar se oculta en móvil
- [ ] Navbar muestra versión compacta en móvil
- [ ] Tablas tienen scroll horizontal
- [ ] Formularios son usables en móvil
- [ ] Touch targets son de al menos 44x44px
- [ ] Tema oscuro/claro funciona correctamente
- [ ] No hay overflow horizontal
- [ ] Texto es legible en todos los tamaños
