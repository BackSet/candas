# Mejora Completa: Filtro de Tipo de Envío

## Problemas Identificados y Solucionados

### 1. Faltaban Opciones en el Filtro

**Problema**: El filtro de tipo de envío no tenía todas las opciones necesarias.

**Solución**: Agregadas las siguientes opciones:

- ✅ **Todos los tipos** (value: `""`) - Muestra todos los paquetes sin filtrar
- ✅ **Sin Envío** (value: `"sin_envio"`) - Paquetes sin asignación (sin saca y sin agencia)
- ✅ **Envío Individual** (value: `"individual"`) - Paquetes con agencia pero sin saca
- ✅ **Envío en Saca** (value: `"saca"`) - Paquetes en saca sin lote
- ✅ **Envío en Lote** (value: `"lote"`) - Paquetes en lote

### 2. "Envío Individual" Listaba Todos los Paquetes

**Problema**: El filtro "individual" estaba mal definido. Listaba TODOS los paquetes sin saca, incluyendo aquellos que aún no tienen ninguna asignación.

**Causa**: La condición era solo `pull__isnull=True`, lo que incluía paquetes sin ninguna asignación.

**Solución**: Diferenciada la lógica entre:
- **Sin Envío**: `pull__isnull=True AND transport_agency__isnull=True`
- **Envío Individual**: `pull__isnull=True AND transport_agency__isnull=False`

### 3. Después de Buscar el Filtro Dejaba de Funcionar

**Problema**: Al cambiar un filtro después de hacer una búsqueda con vista previa, los resultados no se actualizaban correctamente o mostraban páginas incorrectas.

**Causa**: El estado `previewPage` no se reseteaba cuando cambiaban los filtros, causando que se buscara en una página que podría no existir con los nuevos filtros.

**Solución**: Agregado reset de `previewPage` a 1 cuando cambian los filtros:

```javascript
const handleFilterChange = (field, value) => {
  setFilters(prev => ({
    ...prev,
    [field]: value
  }))
  // Resetear página de vista previa cuando cambian los filtros
  setPreviewPage(1)
}

const handleStatusChange = (statusValue) => {
  // ... lógica de estado ...
  // Resetear página de vista previa cuando cambian los filtros
  setPreviewPage(1)
}
```

## Lógica Actualizada por Tipo de Envío

### Todos los Tipos (value: "")
- **Backend**: Sin filtro aplicado
- **Resultado**: Muestra todos los paquetes
- **Uso**: Ver el total de paquetes sin restricción

### Sin Envío (value: "sin_envio")
- **Backend**: `pull__isnull=True AND transport_agency__isnull=True`
- **Resultado**: Paquetes que NO tienen:
  - Saca asignada
  - Agencia de transporte asignada
- **Uso**: Paquetes recién ingresados o pendientes de asignación

### Envío Individual (value: "individual")
- **Backend**: `pull__isnull=True AND transport_agency__isnull=False`
- **Resultado**: Paquetes que:
  - NO están en saca
  - SÍ tienen agencia asignada
- **Uso**: Paquetes que se envían de forma individual, no agrupados

### Envío en Saca (value: "saca")
- **Backend**: `pull__isnull=False AND pull__batch__isnull=True`
- **Resultado**: Paquetes que:
  - Están en una saca
  - Esa saca NO está en un lote
- **Uso**: Paquetes agrupados en sacas independientes

### Envío en Lote (value: "lote")
- **Backend**: `pull__isnull=False AND pull__batch__isnull=False`
- **Resultado**: Paquetes que:
  - Están en una saca
  - Esa saca está dentro de un lote
- **Uso**: Paquetes en envíos masivos por lote

## Diagrama de Flujo de Estados

```
Paquete creado
    ↓
┌─────────────────────────┐
│   SIN ENVÍO             │
│ (sin pull, sin agencia) │
└─────────────────────────┘
    ↓
    ├─→ Se asigna agencia → ENVÍO INDIVIDUAL
    │                       (sin pull, con agencia)
    │
    └─→ Se asigna a saca → ENVÍO EN SACA
                           (con pull, sin batch)
                               ↓
                           Se asigna a lote → ENVÍO EN LOTE
                                             (con pull, con batch)
```

## Cambios Implementados

### Frontend

**Archivo**: `candas_frontend/src/pages/packages/PackageExport.jsx`

1. **Select actualizado** (línea ~436-451):
```jsx
<select
  value={filters.shipment_type}
  onChange={(e) => handleFilterChange('shipment_type', e.target.value)}
  className="..."
>
  <option value="">Todos los tipos</option>
  <option value="sin_envio">Sin Envío</option>
  <option value="individual">Envío Individual</option>
  <option value="saca">Envío en Saca</option>
  <option value="lote">Envío en Lote</option>
</select>
```

2. **Reset de página en cambios de filtros** (línea ~232-254):
```javascript
const handleFilterChange = (field, value) => {
  setFilters(prev => ({
    ...prev,
    [field]: value
  }))
  setPreviewPage(1) // ← AGREGADO
}

const handleStatusChange = (statusValue) => {
  // ... lógica ...
  setPreviewPage(1) // ← AGREGADO
}
```

### Backend

**Archivo**: `candas_backend/apps/packages/api/views.py`

1. **Método `get_queryset()` actualizado** (línea ~77-90):
```python
shipment_type = self.request.query_params.get('shipment_type', None)
if shipment_type == 'sin_envio':
    queryset = queryset.filter(pull__isnull=True, transport_agency__isnull=True)
elif shipment_type == 'individual':
    queryset = queryset.filter(pull__isnull=True, transport_agency__isnull=False)
elif shipment_type == 'saca':
    queryset = queryset.filter(pull__isnull=False, pull__batch__isnull=True)
elif shipment_type == 'lote':
    queryset = queryset.filter(pull__isnull=False, pull__batch__isnull=False)
```

2. **Action `export` actualizado** (línea ~325-336):
```python
shipment_type = filters.get('shipment_type')
if shipment_type == 'sin_envio':
    queryset = queryset.filter(pull__isnull=True, transport_agency__isnull=True)
elif shipment_type == 'individual':
    queryset = queryset.filter(pull__isnull=True, transport_agency__isnull=False)
elif shipment_type == 'saca':
    queryset = queryset.filter(pull__isnull=False, pull__batch__isnull=True)
elif shipment_type == 'lote':
    queryset = queryset.filter(pull__isnull=False, pull__batch__isnull=False)
```

## Casos de Uso

### Caso 1: Identificar Paquetes Pendientes de Asignación
**Filtro**: "Sin Envío"
**Resultado**: Paquetes que acaban de ingresar y necesitan ser procesados

### Caso 2: Ver Envíos Individuales
**Filtro**: "Envío Individual"
**Resultado**: Paquetes que van solos, no agrupados, ideal para envíos urgentes o especiales

### Caso 3: Ver Sacas Independientes
**Filtro**: "Envío en Saca"
**Resultado**: Paquetes agrupados en sacas que no forman parte de lotes más grandes

### Caso 4: Ver Envíos Masivos
**Filtro**: "Envío en Lote"
**Resultado**: Paquetes en lotes completos, útil para despachos grandes

### Caso 5: Vista General
**Filtro**: "Todos los tipos"
**Resultado**: Todos los paquetes sin restricción

## Testing

### Pruebas Recomendadas

1. **Test de Filtros**:
   - ✅ Seleccionar cada opción y verificar resultados
   - ✅ Cambiar entre filtros múltiples veces
   - ✅ Verificar contador estimado con cada filtro

2. **Test de Paginación**:
   - ✅ Buscar con un filtro
   - ✅ Navegar a página 2 o 3
   - ✅ Cambiar el filtro
   - ✅ Verificar que vuelve a página 1

3. **Test de Vista Previa**:
   - ✅ Buscar con "Sin Envío"
   - ✅ Cambiar a "Individual"
   - ✅ Buscar nuevamente
   - ✅ Verificar que muestra datos correctos

4. **Test de Exportación**:
   - ✅ Exportar con cada tipo de filtro
   - ✅ Verificar que el archivo contiene solo los paquetes correctos

## Verificación

### Backend
```bash
$ python manage.py check
System check identified no issues (0 silenced).
```

### Queries SQL Generadas

**Sin Envío:**
```sql
SELECT * FROM packages 
WHERE pull_id IS NULL 
  AND transport_agency_id IS NULL
```

**Individual:**
```sql
SELECT * FROM packages 
WHERE pull_id IS NULL 
  AND transport_agency_id IS NOT NULL
```

**Saca:**
```sql
SELECT * FROM packages p
INNER JOIN pulls pu ON p.pull_id = pu.id
WHERE p.pull_id IS NOT NULL 
  AND pu.batch_id IS NULL
```

**Lote:**
```sql
SELECT * FROM packages p
INNER JOIN pulls pu ON p.pull_id = pu.id
WHERE p.pull_id IS NOT NULL 
  AND pu.batch_id IS NOT NULL
```

## Archivos Modificados

1. **`candas_frontend/src/pages/packages/PackageExport.jsx`**
   - Agregado reset de `previewPage` en cambios de filtros
   - Actualizado select con todas las opciones
   - Mejoradas las descripciones

2. **`candas_backend/apps/packages/api/views.py`**
   - Actualizado `get_queryset()` con lógica completa
   - Actualizado action `export` con lógica consistente
   - Diferenciado correctamente "sin_envio" e "individual"

## Resultado Final

Ahora el filtro de tipo de envío:
- ✅ Tiene todas las opciones necesarias
- ✅ "Envío Individual" funciona correctamente (solo paquetes con agencia)
- ✅ Funciona después de múltiples búsquedas (resetea paginación)
- ✅ Es consistente entre vista previa, estimación y exportación
- ✅ Refleja correctamente el flujo de trabajo de paquetes

## Beneficios

1. **Claridad**: Cada opción tiene un propósito claro
2. **Precisión**: Los filtros son mutuamente excluyentes
3. **Usabilidad**: El filtro siempre funciona, sin importar cuántas veces se use
4. **Consistencia**: Misma lógica en toda la aplicación

¡El filtro de tipo de envío está completo y funcional!
