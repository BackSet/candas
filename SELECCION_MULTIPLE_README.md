# Sistema de Selección Múltiple de Paquetes - Candas

## Descripción General

Se ha implementado un sistema completo de selección múltiple de paquetes y sacas para todas las vistas de creación de logística. El sistema incluye dos métodos de selección:

1. **Dropdown con búsqueda múltiple** - Usando react-select
2. **Lector de códigos de barras** - Con validación en tiempo real

## Componentes Creados

### 1. PackageSelector

**Ubicación:** `candas_frontend/src/components/PackageSelector.jsx`

Componente reutilizable para seleccionar paquetes con las siguientes características:

- **Dropdown múltiple con búsqueda**
  - Búsqueda por: número de guía, nombre, dirección, ciudad, provincia
  - Selección múltiple con Ctrl/Cmd + Click (nativo de react-select)
  - Muestra chips/tags de paquetes seleccionados
  - Filtrado en tiempo real

- **Lector de códigos de barras**
  - Input con auto-focus
  - Validación al presionar Enter
  - Toast de confirmación/error
  - Evita duplicados automáticamente

- **Lista visual de seleccionados**
  - Cards informativos con detalles del paquete
  - Botón para remover individual
  - Contador de paquetes seleccionados
  - Scroll para listas largas

**Props:**
```jsx
<PackageSelector
  selectedPackages={selectedPackages}      // Array de paquetes seleccionados
  onPackagesChange={setSelectedPackages}   // Función callback para cambios
  filterAvailable={true}                   // Solo paquetes sin asignar
  allowBarcode={true}                      // Habilitar escaneo
  allowDropdown={true}                     // Habilitar dropdown
  label="Agregar Paquetes"                 // Etiqueta personalizada
/>
```

### 2. PullSelector

**Ubicación:** `candas_frontend/src/components/PullSelector.jsx`

Componente similar a PackageSelector pero para seleccionar sacas:

- Dropdown múltiple con búsqueda por destino, guía y tamaño
- Muestra información de cada saca: destino, tamaño, cantidad de paquetes, agencia
- Lista visual con detalles completos
- Soporte para selección múltiple

**Props:**
```jsx
<PullSelector
  selectedPulls={selectedPulls}
  onPullsChange={setSelectedPulls}
  filterAvailable={true}
  label="Seleccionar Sacas"
/>
```

## Vistas Actualizadas/Creadas

### 1. PullsCreate (Actualizado)

**Ubicación:** `candas_frontend/src/pages/logistics/PullsCreate.jsx`

- Refactorizado para usar `PackageSelector`
- Código simplificado (eliminado código duplicado)
- Mejor UX con ambos métodos de selección

### 2. BatchCreate (Nuevo)

**Ubicación:** `candas_frontend/src/pages/logistics/BatchCreate.jsx`

Vista para crear lotes que agrupan sacas:

- Formulario con: destino, agencia, número de guía
- Usa `PullSelector` para agregar sacas
- Validaciones de destino común

### 3. DispatchCreate (Nuevo)

**Ubicación:** `candas_frontend/src/pages/logistics/DispatchCreate.jsx`

Vista para crear despachos que incluyen sacas Y paquetes individuales:

- Formulario con: fecha, estado, notas
- Usa `PullSelector` para sacas
- Usa `PackageSelector` para paquetes individuales
- Resumen con totales en tiempo real

### 4. BatchesList (Nuevo)

**Ubicación:** `candas_frontend/src/pages/logistics/BatchesList.jsx`

Vista de listado de lotes con:

- Tabla con información de cada lote
- Botón para crear nuevo lote
- Acciones: Ver y Eliminar

### 5. DispatchesList (Nuevo)

**Ubicación:** `candas_frontend/src/pages/logistics/DispatchesList.jsx`

Vista de listado de despachos con:

- Tabla con información de cada despacho
- Badges de estado (Planificado, En Curso, Completado, Cancelado)
- Botón para crear nuevo despacho
- Acciones: Ver y Eliminar

## Servicios de API Creados

### 1. batchesService

**Ubicación:** `candas_frontend/src/services/batchesService.js`

Métodos:
- `list(params)` - Listar lotes
- `get(id)` - Obtener lote por ID
- `create(data)` - Crear lote
- `update(id, data)` - Actualizar lote
- `delete(id)` - Eliminar lote
- `getAvailable()` - Lotes disponibles
- `addPulls(id, pullIds)` - Agregar sacas
- `removePulls(id, pullIds)` - Remover sacas

### 2. dispatchesService

**Ubicación:** `candas_frontend/src/services/dispatchesService.js`

Métodos:
- `list(params)` - Listar despachos
- `get(id)` - Obtener despacho por ID
- `create(data)` - Crear despacho
- `update(id, data)` - Actualizar despacho
- `delete(id)` - Eliminar despacho
- `addPulls(id, pullIds)` - Agregar sacas
- `removePulls(id, pullIds)` - Remover sacas
- `addPackages(id, packageIds)` - Agregar paquetes
- `removePackages(id, packageIds)` - Remover paquetes
- `changeStatus(id, status)` - Cambiar estado

### 3. pullsService (Actualizado)

**Ubicación:** `candas_frontend/src/services/pullsService.js`

Nuevos métodos agregados:
- `getAvailable()` - Sacas disponibles
- `addPackages(id, packageIds)` - Agregar paquetes
- `removePackages(id, packageIds)` - Remover paquetes

## Rutas Agregadas

En `candas_frontend/src/App.jsx`:

```jsx
// Lotes
<Route path="logistica/batches" element={<BatchesList />} />
<Route path="logistica/batches/crear" element={<BatchCreate />} />

// Despachos
<Route path="logistica/dispatches" element={<DispatchesList />} />
<Route path="logistica/dispatches/crear" element={<DispatchCreate />} />
```

## Dependencias Agregadas

En `candas_frontend/package.json`:

```json
{
  "dependencies": {
    "react-select": "^5.8.0"
  }
}
```

**Instalación:**
```bash
cd candas_frontend
npm install
```

## Uso de react-select

La librería `react-select` proporciona:

- ✅ Selección múltiple nativa
- ✅ Búsqueda integrada con filtrado
- ✅ Soporte para Ctrl/Cmd + Click
- ✅ Personalización completa de estilos
- ✅ Compatible con dark mode
- ✅ Accesibilidad WAI-ARIA
- ✅ Rendimiento optimizado

## Características Implementadas

### Selección Múltiple en Dropdown

El usuario puede seleccionar múltiples elementos de tres formas:

1. **Click individual** - Selecciona uno por uno
2. **Ctrl/Cmd + Click** - Mantiene selecciones previas
3. **Búsqueda y selección** - Busca y selecciona

### Escaneo de Códigos de Barras

- Campo de texto con auto-focus
- Escanea el código y presiona Enter
- Búsqueda automática por: número de guía, nro_master o agency_guide_number
- Validación de disponibilidad (estado EN_BODEGA y sin pull asignado)
- Notificaciones toast de éxito/error
- Prevención de duplicados
- Coincidencia exacta o primer resultado si no hay match exacto

### Validaciones

- No se pueden agregar paquetes duplicados
- Validación de disponibilidad en el backend
- Mensajes de error claros
- Confirmación visual de acciones

## Flujo de Trabajo

### Crear Saca (Pull)

1. Ir a `/logistica/pulls/crear`
2. Llenar información básica (destino, tamaño)
3. Agregar paquetes usando:
   - Dropdown: Buscar y seleccionar
   - Escáner: Escanear códigos de barras
4. Revisar lista de seleccionados
5. Crear saca

### Crear Lote (Batch)

1. Ir a `/logistica/batches/crear`
2. Llenar información del lote (destino, agencia, guía)
3. Seleccionar sacas desde el dropdown
4. Verificar que todas tengan el mismo destino
5. Crear lote

### Crear Despacho (Dispatch)

1. Ir a `/logistica/dispatches/crear`
2. Llenar información (fecha, estado, notas)
3. Agregar sacas (opcional)
4. Agregar paquetes individuales (opcional)
5. Revisar resumen de totales
6. Crear despacho

## Estructura de Archivos

```
candas_frontend/src/
├── components/
│   ├── PackageSelector.jsx     (Nuevo)
│   ├── PullSelector.jsx         (Nuevo)
│   └── index.js                 (Actualizado)
├── pages/
│   └── logistics/
│       ├── PullsCreate.jsx      (Actualizado)
│       ├── BatchCreate.jsx      (Nuevo)
│       ├── BatchesList.jsx      (Nuevo)
│       ├── DispatchCreate.jsx   (Nuevo)
│       └── DispatchesList.jsx   (Nuevo)
├── services/
│   ├── batchesService.js        (Nuevo)
│   ├── dispatchesService.js     (Nuevo)
│   └── pullsService.js          (Actualizado)
└── App.jsx                      (Actualizado)
```

## Estilos y Temas

Los componentes son compatibles con:

- ✅ Modo claro (light mode)
- ✅ Modo oscuro (dark mode)
- ✅ Diseño responsive
- ✅ Transiciones suaves
- ✅ Estados hover/focus
- ✅ Tailwind CSS

## Próximas Mejoras Sugeridas

1. **Filtros avanzados** en los dropdowns (por estado, fecha, etc.)
2. **Búsqueda por código QR** además de códigos de barras
3. **Selección masiva** con checkboxes en tablas
4. **Exportación** de listas a Excel/PDF
5. **Virtualización** para listas muy largas (>1000 items)
6. **Drag & Drop** para reordenar paquetes
7. **Vista previa** antes de guardar
8. **Guardado automático** como borrador

## Notas Técnicas

### Performance

- Los componentes usan `useState` y `useEffect` eficientemente
- `react-select` está optimizado para listas grandes
- Lazy loading de datos desde la API
- Debouncing en búsquedas (por defecto en react-select)

### Accesibilidad

- Navegación por teclado completa
- Labels descriptivos
- Estados focus visibles
- Mensajes de error claros
- Soporte para lectores de pantalla

### Compatibilidad

- React 18+
- Navegadores modernos (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- Touch-friendly

## Solución de Problemas

### El dropdown no muestra paquetes

1. Verificar que el backend esté corriendo
2. Revisar la consola del navegador por errores
3. Verificar que el endpoint `/api/v1/packages/available_for_pull/` funcione

### El escaneo no funciona

1. Verificar que el cursor esté en el campo de escaneo
2. El código debe terminar con Enter
3. Verificar que el paquete exista en la base de datos
4. El paquete debe tener estado 'EN_BODEGA'
5. El paquete no debe estar asignado a una saca previamente
6. Revisar la consola del navegador para ver detalles del error

### Estilos no se ven correctamente

1. Verificar que Tailwind CSS esté compilando
2. Ejecutar `npm run dev` para modo desarrollo
3. Limpiar caché del navegador

## Soporte

Para problemas o preguntas:

1. Revisar este README
2. Consultar la documentación de react-select: https://react-select.com
3. Revisar los logs del backend Django
4. Verificar la consola del navegador
