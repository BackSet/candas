# Implementacion Completada: Busqueda Rapida con Codigo de Barras

## Resumen

Se ha implementado una pagina de busqueda rapida que permite al usuario escanear paquetes con un lector de codigo de barras, configurar que campos ver y editar, y guardar cambios automaticamente al buscar el siguiente paquete.

## Funcionalidades Implementadas

### 1. Busqueda por Codigo de Barras
- Busqueda por `guide_number` del paquete
- Compatible con lectores de codigo de barras USB
- Input manual tambien disponible
- Auto-focus despues de cada busqueda

### 2. Configuracion Personalizable
- Usuario puede elegir que campos ver
- Usuario puede elegir que campos editar
- Configuracion guardada en el perfil del usuario (backend)
- Modal de configuracion accesible con boton

### 3. Guardado Automatico
- Los cambios se guardan automaticamente al buscar otro paquete
- Boton "Guardar Ahora" para guardado manual
- Indicador visual de cambios sin guardar

## Archivos Creados/Modificados

### Backend (6 archivos)

1. **apps/core/models.py** - Modelo UserPreferences
   - Campo `barcode_scan_config` (JSONField)
   - OneToOne con User

2. **apps/core/migrations/0001_initial.py** - Migration
   - Crea tabla core_userpreferences

3. **apps/core/api/serializers.py** (NUEVO)
   - UserPreferencesSerializer

4. **apps/core/api/views.py**
   - UserPreferencesViewSet
   - Action `barcode_config` (GET/PUT)

5. **apps/core/api/urls.py**
   - Router con preferences endpoint

6. **apps/packages/api/views.py**
   - Action `search_by_barcode` en PackageViewSet

### Frontend (6 archivos)

7. **src/services/userPreferencesService.js** (NUEVO)
   - `getBarcodeConfig()`
   - `updateBarcodeConfig(config)`

8. **src/components/FieldConfigModal.jsx** (NUEVO)
   - Modal para configurar campos visibles/editables
   - Checkboxes para cada campo
   - Validacion: campos editables deben estar visibles

9. **src/pages/packages/BarcodeScanner.jsx** (NUEVO)
   - Input de codigo de barras con auto-focus
   - Renderizado dinamico de campos segun configuracion
   - Guardado automatico al buscar siguiente
   - Indicador de cambios sin guardar

10. **src/services/packagesService.js**
    - Metodo `searchByBarcode(barcode)`

11. **src/App.jsx**
    - Ruta `/paquetes/scanner`

12. **src/components/Sidebar.jsx**
    - Enlace "Busqueda Rapida" en seccion Paquetes

## Estructura del Backend

### Modelo UserPreferences

```python
class UserPreferences(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    barcode_scan_config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### Endpoint de Configuracion

**GET** `/api/v1/preferences/barcode_config/`
Respuesta:
```json
{
  "barcode_scan_config": {
    "visible_fields": ["guide_number", "name", "city", "status", "notes"],
    "editable_fields": ["status", "notes"]
  }
}
```

**PUT** `/api/v1/preferences/barcode_config/`
Body:
```json
{
  "barcode_scan_config": {
    "visible_fields": ["guide_number", "name", "status"],
    "editable_fields": ["status"]
  }
}
```

### Endpoint de Busqueda

**GET** `/api/v1/packages/search_by_barcode/?barcode=<code>`

Respuesta exitosa:
```json
{
  "id": "uuid",
  "guide_number": "PKG-001",
  "name": "Juan Perez",
  "status": "EN_BODEGA",
  ...
}
```

Respuesta error:
```json
{
  "error": "Paquete con codigo PKG-001 no encontrado"
}
```

## Flujo de Usuario

### Primera Vez
1. Usuario accede a "Busqueda Rapida" desde sidebar
2. Sistema carga configuracion por defecto:
   - Visibles: guide_number, name, city, status, notes
   - Editables: status, notes
3. Usuario escanea codigo de barras
4. Sistema muestra paquete con campos configurados
5. Usuario edita campos permitidos
6. Al escanear siguiente, guarda automaticamente

### Personalizar Configuracion
1. Usuario hace clic en "Configurar Campos"
2. Modal muestra lista de campos disponibles
3. Usuario selecciona campos visibles (checkboxes)
4. Usuario selecciona campos editables (subset de visibles)
5. Guarda configuracion
6. Sistema actualiza vista inmediatamente
7. Configuracion persiste en backend

### Edicion Rapida
1. Usuario escanea paquete
2. Campos editables aparecen con input/select
3. Campos no editables aparecen como texto plano
4. Usuario modifica campos
5. Indicador muestra "cambios sin guardar"
6. Al escanear siguiente, guarda automaticamente
7. O puede hacer clic en "Guardar Ahora"

## Campos Disponibles

- **guide_number** - Numero de Guia (siempre visible, no editable)
- **nro_master** - Numero Master
- **name** - Nombre Destinatario
- **address** - Direccion
- **city** - Ciudad
- **province** - Provincia
- **phone_number** - Telefono
- **status** - Estado (select con opciones)
- **notes** - Notas (textarea)
- **hashtags** - Hashtags

## Configuracion por Defecto

Si el usuario no ha configurado preferencias, se usa:

```javascript
{
  visible_fields: ['guide_number', 'name', 'city', 'status', 'notes'],
  editable_fields: ['status', 'notes']
}
```

## Casos de Uso Comunes

### Recepcion de Paquetes
1. Configurar: Visibles=[guide_number, name, status], Editables=[status]
2. Escanear paquetes uno por uno
3. Cambiar estado a "EN_BODEGA"
4. Auto-guardado al siguiente escaneo

### Despacho
1. Configurar: Visibles=[guide_number, name, city, status, notes], Editables=[status, notes]
2. Escanear paquete
3. Cambiar estado a "EN_TRANSITO"
4. Agregar nota con numero de guia de agencia
5. Auto-guardado al siguiente

### Entrega
1. Configurar: Visibles=[guide_number, name, address, status], Editables=[status]
2. Escanear paquete
3. Cambiar estado a "ENTREGADO"
4. Auto-guardado al siguiente

## Ventajas

1. **Rapidez**: No hay que navegar entre paginas
2. **Eficiencia**: Auto-guardado elimina clicks
3. **Personalizacion**: Cada usuario configura lo que necesita
4. **Persistencia**: Configuracion guardada en servidor
5. **Compatible**: Funciona con lectores USB estandar
6. **Flexible**: Se adapta a diferentes flujos de trabajo

## Estado del Sistema

| Componente | Estado |
|------------|--------|
| Backend Model | OK - UserPreferences creado |
| Backend Migration | OK - Aplicada exitosamente |
| Backend API | OK - Endpoints funcionando |
| Frontend Service | OK - userPreferencesService |
| Frontend Modal | OK - FieldConfigModal |
| Frontend Scanner | OK - BarcodeScanner |
| Routing | OK - Ruta agregada |
| Sidebar | OK - Enlace agregado |
| Backend Check | OK - Sin errores |

## Proximos Pasos Sugeridos

1. **Estadisticas**: Mostrar contador de paquetes escaneados en sesion
2. **Historial**: Mostrar ultimos 5 paquetes escaneados
3. **Sonidos**: Agregar feedback auditivo al escanear (beep)
4. **Atajos**: Teclas rapidas para cambios comunes (F1=EN_BODEGA, F2=EN_TRANSITO, etc)
5. **Multiples campos**: Permitir edicion masiva (escanear varios, editar todos a la vez)

---

**Fecha de implementacion:** 2025-12-08
**Estado:** Completado exitosamente
**Archivos creados:** 3 backend, 3 frontend
**Archivos modificados:** 3 backend, 3 frontend
**TODOs completados:** 12/12
