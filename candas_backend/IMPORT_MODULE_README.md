# Módulo de Importación de Paquetes desde Excel

## Descripción

El módulo de importación permite cargar archivos Excel (.xlsx o .xls) que contienen información de paquetes y guardarlos automáticamente en la base de datos.

## Características

- ✅ Carga de archivos Excel
- ✅ Validación automática de columnas requeridas
- ✅ Importación masiva de paquetes
- ✅ Detección de errores por fila
- ✅ Registro de importaciones realizadas
- ✅ Vista de detalle con estadísticas
- ✅ Log de errores para auditoría

## Requisitos del Archivo Excel

El archivo Excel debe contener una hoja con las siguientes columnas en la **primera fila**, en este ORDEN exacto (8 columnas):

```
guide_number -> nro_master -> notes -> city -> name -> address -> phone_number -> province
```

Además se aceptan nombres alternativos (aliases) por columna, respetando la posición indicada:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| Posición | Encabezado(s) aceptados | Tipo | Descripción |
|----------|--------------------------|------|-------------|
| 1 | `guide_number`, `guia`, `nro guia` | Texto | Número de guía |
| 2 | `nro_master`, `nro master`, `master` | Texto | Número de master (único) |
| 3 | `notes`, `notas` | Texto | Observaciones (opcional por fila) |
| 4 | `city`, `ciudad` | Texto | Ciudad de destino |
| 5 | `name`, `destinatario`, `nombre` | Texto | Nombre/descripción del paquete |
| 6 | `address`, `direccion` | Texto | Dirección de entrega |
| 7 | `phone_number`, `telefono`, `celular` | Texto | Número de teléfono de contacto |
| 8 | `province`, `provincia` | Texto | Provincia/estado |

## Estructura del Archivo

```
┌─────────────┬──────────────┬─────────────┬──────────────┬─────────┬──────────┬─────────────┐
│ nro_master  │ guide_number │ name        │ address      │ city    │ province │ phone_number│
├─────────────┼──────────────┼─────────────┼──────────────┼─────────┼──────────┼─────────────┤
│ MASTER001   │ GUIDE-001    │ Paquete 1   │ Calle 123    │ Madrid  │ Madrid   │ 910123456   │
│ MASTER002   │ GUIDE-002    │ Paquete 2   │ Avenida 456  │ BCN     │ Barcelona│ 933456789   │
└─────────────┴──────────────┴─────────────┴──────────────┴─────────┴──────────┴─────────────┘
```

## Cómo Usar

### 1. Crear archivo Excel

Crea un archivo Excel con la estructura requerida o utiliza el archivo de ejemplo:

```bash
python create_sample_excel.py
```

Esto generará un archivo `sample_import.xlsx` con datos de ejemplo.

### 2. Acceder al módulo de importación

1. Inicia sesión en la aplicación
2. Ve al menú **Paquetes** en el sidebar
3. Haz clic en **Importar Excel**

### 3. Subir archivo

1. Haz clic en el campo de archivo o arrastra tu archivo Excel
2. Selecciona un archivo .xlsx o .xls
3. Haz clic en el botón **Importar**

### 4. Ver resultados

Después de la importación:
- Se mostrará un resumen con estadísticas
- Verás el número de paquetes creados exitosamente
- Se listarán los errores encontrados (si los hay)

## Estados de Importación

| Estado | Descripción |
|--------|-------------|
| PENDIENTE | Importación registrada pero no procesada |
| PROCESANDO | Archivo en proceso de análisis |
| COMPLETADO | Importación finalizada (con o sin errores) |
| ERROR | Error fatal en la importación |

## Validaciones

El sistema realiza las siguientes validaciones:

### A Nivel de Archivo
- ✅ Extensión: .xlsx o .xls
- ✅ Presencia de columnas requeridas
- ✅ Formato correcto de encabezados

### A Nivel de Fila
- ✅ Todos los campos están presentes
- ✅ `nro_master` es único (no duplicado en BD o en el archivo)
- ✅ `guide_number` es único
- ✅ Los datos son del tipo correcto

### A Nivel de Negocio
- ✅ Los paquetes se crean con `status='PENDIENTE'` por defecto
- ✅ Se asigna `shipping_type='ESTÁNDAR'` por defecto
- ✅ La ciudad y provincia son válidas (sin validación de existencia en BD)

## Manejo de Errores

Si ocurren errores durante la importación:

1. La importación parcial se procesa (solo las filas válidas se guardan)
2. Se registra un log detallado de errores
3. Los errores aparecen en la vista de detalle
4. Se puede volver a intentar subiendo nuevamente (con datos corregidos)

### Ejemplos de Errores

```
Error en fila 3: Columna 'city' requerida faltante
Error en fila 5: nro_master 'MASTER001' duplicado
Error en fila 7: Valores faltantes en registro
```

## Vista de Detalle de Importación

Cada importación registra:

- **Fecha/Hora**: Cuándo se realizó la importación
- **Total de filas**: Cantidad de filas en el archivo
- **Paquetes importados**: Cantidad de paquetes creados exitosamente
- **Errores**: Cantidad de filas con problemas
- **Tasa de éxito**: Porcentaje de filas procesadas correctamente
- **Log de errores**: Detalle de cada error encontrado

## Panel de Administración

En el panel de administración Django (`/admin`):

- Visualiza el historial completo de importaciones
- Consulta estadísticas de importaciones
- Ve detalles de cada importación (read-only)
- **Nota**: No se pueden agregar importaciones manualmente desde admin

## Ejemplo de Flujo Completo

```
1. Crear archivo Excel
   └─ create_sample_excel.py

2. Acceder a Paquetes → Importar Excel

3. Seleccionar y subir archivo
   └─ sample_import.xlsx

4. Sistema procesa
   ├─ Valida columnas
   ├─ Analiza cada fila
   ├─ Detecta duplicados
   └─ Crea paquetes válidos

5. Ver resultados
   ├─ 5 paquetes importados ✅
   ├─ 0 errores ✅
   └─ Tasa de éxito: 100% ✅

6. Consultar en Panel de Admin
   └─ Historial de importaciones
```

## Troubleshooting

### "El archivo debe ser Excel (.xlsx o .xls)"
- Verifica que el archivo tenga la extensión correcta
- Algunos programas guardan como .csv en lugar de .xlsx

### "Columna requerida faltante"
- Revisa que la primera fila contenga las columnas requeridas (ver tabla de alias aceptados arriba)
- Los nombres NO son case-sensitive; se normalizan automáticamente

### "nro_master duplicado"
- Cada valor en la columna `nro_master` debe ser único
- Revisa que no haya valores repetidos en el archivo
- Verifica que el valor no exista ya en la base de datos

### "Valores faltantes en registro"
- Todos los campos requeridos deben tener un valor
- Las celdas vacías no se aceptan

## Notas de Seguridad

- 🔒 Solo usuarios autenticados pueden importar
- 📝 Todas las importaciones quedan registradas
- 🗑️ Se recomienda hacer backup antes de importaciones masivas
- ⚠️ Los duplicados se detectan pero no se sobrescriben

## Próximas Mejoras

- [ ] Descarga de plantilla Excel pre-formateada
- [ ] Importación con validación de ciudades/provincias
- [ ] Mapeo de agencias de transporte automático
- [ ] Previsualización de datos antes de importar
- [ ] Importación por lotes programada
