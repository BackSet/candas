---
name: Mejorar Manifiestos - Notas y Firmas
overview: Modificar los manifiestos para reducir el tamaño de fuente, mostrar notas debajo de cada guía como fila expandida, agregar columna de firmas, y añadir nota informativa sobre el uso de las notas.
todos:
  - id: backend-create-child-endpoint
    content: Crear endpoint backend create_child con nomenclatura automática
    status: completed
  - id: backend-migrate-endpoint
    content: Crear endpoint backend migrate-code para cambio de código
    status: completed
  - id: frontend-service-methods
    content: Agregar métodos createChild, migrateCode, associateChildren a packagesService
    status: completed
  - id: frontend-child-form
    content: Crear componente PackageChildForm para crear nuevos hijos
    status: completed
  - id: frontend-children-manager
    content: Actualizar PackageChildrenManager con pestañas (Crear/Asociar)
    status: completed
  - id: frontend-clementina-section
    content: Agregar sección 'Clementina' en PackagesDetail para gestión de hijos
    status: completed
  - id: frontend-migration-modal
    content: Crear componente PackageCodeMigration para cambio de código
    status: completed
  - id: frontend-integration
    content: Integrar todos los componentes en PackagesDetail
    status: completed
  - id: frontend-exports
    content: Exportar nuevos componentes en index.js
    status: completed
  - id: testing-validation
    content: Probar validaciones, nomenclatura automática y flujos completos
    status: completed
---

# Plan: Mejorar Manifiestos - Notas y Firmas

## Objetivo
Modificar los manifiestos para:
1. Reducir el tamaño de fuente en todo el documento
2. Mostrar la nota debajo de cada guía como una fila expandida en la tabla
3. Agregar una columna de "Firma" para cada paquete
4. Agregar una nota informativa al inicio sobre la importancia de las notas

## Archivos a Modificar

### 1. BaseManifestGenerator (`candas_backend/apps/shared/services/manifest_template.py`)
- Reducir tamaños de fuente:
  - `get_title_style()`: fontSize 18 → 16
  - `get_heading_style()`: fontSize 13 → 11
  - `get_normal_style()`: fontSize 10 → 9
  - `get_highlight_style()`: fontSize 11 → 10
  - `create_data_table()`: fontSize headers 10 → 9, datos 9 → 8
- Agregar método `get_info_note()` que retorne un Paragraph con la nota informativa sobre las notas
- Agregar método `create_package_table_with_notes()` que cree una tabla con estructura especial:
  - Filas de paquetes con columnas: #, Guía, Destinatario, Dirección, Ciudad, Provincia, Teléfono, Firma
  - Después de cada fila de paquete, una fila expandida con la nota (si existe) o mensaje indicando usar información de celdas

### 2. PDFService.generate_pull_manifest (`candas_backend/apps/logistics/services/pdf_service.py`)
- 