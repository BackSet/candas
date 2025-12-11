# Sistema de Informes - Candas

## Descripción General

El sistema de informes permite generar reportes diarios y mensuales de los paquetes, sacas y lotes enviados. Los informes se pueden generar automáticamente mediante tareas programadas o manualmente desde la interfaz.

## Características Principales

### 1. Tipos de Informes

- **Informes Diarios**: Reportes de todos los envíos de un día específico
- **Informes Mensuales**: Reportes consolidados de todo un mes

### 2. Formatos de Exportación

Cada informe se puede exportar en tres formatos:
- **PDF**: Documento profesional con tablas y gráficos
- **Excel**: Archivo con múltiples hojas para análisis detallado
- **JSON**: Datos estructurados para integración con otros sistemas

### 3. Contenido de los Informes

Cada informe incluye:
- Resumen general (totales de paquetes, sacas y lotes)
- Desglose por agencia de transporte
- Desglose por destino
- Desglose por estado de paquetes
- Listado detallado de:
  - Paquetes (individuales y en sacas)
  - Sacas (con destino y agencia)
  - Lotes (con sacas asociadas)

## Mejoras en los Modelos

### Modelo Batch (Lote)

**Nuevos campos:**
- `guide_number`: Número de guía del lote (compartido con todas las sacas)

**Nuevos métodos:**
- `clean()`: Validación para asegurar que todas las sacas compartan el mismo destino

### Modelo Pull (Saca)

**Nuevos métodos:**
- `save()`: Sincroniza automáticamente el `guide_number` con el Batch
- `clean()`: Valida que el destino de la saca coincida con el del lote
- `get_effective_guide_number()`: Retorna el número de guía efectivo (del lote o propio)

### Modelo Package (Paquete)

**Nuevos métodos:**
- `is_individual_shipment()`: Indica si el paquete se envía sin saca
- `get_shipping_guide_number()`: Retorna el número de guía del envío
- `get_shipping_agency()`: Retorna la agencia de transporte efectiva
- `get_batch()`: Retorna el lote al que pertenece (si está en una saca de un lote)

## Funcionamiento del Sistema

### Relaciones entre Entidades

```
Lote (Batch)
  ├─ guide_number (común para todo el lote)
  ├─ destino (común para todo el lote)
  └─ Sacas (Pulls)
      ├─ guide_number (sincronizado con el lote)
      ├─ destino (debe coincidir con el lote)
      └─ Paquetes (Packages)
          └─ puede obtener guide_number de la saca/lote
          
Paquete Individual
  ├─ pull = None
  ├─ agency_guide_number (propio)
  └─ transport_agency (propia)
```

## Uso del Sistema

### 1. Generación Automática de Informes

Los informes se generan automáticamente mediante Celery:

**Informe Diario:**
- Se ejecuta todos los días a la 1:00 AM
- Genera el informe del día anterior
- Tarea: `apps.report.tasks.generate_daily_report_task`

**Informe Mensual:**
- Se ejecuta el día 1 de cada mes a las 2:00 AM
- Genera el informe del mes anterior
- Tarea: `apps.report.tasks.generate_monthly_report_task`

### 2. Generación Manual desde la API

**Endpoint para informe diario:**
```bash
POST /api/v1/reports/generate_daily/
Content-Type: application/json

{
    "report_date": "2024-01-15",
    "generate_files": true
}
```

**Endpoint para informe mensual:**
```bash
POST /api/v1/reports/generate_monthly/
Content-Type: application/json

{
    "year": 2024,
    "month": 1,
    "generate_files": true
}
```

### 3. Generación Manual desde el Frontend

1. Acceder a la sección "Informes" en el menú
2. Hacer clic en "Generar Nuevo Informe"
3. Seleccionar el tipo de informe (Diario o Mensual)
4. Elegir la fecha o mes/año
5. Opcionalmente, marcar para generar archivos inmediatamente
6. Hacer clic en "Generar Informe"

### 4. Visualización de Informes

- **Lista de Informes**: Ver todos los informes generados con filtros
- **Detalle del Informe**: Ver estadísticas completas y desgloses
- **Descargas**: Descargar PDF, Excel o JSON según disponibilidad

## Configuración del Sistema

### 1. Instalar Dependencias

```bash
cd candas_backend
source venv_candas/bin/activate
pip install -r requirements.txt
```

Nuevas dependencias agregadas:
- `celery==5.3.4`: Para tareas asíncronas
- `celery-beat==2.5.0`: Para tareas programadas
- `redis==5.0.1`: Broker para Celery
- `reportlab==4.4.5`: Generación de PDFs (ya estaba instalado)
- `openpyxl==3.1.5`: Generación de Excel (ya estaba instalado)

### 2. Ejecutar Migraciones

```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Configurar Redis (Broker de Celery)

**Instalar Redis:**
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis
```

**Iniciar Redis:**
```bash
redis-server
```

### 4. Iniciar Celery Worker

En un terminal separado:
```bash
cd candas_backend
source venv_candas/bin/activate
celery -A config worker -l info
```

### 5. Iniciar Celery Beat (Tareas Programadas)

En otro terminal separado:
```bash
cd candas_backend
source venv_candas/bin/activate
celery -A config beat -l info
```

## Estructura de Archivos

### Backend

```
candas_backend/
├── apps/
│   ├── logistics/
│   │   └── models.py (Batch y Pull mejorados)
│   ├── packages/
│   │   └── models.py (Package mejorado)
│   └── report/
│       ├── models.py (Report y ReportDetail)
│       ├── admin.py (Administración Django)
│       ├── tasks.py (Tareas Celery)
│       ├── api/
│       │   ├── serializers.py
│       │   ├── views.py
│       │   └── urls.py
│       └── services/
│           ├── report_generator.py
│           ├── pdf_exporter.py
│           └── excel_exporter.py
├── config/
│   ├── celery.py (Configuración Celery)
│   ├── settings.py (INSTALLED_APPS actualizado)
│   └── urls.py (URLs de report agregadas)
└── requirements.txt (Dependencias actualizadas)
```

### Frontend

```
candas_frontend/
├── src/
│   ├── services/
│   │   └── reportsService.js (Servicio API)
│   └── pages/
│       └── reports/
│           ├── ReportsList.jsx (Lista de informes)
│           ├── ReportsCreate.jsx (Generar informe)
│           └── ReportsView.jsx (Ver detalle)
```

## API Endpoints

### Informes

- `GET /api/v1/reports/` - Listar informes
- `GET /api/v1/reports/{id}/` - Detalle de un informe
- `POST /api/v1/reports/generate_daily/` - Generar informe diario
- `POST /api/v1/reports/generate_monthly/` - Generar informe mensual
- `GET /api/v1/reports/{id}/download_pdf/` - Descargar PDF
- `GET /api/v1/reports/{id}/download_excel/` - Descargar Excel
- `GET /api/v1/reports/{id}/download_json/` - Descargar JSON
- `POST /api/v1/reports/{id}/regenerate_files/` - Regenerar archivos
- `DELETE /api/v1/reports/{id}/` - Eliminar informe

### Detalles de Informes

- `GET /api/v1/report-details/` - Listar detalles
- `GET /api/v1/report-details/{id}/` - Detalle específico

## Notas Importantes

1. **Zona Horaria**: Configurada en `config/celery.py` como `America/Guayaquil`. Ajustar según ubicación.

2. **Horarios de Ejecución**: Los horarios de las tareas programadas se pueden ajustar en `config/celery.py`.

3. **Almacenamiento**: Los archivos PDF y Excel se guardan en `media/reports/`.

4. **Rendimiento**: Los informes grandes pueden tardar varios segundos en generarse. Se ejecutan de forma asíncrona.

5. **Seguridad**: Solo usuarios autenticados pueden generar y ver informes.

6. **Datos JSON**: Los datos se almacenan en el modelo para permitir consultas rápidas sin regenerar.

## Solución de Problemas

### Celery no se conecta a Redis

Verificar que Redis esté corriendo:
```bash
redis-cli ping
# Debe responder: PONG
```

### Los informes no se generan automáticamente

Verificar que Celery Beat esté corriendo y revisar los logs.

### Errores en la generación de PDF

Verificar que reportlab esté instalado correctamente:
```bash
pip install reportlab --upgrade
```

### Errores en la generación de Excel

Verificar que openpyxl esté instalado correctamente:
```bash
pip install openpyxl --upgrade
```

## Próximas Mejoras Sugeridas

1. Envío automático de informes por correo electrónico
2. Gráficos y visualizaciones en los PDFs
3. Filtros avanzados en la API
4. Comparativas entre periodos
5. Exportación a CSV
6. Dashboard con métricas en tiempo real
