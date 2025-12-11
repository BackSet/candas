# 🚀 Guía Rápida - Módulo de Importación de Paquetes

## ⚡ Pasos para Empezar (5 minutos)

### 1️⃣ Archivo Excel Listo
El archivo de ejemplo ya está creado en:
```
sample_import.xlsx
```
Contiene 5 paquetes de ejemplo con todos los campos requeridos.

### 2️⃣ Iniciar el Servidor
```bash
python manage.py runserver
```

### 3️⃣ Acceder a la Aplicación
```
http://localhost:8000
```

### 4️⃣ Iniciar Sesión
- Usuario/Contraseña (según tu configuración)

### 5️⃣ Importar Paquetes
1. En el sidebar → **Paquetes** → **Importar Excel**
2. Haz clic en el campo de archivo
3. Selecciona `sample_import.xlsx`
4. Haz clic en **Importar**

### 6️⃣ Ver Resultados
- Se mostrará un resumen con: Total, Importados, Errores
- Verás una barra de progreso visual
- Si hay errores, aparecerán listados

### 7️⃣ Verificar en Admin
```
http://localhost:8000/admin/packages/packageimport/
```
Verás el registro de tu importación.

---

## 📝 Crear Tu Propio Archivo Excel

### Opción 1: Usar el Generador
```bash
python create_sample_excel.py
```
Genera un nuevo archivo `sample_import.xlsx` con datos de ejemplo.

### Opción 2: Crear Manualmente
Abre Excel o Calc y crea una tabla con estas columnas en la fila 1:

| nro_master | guide_number | name | address | city | province | phone_number |
|---|---|---|---|---|---|---|
| MASTER001 | GUIDE-001 | Mi Paquete | Calle 123 | Madrid | Madrid | 910000000 |
| MASTER002 | GUIDE-002 | Otro Paquete | Avenida 456 | Barcelona | Barcelona | 933000000 |

Luego guarda como `.xlsx` o `.xls`.

---

## ✅ Qué Sucede Internamente

```
1. Cargas archivo
   ↓
2. Sistema valida:
   - Tipo de archivo (.xlsx/.xls)
   - Columnas requeridas presentes
   ↓
3. Parsea cada fila:
   - Lee los datos
   - Detecta duplicados
   ↓
4. Importa:
   - Crea paquetes válidos
   - Registra errores
   ↓
5. Muestra resultado:
   - Estadísticas
   - Log de errores (si los hay)
```

---

## 🔍 Ver Importaciones Anteriores

En la página de importación verás a la derecha:
**"Importaciones Recientes"** (últimas 10)

Haz clic en cualquiera para ver detalles.

---

## ⚠️ Errores Comunes

| Error | Solución |
|-------|----------|
| "El archivo debe ser Excel" | Verifica que sea .xlsx o .xls |
| "Columna requerida faltante" | Revisa que la fila 1 tenga exactamente: `nro_master`, `guide_number`, `name`, `address`, `city`, `province`, `phone_number` |
| "nro_master duplicado" | Cada master debe ser único en el archivo y no estar en BD |
| "Valores faltantes" | Llena todas las celdas requeridas |

---

## 📊 Ejemplo de Resultado Exitoso

```
✅ Importación completada: 5 paquetes creados, 0 errores.

Estadísticas:
├─ Total de filas: 5
├─ Importados: 5 ✅
├─ Errores: 0
└─ Tasa de éxito: 100%
```

---

## 🎯 Casos de Uso

### Importar 100 paquetes a la vez
1. Prepara archivo con 100 filas
2. Sube en el módulo
3. ¡Listo! 100 paquetes creados en segundos

### Importar desde otro sistema
1. Exporta datos como Excel desde tu otro sistema
2. Renombra columnas a: nro_master, guide_number, name, address, city, province, phone_number
3. Carga en Candas
4. ¡Migrado!

### Detectar errores
1. Sube archivo con algunos errores
2. Mira el log de errores
3. Corrige el archivo
4. Vuelve a subir (solo suben los válidos)

---

## 📚 Para Más Detalles

Consulta: `IMPORT_MODULE_README.md` (guía completa)

---

## ✨ Resumen de Implementación

✅ Modelo `PackageImport` con tracking de importaciones  
✅ Servicio `PackageImportService` con parseo y validación  
✅ Dos vistas web (formulario y detalle)  
✅ Integración en sidebar  
✅ Admin panel con estadísticas  
✅ Archivo Excel de ejemplo  
✅ Documentación completa  

**Estado: LISTO PARA USAR** 🎉

---

**¿Listo? ¡Comienza!**

```bash
python manage.py runserver
```

Luego abre: http://localhost:8000/paquetes/importar/
