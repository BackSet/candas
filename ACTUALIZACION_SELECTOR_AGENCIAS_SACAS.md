# ✅ Actualización: Selector de Agencias en Formularios de Sacas

## Resumen

Se ha actualizado el formulario de crear y editar sacas (Pulls) para incluir un selector desplegable de agencias de transporte, reemplazando el campo de texto libre que requería ingresar el UUID manualmente.

## Cambios Realizados

### 🎨 Frontend

#### 1. Formulario de Crear Saca
**Archivo:** `candas_frontend/src/pages/logistics/PullsCreate.jsx`

**Mejoras Implementadas:**

1. **Importaciones Agregadas:**
```javascript
import { useState, useEffect } from 'react'  // Agregado useEffect
import transportAgenciesService from '../../services/transportAgenciesService'  // Nuevo
import LoadingSpinner from '../../components/LoadingSpinner'  // Nuevo
```

2. **Nuevos Estados:**
```javascript
const [agencies, setAgencies] = useState([])
const [loadingAgencies, setLoadingAgencies] = useState(true)
```

3. **Nueva Función fetchAgencies():**
```javascript
useEffect(() => {
  fetchAgencies()
}, [])

const fetchAgencies = async () => {
  try {
    setLoadingAgencies(true)
    const data = await transportAgenciesService.getActive()
    setAgencies(data.results || data)
  } catch (error) {
    console.error('Error cargando agencias:', error)
    toast.error('Error al cargar las agencias de transporte')
    setAgencies([])
  } finally {
    setLoadingAgencies(false)
  }
}
```

4. **Loading Condicional:**
```javascript
if (loadingAgencies) {
  return <LoadingSpinner message="Cargando datos del formulario..." />
}
```

5. **Campo Actualizado - De Input a Select:**

**Antes:**
```jsx
<FormField
  label="Agencia de Transporte"
  name="transport_agency"
  value={formData.transport_agency}
  onChange={handleInputChange}
  placeholder="ID de la agencia (opcional)"
  helpText="Si está vacío y la saca pertenece a un lote, heredará la agencia del lote"
/>
```

**Ahora:**
```jsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    Agencia de Transporte
    <span className="text-gray-500 ml-1">(Opcional)</span>
  </label>
  <select
    name="transport_agency"
    value={formData.transport_agency}
    onChange={handleInputChange}
    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
  >
    <option value="">-- Sin agencia asignada --</option>
    {agencies.map((agency) => (
      <option key={agency.id} value={agency.id}>
        {agency.name} {agency.phone_number ? `- ${agency.phone_number}` : ''}
      </option>
    ))}
  </select>
  <p className="text-sm text-gray-500 dark:text-gray-400">
    Si está vacío y la saca pertenece a un lote, heredará la agencia del lote
  </p>
  {agencies.length === 0 && (
    <p className="text-sm text-amber-600 dark:text-amber-400">
      <i className="fas fa-exclamation-triangle mr-1"></i>
      No hay agencias activas. Puedes crear una en Catálogo → Agencias de Transporte
    </p>
  )}
</div>
```

#### 2. Formulario de Editar Saca
**Archivo:** `candas_frontend/src/pages/logistics/PullsEdit.jsx`

**Cambios Idénticos:**
- ✅ Importaciones de `transportAgenciesService` y `LoadingSpinner`
- ✅ Estados `agencies` y `loadingAgencies`
- ✅ Función `fetchAgencies()` con `useEffect`
- ✅ Loading condicional actualizado: `if (loading || loadingAgencies)`
- ✅ Campo de agencia cambiado de input a select
- ✅ Mensajes de ayuda y advertencias

## Comparación Visual

### Antes ❌
```
┌─────────────────────────────────────────┐
│ Agencia de Transporte                   │
│ ┌─────────────────────────────────────┐ │
│ │ abc-123-uuid-456                    │ │ ← Usuario pegaba UUID
│ └─────────────────────────────────────┘ │
│ ID de la agencia (opcional)             │
└─────────────────────────────────────────┘
```

### Ahora ✅
```
┌─────────────────────────────────────────────────┐
│ Agencia de Transporte (Opcional)                │
│ ┌─────────────────────────────────────────────┐ │
│ │ ▼ Servientrega - 0999999999             ▼  │ │ ← Dropdown legible
│ │   Laar Courier - 0988888888                 │ │
│ │   -- Sin agencia asignada --                │ │
│ └─────────────────────────────────────────────┘ │
│ Si está vacío y la saca pertenece a un lote,   │
│ heredará la agencia del lote                    │
└─────────────────────────────────────────────────┘
```

## Beneficios

### 🎯 Experiencia de Usuario Mejorada

1. **Más Intuitivo:**
   - No necesita buscar el UUID de la agencia
   - Selección directa del nombre de la agencia
   - Muestra nombre y teléfono para mejor identificación

2. **Prevención de Errores:**
   - No se pueden ingresar UUIDs incorrectos
   - Solo agencias activas disponibles
   - Validación automática

3. **Mejor Feedback:**
   - Mensaje si no hay agencias disponibles
   - Enlace contextual a crear agencias
   - Loading spinner mientras carga datos

### 🔄 Consistencia

- **Patrón Unificado:** Mismo selector usado en:
  - ✅ BatchCreate.jsx
  - ✅ BatchWithPullsCreate.jsx
  - ✅ PullsCreate.jsx (NUEVO)
  - ✅ PullsEdit.jsx (NUEVO)

## Campos Actualizados del Formulario de Saca

| Campo | Tipo | Estado |
|-------|------|--------|
| **Destino Común** | Text | ✅ Requerido |
| **Tamaño** | Select | ✅ Requerido (Pequeño/Mediano/Grande) |
| **Agencia de Transporte** | **Select** | ✅ Opcional (Actualizado) |
| **Número de Guía** | Text | ✅ Opcional |
| **Lote** | Text | ✅ Opcional (solo en edición) |

## Integración con el Sistema

### Jerarquía de Herencia

```
Lote (Batch)
  ↓ hereda (si no está definido en Pull)
Saca (Pull)
  ↓ hereda (si no está definido en Package)
Paquete (Package)
```

**Flujo:**
1. Si la saca NO tiene agencia asignada → Hereda del lote (si pertenece a uno)
2. Si la saca SÍ tiene agencia asignada → Usa su propia agencia
3. Los paquetes en la saca heredan la agencia efectiva de la saca

### Endpoint Utilizado

```javascript
// Servicio
transportAgenciesService.getActive()

// Endpoint
GET /api/v1/transport-agencies/?active_only=true

// Respuesta
[
  {
    id: "uuid-123",
    name: "Servientrega",
    phone_number: "0999999999",
    active: true
  },
  ...
]
```

## Casos de Uso

### ✅ Caso 1: Crear saca sin agencia
- Usuario selecciona "-- Sin agencia asignada --"
- Se envía `transport_agency: ""`
- Si la saca pertenece a un lote, heredará la agencia del lote

### ✅ Caso 2: Crear saca con agencia específica
- Usuario selecciona "Servientrega - 0999999999"
- Se envía `transport_agency: "uuid-de-servientrega"`
- La saca usa esta agencia independientemente del lote

### ✅ Caso 3: Editar saca y cambiar agencia
- Usuario carga saca existente
- Select muestra la agencia actual preseleccionada
- Puede cambiarla o dejarla sin asignar

### ✅ Caso 4: No hay agencias disponibles
- Select muestra solo "-- Sin agencia asignada --"
- Mensaje de advertencia con enlace a crear agencias
- Formulario sigue siendo funcional (campo opcional)

## Archivos Modificados

1. ✅ `candas_frontend/src/pages/logistics/PullsCreate.jsx`
2. ✅ `candas_frontend/src/pages/logistics/PullsEdit.jsx`

## Archivos Creados

- Ninguno (solo modificaciones)

## Verificación

### ✅ Frontend
```bash
# Verificar que no hay referencias a guide_base
grep -r "guide_base" candas_frontend/
# No matches found

# HMR actualizado automáticamente
✅ PullsCreate.jsx - Recargado
✅ PullsEdit.jsx - Recargado
```

### ✅ Backend
- No se requirieron cambios
- API ya soportaba el campo `transport_agency` como UUID
- Endpoint de agencias ya existía

## Testing Recomendado

1. ✅ Crear saca sin agencia de transporte
2. ✅ Crear saca con agencia seleccionada del dropdown
3. ✅ Editar saca y cambiar la agencia
4. ✅ Editar saca y remover la agencia (dejar sin asignar)
5. ✅ Verificar herencia cuando saca pertenece a un lote
6. ✅ Probar cuando no hay agencias activas disponibles
7. ✅ Verificar modo oscuro (dark mode)
8. ✅ Verificar responsive design en móvil

## Estado del Sistema

| Componente | Estado |
|------------|--------|
| PullsCreate.jsx | ✅ Actualizado |
| PullsEdit.jsx | ✅ Actualizado |
| transportAgenciesService | ✅ Funcionando |
| HMR Frontend | ✅ Recargado |
| Consistencia UI | ✅ Unificada |

---

**✅ Actualización completada exitosamente**

**Fecha:** 2025-12-08  
**Formularios actualizados:** 2 (Crear y Editar Sacas)  
**Patrón:** Selector de Agencias Desplegable  
**Estado:** Completado y funcional
