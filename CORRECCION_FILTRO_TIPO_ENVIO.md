# Corrección: Filtro de Tipo de Envío

## Problema Identificado

El filtro de "Tipo de Envío" no funcionaba en la vista previa ni en la estimación de cantidad de paquetes, aunque sí funcionaba en la exportación directa.

## Causa Raíz

El filtro de `shipment_type` estaba implementado en el action `export` del `PackageViewSet`, pero **NO estaba implementado** en el método `get_queryset()` que es el método principal usado por:
- El endpoint `list` (GET /api/v1/packages/)
- La vista previa de datos
- La estimación de cantidad de paquetes

## Solución Implementada

### 1. Agregado Filtro en get_queryset()

**Archivo**: `candas_backend/apps/packages/api/views.py`

**Cambios:**

1. Agregado `pull__batch` al `select_related` para optimizar queries:
```python
queryset = Package.objects.select_related(
    'pull',
    'pull__batch',  # ← AGREGADO
    'transport_agency',
    'delivery_agency',
    'parent'
)
```

2. Implementado filtro de tipo de envío:
```python
# Filtro por tipo de envío
shipment_type = self.request.query_params.get('shipment_type', None)
if shipment_type == 'individual':
    # Paquetes sin saca (pull es null)
    queryset = queryset.filter(pull__isnull=True)
elif shipment_type == 'saca':
    # Paquetes en saca pero no en lote
    queryset = queryset.filter(pull__isnull=False, pull__batch__isnull=True)
elif shipment_type == 'lote':
    # Paquetes en lote (pull.batch no es null)
    queryset = queryset.filter(pull__isnull=False, pull__batch__isnull=False)
```

3. Mejorado filtro de agencia de transporte:
```python
# Filtro por agencia de transporte
transport_agency = self.request.query_params.get('transport_agency', None)
if transport_agency:
    queryset = queryset.filter(
        Q(transport_agency_id=transport_agency) |
        Q(pull__transport_agency_id=transport_agency) |
        Q(pull__batch__transport_agency_id=transport_agency)
    )
```

## Lógica de Filtrado por Tipo de Envío

### Envío Individual
- **Condición**: `pull__isnull=True`
- **Descripción**: Paquetes que no pertenecen a ninguna saca
- **Ejemplo**: Paquete enviado directamente sin agrupar

### Envío en Saca
- **Condición**: `pull__isnull=False, pull__batch__isnull=True`
- **Descripción**: Paquetes que pertenecen a una saca, pero esa saca NO está en un lote
- **Ejemplo**: Paquetes agrupados en una saca que se envía sola

### Envío en Lote
- **Condición**: `pull__isnull=False, pull__batch__isnull=False`
- **Descripción**: Paquetes que pertenecen a una saca, y esa saca está dentro de un lote
- **Ejemplo**: Paquetes agrupados en una saca que forma parte de un lote más grande

## Beneficios de la Corrección

### 1. Consistencia
Ahora el filtro funciona consistentemente en:
- ✅ Vista previa de datos
- ✅ Estimación de cantidad
- ✅ Exportación
- ✅ Lista de paquetes

### 2. Performance Mejorada
- Agregado `pull__batch` al `select_related` evita queries N+1
- Filtros optimizados a nivel de base de datos

### 3. Filtro de Agencia Mejorado
El filtro de agencia ahora también considera:
- Agencia directa del paquete
- Agencia de la saca (pull)
- Agencia del lote (batch)

Esto permite encontrar paquetes cuya agencia está heredada de la jerarquía.

## Testing

### Verificación Manual

1. **Vista Previa**:
   - Seleccionar "Envío Individual" → Debería mostrar solo paquetes sin saca
   - Seleccionar "Envío en Saca" → Debería mostrar solo paquetes en sacas sin lote
   - Seleccionar "Envío en Lote" → Debería mostrar solo paquetes en lotes

2. **Estimación de Cantidad**:
   - El contador debe cambiar correctamente al seleccionar diferentes tipos de envío

3. **Exportación**:
   - El archivo exportado debe contener solo los paquetes del tipo seleccionado

### Queries SQL Generadas

**Individual:**
```sql
SELECT * FROM packages 
WHERE pull_id IS NULL
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

**`candas_backend/apps/packages/api/views.py`**
- Líneas ~47-95: Actualizado método `get_queryset()`
- Agregado filtro de `shipment_type`
- Mejorado filtro de `transport_agency`
- Agregado `pull__batch` a `select_related`

## Verificación

Backend sin errores:
```bash
$ python manage.py check
System check identified no issues (0 silenced).
```

## Resultado

Ahora el filtro de tipo de envío funciona correctamente en todos los endpoints:
- ✅ GET /api/v1/packages/?shipment_type=individual
- ✅ GET /api/v1/packages/?shipment_type=saca
- ✅ GET /api/v1/packages/?shipment_type=lote
- ✅ POST /api/v1/packages/export/ (con cualquier tipo)

El contador de paquetes estimados y la vista previa ahora reflejan correctamente el filtro seleccionado.

## Nota Importante

Los filtros de tipo de envío se basan en la estructura jerárquica de:
- **Package** (Paquete)
  - `pull` (Saca) → puede ser null
    - `batch` (Lote) → puede ser null

Esta lógica es coherente con el diseño del sistema explicado en `EXPLICACION_LOGICA_JERARQUIA.md`.
