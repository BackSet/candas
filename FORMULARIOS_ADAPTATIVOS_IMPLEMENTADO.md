# Implementación Completada: Formularios Adaptativos para Jerarquía de Envíos

## Resumen

Se han implementado formularios adaptativos que muestran u ocultan campos dinámicamente según el contexto de la jerarquía (individual/saca/lote), mejorando significativamente la experiencia de usuario y previniendo errores.

## Objetivo Cumplido

✅ Los formularios ahora se adaptan automáticamente:
- **Paquetes:** Muestran campos de agencia/guía solo si es envío individual
- **Sacas:** Ocultan campos de agencia/guía si pertenecen a un lote
- **Información clara:** Muestran de dónde se heredan los datos

## Cambios Implementados

### Backend (3 archivos modificados)

#### 1. apps/packages/models.py

**Métodos agregados al modelo Package:**

```python
def get_shipment_type(self):
    """Returns: 'individual', 'saca', o 'lote'"""
    if self.pull is None:
        return 'individual'
    elif self.pull.batch is not None:
        return 'lote'
    else:
        return 'saca'

def get_shipment_type_display(self):
    """Retorna el nombre de visualización para el tipo de envío"""
    type_map = {
        'individual': 'Envío Individual',
        'saca': 'Envío en Saca',
        'lote': 'Envío en Lote'
    }
    return type_map.get(self.get_shipment_type(), 'Desconocido')
```

**Propósito:** Identificar fácilmente el tipo de envío del paquete.

#### 2. apps/packages/api/serializers.py

**PackageListSerializer - Campos agregados:**
- `shipment_type`: Tipo de envío ('individual', 'saca', 'lote')
- `shipment_type_display`: Nombre legible del tipo

**PackageDetailSerializer - Campos agregados:**
- `shipment_type`: Tipo de envío
- `shipment_type_display`: Nombre legible del tipo

**PackageCreateSerializer - Validación agregada:**
```python
def validate(self, data):
    pull = data.get('pull')
    
    # Si está en saca, no puede tener agencia ni guía propias
    if pull:
        if data.get('transport_agency'):
            raise ValidationError({
                'transport_agency': 'No puede asignar agencia si el paquete está en una saca (heredará de la saca/lote)'
            })
        if data.get('agency_guide_number'):
            raise ValidationError({
                'agency_guide_number': 'No puede asignar número de guía si el paquete está en una saca (heredará de la saca/lote)'
            })
    
    return data
```

#### 3. apps/logistics/api/serializers.py

**PullCreateSerializer - Validación agregada:**
```python
def validate(self, data):
    batch = data.get('batch')
    
    # Si pertenece a lote, no puede tener agencia ni guía propias
    if batch:
        if data.get('transport_agency'):
            raise ValidationError({
                'transport_agency': 'No puede asignar agencia si la saca pertenece a un lote (heredará del lote)'
            })
        if data.get('guide_number'):
            raise ValidationError({
                'guide_number': 'No puede asignar número de guía si la saca pertenece a un lote (heredará del lote)'
            })
    
    return data
```

### Frontend (3 archivos modificados)

#### 1. pages/packages/PackagesForm.jsx

**Estados agregados:**
- `isIndividualShipment`: Controla si es envío individual
- `pulls`: Lista de sacas disponibles
- `pullInfo`: Información de la saca seleccionada
- `agencies`: Agencias de transporte activas

**Checkbox de Envío Individual:**
```jsx
<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={isIndividualShipment}
      onChange={(e) => {
        setIsIndividualShipment(e.target.checked)
        if (e.target.checked) {
          setFormData({...formData, pull: ''})
        } else {
          setFormData({...formData, transport_agency: '', agency_guide_number: ''})
        }
      }}
    />
    <span>Este es un envío individual</span>
  </label>
</div>
```

**Lógica Condicional:**
- **Si es Individual:** Muestra campos de agencia y número de guía
- **Si NO es Individual:** Muestra selector de saca e información heredada

**Información Heredada (cuando NO es individual):**
```jsx
{pullInfo && (
  <div className="p-4 bg-green-50 border rounded-lg">
    <h4>Información de Envío (Heredada)</h4>
    <p>Saca: {pullInfo.common_destiny}</p>
    <p>Agencia: {pullInfo.effective_agency?.name}</p>
    <p>Número de Guía: {pullInfo.effective_guide_number}</p>
    {pullInfo.batch_info && (
      <Badge>Lote: {pullInfo.batch_info.destiny}</Badge>
    )}
  </div>
)}
```

#### 2. pages/logistics/PullsCreate.jsx

**Estados agregados:**
- `batches`: Lista de lotes disponibles
- `batchInfo`: Información del lote seleccionado

**Selector de Lote agregado:**
```jsx
<select name="batch" value={formData.batch} onChange={handleInputChange}>
  <option value="">-- Sin lote asignado --</option>
  {batches.map((batch) => (
    <option key={batch.id} value={batch.id}>
      {batch.destiny} ({batch.id.slice(0, 8)}...)
    </option>
  ))}
</select>
```

**Lógica Condicional:**
- **Si tiene Lote:** Oculta campos de agencia/guía y muestra información heredada del lote
- **Si NO tiene Lote:** Muestra campos editables de agencia y guía

**Información Heredada (cuando hay lote):**
```jsx
{formData.batch && (
  <div className="p-4 bg-amber-50 border rounded-lg">
    <h4>Datos Heredados del Lote</h4>
    <p>Destino: {batchInfo.destiny}</p>
    <p>Agencia: {batchInfo.transport_agency_name}</p>
    <p>Número de Guía: {batchInfo.guide_number}</p>
  </div>
)}
```

**useEffect para cargar batch info:**
```javascript
useEffect(() => {
  if (formData.batch) {
    loadBatchInfo(formData.batch)
    // Limpiar campos que serán heredados
    setFormData(prev => ({
      ...prev,
      transport_agency: '',
      guide_number: ''
    }))
  } else {
    setBatchInfo(null)
  }
}, [formData.batch])
```

#### 3. pages/logistics/PullsEdit.jsx

**Misma lógica que PullsCreate.jsx:**
- ✅ Selector de lote
- ✅ Información heredada cuando hay lote
- ✅ Campos ocultos si pertenece a lote
- ✅ Carga automática de batch info

## Flujos de Usuario

### Escenario 1: Crear Paquete Individual

1. Usuario abre formulario de crear paquete
2. Marca checkbox "Este es un envío individual"
3. Aparecen campos:
   - Agencia de Transporte (select)
   - Número de Guía de Agencia
4. Usuario selecciona agencia e ingresa número de guía
5. Se guarda con `pull: null`, `transport_agency: [id]`, `agency_guide_number: [número]`

**Resultado:** Paquete con datos propios, tipo = 'individual'

### Escenario 2: Crear Paquete en Saca

1. Usuario abre formulario de crear paquete
2. NO marca checkbox (o lo desmarca)
3. Aparece selector de saca
4. Selecciona una saca
5. Campos de agencia/guía se ocultan
6. Aparece panel verde mostrando:
   - Saca asignada
   - Agencia heredada
   - Número de guía heredado
   - Lote (si la saca pertenece a uno)
7. Se guarda con `pull: [id]`, `transport_agency: null`, `agency_guide_number: ''`

**Resultado:** Paquete heredando datos de saca/lote, tipo = 'saca' o 'lote'

### Escenario 3: Crear Saca sin Lote

1. Usuario abre formulario de crear saca
2. Deja "Lote" en "-- Sin lote asignado --"
3. Ve campos editables:
   - Agencia de Transporte (select)
   - Número de Guía
4. Ingresa agencia y número de guía
5. Se guarda con `batch: null`, `transport_agency: [id]`, `guide_number: [número]`

**Resultado:** Saca con datos propios

### Escenario 4: Crear Saca en Lote

1. Usuario abre formulario de crear saca
2. Selecciona un lote del dropdown
3. Campos de agencia/guía se ocultan automáticamente
4. Aparece panel ámbar mostrando:
   - Destino del lote
   - Agencia del lote
   - Número de guía del lote
5. Se guarda con `batch: [id]`, `transport_agency: ''`, `guide_number: ''`

**Resultado:** Saca heredando datos del lote

## Validaciones Backend

### Prevención de Datos Redundantes

**PackageCreateSerializer:**
- ❌ No permite `transport_agency` si tiene `pull`
- ❌ No permite `agency_guide_number` si tiene `pull`

**PullCreateSerializer:**
- ❌ No permite `transport_agency` si tiene `batch`
- ❌ No permite `guide_number` si tiene `batch`

**Mensajes de error claros:**
- "No puede asignar agencia si el paquete está en una saca (heredará de la saca/lote)"
- "No puede asignar agencia si la saca pertenece a un lote (heredará del lote)"

## Archivos Modificados

### Backend
1. ✅ `candas_backend/apps/packages/models.py`
2. ✅ `candas_backend/apps/packages/api/serializers.py`
3. ✅ `candas_backend/apps/logistics/api/serializers.py`

### Frontend
4. ✅ `candas_frontend/src/pages/packages/PackagesForm.jsx`
5. ✅ `candas_frontend/src/pages/logistics/PullsCreate.jsx`
6. ✅ `candas_frontend/src/pages/logistics/PullsEdit.jsx`

## Nuevos Campos en el API

### PackageListSerializer y PackageDetailSerializer
- `shipment_type`: 'individual', 'saca', 'lote'
- `shipment_type_display`: 'Envío Individual', 'Envío en Saca', 'Envío en Lote'

**Ejemplo de respuesta:**
```json
{
  "id": "abc-123",
  "guide_number": "PKG-001",
  "shipment_type": "lote",
  "shipment_type_display": "Envío en Lote",
  "effective_transport_agency": {
    "id": "xyz",
    "name": "Servientrega"
  },
  "data_source": {
    "agency_source": "batch",
    "guide_source": "batch"
  }
}
```

## Beneficios de la Implementación

1. ✅ **Claridad Total:** Usuario entiende exactamente qué está ingresando
2. ✅ **Prevención de Errores:** No puede ingresar datos que serán ignorados
3. ✅ **Educativo:** Muestra la jerarquía visualmente
4. ✅ **Validación Robusta:** Backend valida y rechaza datos conflictivos
5. ✅ **UX Superior:** Formularios limpios y contextuales
6. ✅ **Información en Tiempo Real:** Muestra datos heredados mientras selecciona
7. ✅ **Consistencia:** Mismo patrón en todos los formularios

## Uso en Frontend

### Mostrar tipo de envío en tabla de paquetes

```javascript
{
  header: 'Tipo de Envío',
  accessor: 'shipment_type_display',
  cell: (row) => {
    const variants = {
      'individual': 'info',
      'saca': 'warning',
      'lote': 'success'
    }
    return <Badge variant={variants[row.shipment_type]}>
      {row.shipment_type_display}
    </Badge>
  }
}
```

### Filtrar por tipo de envío

```javascript
// Obtener solo envíos individuales
const individuales = packages.filter(p => p.shipment_type === 'individual')

// Obtener solo envíos en lote
const enLote = packages.filter(p => p.shipment_type === 'lote')
```

## Testing Recomendado

### Paquetes
- ✅ Crear paquete individual con agencia
- ✅ Crear paquete individual sin agencia
- ✅ Crear paquete asignado a saca (verificar que hereda datos)
- ✅ Crear paquete asignado a saca que está en lote (verificar herencia completa)
- ✅ Intentar crear paquete con saca Y agencia propia (debe ser rechazado)

### Sacas
- ✅ Crear saca sin lote con agencia propia
- ✅ Crear saca sin lote sin agencia
- ✅ Crear saca asignada a lote (verificar que campos se ocultan)
- ✅ Intentar crear saca con lote Y agencia propia (debe ser rechazado)
- ✅ Editar saca y asignar a lote (verificar limpieza de campos)

### Lotes
- ✅ Crear lote sin agencia
- ✅ Crear lote con agencia
- ✅ Verificar que lista muestra correctamente

## Estado del Sistema

| Componente | Estado |
|------------|--------|
| Backend Models | ✅ Actualizado con métodos helper |
| Backend Serializers | ✅ Con validaciones y nuevos campos |
| Frontend PackagesForm | ✅ Checkbox y lógica condicional |
| Frontend PullsCreate | ✅ Selector de lote y ocultamiento |
| Frontend PullsEdit | ✅ Misma lógica que Create |
| Validaciones | ✅ Backend valida jerarquía |
| HMR Frontend | ✅ Recargado automáticamente |

## Ejemplos Visuales

### Formulario de Paquete - Envío Individual
```
┌─────────────────────────────────────────┐
│ ✅ Este es un envío individual          │
│                                         │
│ Agencia de Transporte (Opcional)        │
│ ▼ Servientrega - 0999999999         ▼  │
│                                         │
│ Número de Guía de Agencia              │
│ [ AG-2025-001                      ]   │
└─────────────────────────────────────────┘
```

### Formulario de Paquete - En Saca
```
┌─────────────────────────────────────────┐
│ ☐ Este es un envío individual           │
│                                         │
│ Saca Asignada *                         │
│ ▼ QUITO - PICHINCHA - Pequeño       ▼  │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ✓ Información de Envío (Heredada)   │ │
│ │ Saca: QUITO - PICHINCHA             │ │
│ │ Agencia: Servientrega               │ │
│ │ Número de Guía: LOTE-2025-001       │ │
│ │ 🏷️ Lote: QUITO - PICHINCHA          │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Formulario de Saca - Sin Lote
```
┌─────────────────────────────────────────┐
│ Lote (Opcional)                         │
│ ▼ -- Sin lote asignado --           ▼  │
│                                         │
│ Agencia de Transporte | Número de Guía │
│ ▼ Servientrega      ▼ | SACA-2025-001  │
└─────────────────────────────────────────┘
```

### Formulario de Saca - Con Lote
```
┌─────────────────────────────────────────┐
│ Lote (Opcional)                         │
│ ▼ QUITO - PICHINCHA (abc123...)     ▼  │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📦 Datos Heredados del Lote         │ │
│ │ Destino: QUITO - PICHINCHA          │ │
│ │ Agencia: Servientrega               │ │
│ │ Número de Guía: LOTE-2025-001       │ │
│ │ ↓ Esta saca heredará estos datos    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ (Campos de agencia/guía OCULTOS)        │
└─────────────────────────────────────────┘
```

## Impacto en la Base de Datos

### Antes
```sql
-- Paquete en saca con datos redundantes
Package:
  pull_id = saca-123
  transport_agency = servientrega  ← Redundante, se ignora
  agency_guide_number = AG-001     ← Redundante, se ignora
```

### Ahora
```sql
-- Paquete en saca sin redundancia
Package:
  pull_id = saca-123
  transport_agency = NULL           ← Limpio
  agency_guide_number = ''          ← Limpio
```

**Ventaja:** Base de datos más limpia, sin datos conflictivos o redundantes.

## Próximos Pasos Sugeridos

1. **Actualizar PackagesList.jsx** para mostrar columna con `shipment_type_display`
2. **Agregar filtros** por tipo de envío en la lista de paquetes
3. **Crear reportes** agrupados por tipo de envío
4. **Agregar estadísticas** en Dashboard: cuántos individuales/sacas/lotes

---

**Fecha de implementación:** 2025-12-08
**Estado:** ✅ Completado exitosamente
**Archivos modificados:** 6
**TODOs completados:** 7/7
**Backend:** Sin errores
**Frontend:** HMR actualizado
