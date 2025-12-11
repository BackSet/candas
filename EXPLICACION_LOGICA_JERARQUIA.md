# Explicación: Lógica de Jerarquía de Envíos

## Resumen Ejecutivo

Tu sistema **YA tiene implementada** una lógica de herencia jerárquica para manejar los datos comunes (destino, agencia de transporte, número de guía) entre Paquetes, Sacas y Lotes. Esta explicación detalla cómo funciona.

## Estructura Jerárquica

```
┌──────────────────────┐
│      LOTE            │  ← Nivel más alto
│  - destiny           │
│  - transport_agency  │
│  - guide_number      │
└──────────┬───────────┘
           │
           ↓ hereda (si no está definido)
┌──────────────────────┐
│      SACA            │  ← Nivel medio
│  - common_destiny    │
│  - transport_agency  │
│  - guide_number      │
│  - batch (FK)        │
└──────────┬───────────┘
           │
           ↓ hereda (si no está definido)
┌──────────────────────┐
│     PAQUETE          │  ← Nivel más bajo
│  - city/province     │
│  - transport_agency  │
│  - agency_guide_num  │
│  - pull (FK)         │
└──────────────────────┘
```

## Métodos de Herencia Implementados

### 1. En el Modelo Pull (Saca)

**Ubicación:** `apps/logistics/models.py` líneas 161-197

#### `get_effective_destiny()`
```python
def get_effective_destiny(self):
    """
    Retorna el destino efectivo de la saca.
    Prioridad: batch.destiny > common_destiny
    """
    if self.batch:
        return self.batch.destiny
    return self.common_destiny
```

**Lógica:**
- Si la saca pertenece a un lote → usa el destino del lote
- Si no → usa su propio `common_destiny`

#### `get_effective_agency()`
```python
def get_effective_agency(self):
    """
    Retorna la agencia de transporte efectiva.
    Prioridad: batch.transport_agency > transport_agency
    """
    if self.batch and self.batch.transport_agency:
        return self.batch.transport_agency
    return self.transport_agency
```

**Lógica:**
- Si el lote tiene agencia → usa la agencia del lote
- Si no → usa su propia agencia
- Si ninguno → `None`

#### `get_effective_guide_number()`
```python
def get_effective_guide_number(self):
    """
    Retorna el número de guía efectivo.
    Prioridad: batch.guide_number > guide_number
    """
    if self.batch and self.batch.guide_number:
        return self.batch.guide_number
    return self.guide_number
```

**Lógica:**
- Si el lote tiene número de guía → usa el del lote
- Si no → usa su propio número de guía

#### `get_data_source()`
```python
def get_data_source(self):
    """
    Indica de dónde viene cada dato.
    """
    return {
        'destiny_source': 'batch' if self.batch else 'pull',
        'agency_source': 'batch' if (self.batch and self.batch.transport_agency) else 'pull',
        'guide_source': 'batch' if (self.batch and self.batch.guide_number) else 'pull',
    }
```

**Propósito:** Permite al frontend mostrar de dónde proviene cada dato.

### 2. En el Modelo Package (Paquete)

**Ubicación:** `apps/packages/models.py` líneas 144-224

#### `is_individual_shipment()`
```python
def is_individual_shipment(self):
    """Retorna True si el paquete se envía individualmente (sin saca)."""
    return self.pull is None
```

**Uso:** Identifica si es un envío individual.

#### `get_shipping_agency()`
```python
def get_shipping_agency(self):
    """
    Retorna la agencia de transporte efectiva del paquete.
    Prioridad: pull.batch.transport_agency > pull.transport_agency > transport_agency
    """
    if self.pull:
        # Delega en el Pull (que ya maneja la jerarquía con batch)
        return self.pull.get_effective_agency()
    return self.transport_agency
```

**Lógica completa:**
1. Si está en saca → delega en `pull.get_effective_agency()`
   - Que a su vez verifica si hay lote
2. Si NO está en saca → usa su propia `transport_agency`

#### `get_shipping_guide_number()`
```python
def get_shipping_guide_number(self):
    """
    Retorna el número de guía efectivo para el envío.
    Prioridad: pull.batch.guide_number > pull.guide_number > agency_guide_number
    """
    if self.pull:
        return self.pull.get_effective_guide_number()
    return self.agency_guide_number
```

**Lógica completa:**
1. Si está en saca → delega en `pull.get_effective_guide_number()`
2. Si NO está en saca → usa su propio `agency_guide_number`

#### `get_effective_destiny()`
```python
def get_effective_destiny(self):
    """
    Retorna el destino efectivo del paquete.
    Prioridad: pull.batch.destiny > pull.common_destiny > city/province
    """
    if self.pull:
        return self.pull.get_effective_destiny()
    return f"{self.city}, {self.province}"
```

#### `get_batch()`
```python
def get_batch(self):
    """Retorna el lote al que pertenece el paquete (si aplica)."""
    if self.pull and self.pull.batch:
        return self.pull.batch
    return None
```

**Uso:** Permite saber si un paquete está en un lote (a través de su saca).

#### `get_data_source()`
```python
def get_data_source(self):
    """
    Retorna un diccionario indicando el origen de cada dato de envío.
    """
    if self.pull:
        pull_sources = self.pull.get_data_source()
        return {
            'destiny_source': pull_sources['destiny_source'],
            'agency_source': pull_sources['agency_source'] if self.pull.get_effective_agency() else 'package',
            'guide_source': pull_sources['guide_source'] if self.pull.get_effective_guide_number() else 'package',
        }
    return {
        'destiny_source': 'package',
        'agency_source': 'package',
        'guide_source': 'package',
    }
```

## Validaciones Implementadas

### 1. Validación en Pull (Saca)
**Ubicación:** `apps/logistics/models.py` líneas 140-159

```python
def clean(self):
    # Si pertenece a un lote, validar que compartan el mismo destino
    if self.batch and self.batch.destiny != self.common_destiny:
        raise ValidationError({
            'batch': f'El destino de la saca debe coincidir con el destino del lote: {self.batch.destiny}'
        })
    
    # Validar que los paquetes asociados tengan city compatible con el destino
    if self.pk:
        packages = Package.objects.filter(pull=self)
        for package in packages:
            if package.city.upper() not in self.common_destiny.upper():
                raise ValidationError({
                    'common_destiny': f'El paquete {package.guide_number} tiene ciudad "{package.city}" que no coincide con el destino "{self.common_destiny}"'
                })
```

**Asegura:**
- Saca y Lote tienen el mismo destino
- Paquetes en la saca tienen ciudad compatible

### 2. Validación en Package (Paquete)
**Ubicación:** `apps/packages/models.py` líneas 201-223

```python
def clean(self):
    # Si tiene pull, validar que la ciudad esté en el destino de la saca
    if self.pull:
        pull_destiny = self.pull.common_destiny.upper()
        package_city = self.city.upper()
        
        if package_city not in pull_destiny:
            raise ValidationError({
                'city': f'La ciudad "{self.city}" no coincide con el destino de la saca "{self.pull.common_destiny}"'
            })
        
        # Si la saca pertenece a un lote, validar contra el lote también
        if self.pull.batch:
            batch_destiny = self.pull.batch.destiny.upper()
            if package_city not in batch_destiny:
                raise ValidationError({
                    'city': f'La ciudad "{self.city}" no coincide con el destino del lote "{self.pull.batch.destiny}"'
                })
```

**Asegura:**
- Ciudad del paquete compatible con destino de la saca
- Si hay lote, también compatible con destino del lote

### 3. Validación en Batch (Lote)
**Ubicación:** `apps/logistics/models.py` líneas 58-71

```python
def clean(self):
    # Si hay sacas asociadas, validar que compartan el mismo destino
    if self.pk:
        pulls_with_different_destiny = self.pulls.exclude(
            common_destiny=self.destiny
        ).exists()
        if pulls_with_different_destiny:
            raise ValidationError({
                'destiny': 'Todas las sacas del lote deben tener el mismo destino.'
            })
```

**Asegura:**
- Todas las sacas en el lote tienen el mismo destino

## Cómo Identificar el Tipo de Envío en la Lista de Paquetes

### Opción 1: Usar el método existente

```python
# En un paquete
if package.is_individual_shipment():
    print("Envío Individual")
elif package.get_batch():
    print(f"Envío en Lote: {package.get_batch()}")
else:
    print(f"Envío en Saca: {package.pull}")
```

### Opción 2: Agregar un método adicional (recomendado)

**Agregar al modelo Package:**

```python
def get_shipment_type(self):
    """
    Retorna el tipo de envío del paquete.
    Returns: 'individual', 'saca', o 'lote'
    """
    if self.pull is None:
        return 'individual'
    elif self.pull.batch is not None:
        return 'lote'
    else:
        return 'saca'

def get_shipment_info(self):
    """
    Retorna información completa sobre el tipo de envío.
    """
    shipment_type = self.get_shipment_type()
    
    if shipment_type == 'individual':
        return {
            'type': 'individual',
            'type_display': 'Envío Individual',
            'container': None,
            'batch': None,
        }
    elif shipment_type == 'saca':
        return {
            'type': 'saca',
            'type_display': 'Envío en Saca',
            'container': self.pull,
            'container_id': self.pull.id,
            'batch': None,
        }
    else:  # lote
        return {
            'type': 'lote',
            'type_display': 'Envío en Lote',
            'container': self.pull,
            'container_id': self.pull.id,
            'batch': self.pull.batch,
            'batch_id': self.pull.batch.id,
        }
```

### Opción 3: En el Serializer (para el API)

**Agregar al PackageListSerializer:**

```python
class PackageListSerializer(serializers.ModelSerializer):
    shipment_type = serializers.SerializerMethodField()
    shipment_info = serializers.SerializerMethodField()
    
    def get_shipment_type(self, obj):
        """Retorna: 'individual', 'saca', o 'lote'"""
        if obj.pull is None:
            return 'individual'
        elif obj.pull.batch is not None:
            return 'lote'
        else:
            return 'saca'
    
    def get_shipment_info(self, obj):
        """Información detallada del envío"""
        return obj.get_shipment_info()  # Usa el método del modelo
```

## Flujo de Datos Completo

### Ejemplo 1: Paquete en Lote

```
Lote:
  - destiny = "QUITO - PICHINCHA"
  - transport_agency = Servientrega
  - guide_number = "LOTE-2025-001"
    ↓
Saca:
  - common_destiny = "QUITO - PICHINCHA"
  - transport_agency = None ← heredará del lote
  - guide_number = "" ← heredará del lote
  - batch = [Lote arriba]
    ↓
Paquete:
  - city = "QUITO"
  - province = "PICHINCHA"
  - transport_agency = None ← heredará de saca/lote
  - agency_guide_number = "" ← heredará de saca/lote
  - pull = [Saca arriba]

RESULTADO EFECTIVO del paquete:
  - Destino: "QUITO - PICHINCHA" (desde lote vía saca)
  - Agencia: Servientrega (desde lote vía saca)
  - Guía: "LOTE-2025-001" (desde lote vía saca)
  - Tipo: "lote"
```

### Ejemplo 2: Paquete en Saca (sin lote)

```
Saca:
  - common_destiny = "GUAYAQUIL - GUAYAS"
  - transport_agency = Laar Courier
  - guide_number = "SACA-2025-050"
  - batch = None
    ↓
Paquete:
  - city = "GUAYAQUIL"
  - province = "GUAYAS"
  - transport_agency = None ← heredará de saca
  - agency_guide_number = "" ← heredará de saca
  - pull = [Saca arriba]

RESULTADO EFECTIVO del paquete:
  - Destino: "GUAYAQUIL - GUAYAS" (desde saca)
  - Agencia: Laar Courier (desde saca)
  - Guía: "SACA-2025-050" (desde saca)
  - Tipo: "saca"
```

### Ejemplo 3: Paquete Individual

```
Paquete:
  - city = "CUENCA"
  - province = "AZUAY"
  - transport_agency = TramExpress
  - agency_guide_number = "PKG-123"
  - pull = None

RESULTADO EFECTIVO del paquete:
  - Destino: "CUENCA, AZUAY" (propio)
  - Agencia: TramExpress (propio)
  - Guía: "PKG-123" (propio)
  - Tipo: "individual"
```

## Uso en el Frontend

### Para mostrar en la lista de paquetes:

```javascript
// Ejemplo de columna en la tabla
{
  header: 'Tipo de Envío',
  accessor: 'shipment_type',
  cell: (row) => {
    const badges = {
      'individual': <Badge variant="info">Individual</Badge>,
      'saca': <Badge variant="warning">Saca</Badge>,
      'lote': <Badge variant="success">Lote</Badge>,
    }
    return badges[row.shipment_type] || '-'
  }
}
```

### Para mostrar datos efectivos:

```javascript
// En el detalle del paquete
<div>
  <h3>Información de Envío</h3>
  <p>Agencia: {package.effective_transport_agency}</p>
  <p>Número de Guía: {package.effective_guide_number}</p>
  <p>Destino: {package.effective_destiny}</p>
  
  {package.data_source && (
    <small>
      Origen: 
      {package.data_source.agency_source === 'batch' && ' (heredado de lote)'}
      {package.data_source.agency_source === 'pull' && ' (heredado de saca)'}
      {package.data_source.agency_source === 'package' && ' (propio)'}
    </small>
  )}
</div>
```

## Resolución de Conflictos

### Problema: "Conflictos cuando una saca se crea y un paquete ya tiene asignado una agencia"

**Solución implementada:**
La jerarquía SIEMPRE prioriza el nivel superior:
- Si un paquete está en una saca → usa la agencia de la saca (o del lote si aplica)
- La agencia propia del paquete solo se usa si NO está en saca

**Recomendación:**
1. Cuando un paquete se asigna a una saca, el sistema debe usar la agencia de la saca
2. La agencia propia del paquete (`transport_agency`) se ignora si `pull` no es None
3. Esto está implementado en `get_shipping_agency()`

### ¿Qué hacer con paquetes que ya tienen agencia asignada?

**Opción A - Mantener comportamiento actual (recomendado):**
- El paquete mantiene su `transport_agency` en la BD
- Pero cuando se consulta para envío, se usa `get_shipping_agency()` que prioriza la saca/lote
- Esto permite "desasignar" el paquete de la saca y volver a su agencia original

**Opción B - Limpiar al asignar a saca:**
```python
# En el serializer o servicio que crea la saca
def assign_packages_to_pull(pull, package_ids):
    packages = Package.objects.filter(id__in=package_ids)
    for package in packages:
        package.pull = pull
        # Opcional: limpiar datos que ahora son heredados
        # package.transport_agency = None
        # package.agency_guide_number = ''
        package.save()
```

## Resumen de Métodos Clave

### Para Sacas (Pull):
- `get_effective_destiny()` - Destino efectivo
- `get_effective_agency()` - Agencia efectiva
- `get_effective_guide_number()` - Número de guía efectivo
- `get_data_source()` - Origen de los datos

### Para Paquetes (Package):
- `is_individual_shipment()` - ¿Es envío individual?
- `get_shipping_agency()` - Agencia para envío
- `get_shipping_guide_number()` - Número de guía para envío
- `get_effective_destiny()` - Destino efectivo
- `get_batch()` - Lote al que pertenece (si aplica)
- `get_data_source()` - Origen de los datos

## Conclusión

**Tu sistema YA tiene implementada la lógica de herencia jerárquica correctamente.**

- ✅ Los métodos `get_effective_*()` manejan la herencia automáticamente
- ✅ Las validaciones aseguran consistencia de datos
- ✅ Puedes identificar el tipo de envío con `is_individual_shipment()` y `get_batch()`
- ✅ El origen de datos se puede rastrear con `get_data_source()`

**Solo necesitas:**
1. Usar estos métodos en tus vistas/serializers
2. Opcionalmente agregar `get_shipment_type()` y `get_shipment_info()` para facilitar la identificación
3. Actualizar el frontend para mostrar esta información

**El conflicto que mencionas se resuelve usando siempre `get_shipping_agency()` en lugar de acceder directamente a `transport_agency`.**
