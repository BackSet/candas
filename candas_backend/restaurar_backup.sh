#!/bin/bash
# Script para restaurar el backup de la base de datos

set -e

BACKUP_FILE="/home/backset/Projects/candas_db"
DB_NAME="candas_db"
DB_USER="backset"
DB_PORT="5433"

echo "🔄 Restaurando backup de base de datos"
echo "======================================"
echo ""

# Verificar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: No se encontró el archivo de backup: $BACKUP_FILE"
    exit 1
fi

echo "📁 Archivo de backup: $BACKUP_FILE"
echo "📊 Tamaño: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""

# Detectar el tipo de archivo (verificar si es binario pg_dump)
FIRST_BYTES=$(head -c 5 "$BACKUP_FILE" | od -An -tx1 | tr -d ' \n')
if echo "$FIRST_BYTES" | grep -q "5047444d50\|PGDMP"; then
    BACKUP_TYPE="custom"
    echo "📦 Tipo detectado: Dump personalizado de PostgreSQL (pg_dump -Fc)"
    echo ""
    echo "⚠️  Nota: Se eliminarán las tablas existentes antes de restaurar"
    echo ""
    echo "🔄 Restaurando dump personalizado..."
    # Usar socket Unix (sin -h) para autenticación peer, o TCP/IP con puerto
    if pg_restore -p $DB_PORT -U $DB_USER -d $DB_NAME -c -v "$BACKUP_FILE" 2>&1; then
        echo ""
        echo "✅ Restauración completada"
    else
        echo ""
        echo "⚠️  Algunos errores durante la restauración (puede ser normal si las tablas ya existen)"
        echo "   Verificando resultado..."
    fi
elif head -1 "$BACKUP_FILE" | grep -q "^--\|^CREATE\|^INSERT\|^COPY"; then
    BACKUP_TYPE="sql"
    echo "📦 Tipo detectado: Script SQL"
    echo ""
    echo "🔄 Restaurando script SQL..."
    psql -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$BACKUP_FILE" 2>&1 | tail -20
    echo ""
    echo "✅ Restauración completada"
else
    echo "⚠️  Tipo de archivo no reconocido. Intentando como dump personalizado..."
    echo ""
    echo "🔄 Restaurando como dump personalizado..."
    pg_restore -p $DB_PORT -U $DB_USER -d $DB_NAME -c -v "$BACKUP_FILE" 2>&1 || {
        echo ""
        echo "⚠️  Falló como dump personalizado. Intentando como SQL..."
        psql -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$BACKUP_FILE" 2>&1 | tail -20
    }
    echo ""
    echo "✅ Restauración completada"
fi

echo ""
echo "🧪 Verificando restauración..."
TABLE_COUNT=$(psql -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
echo "📋 Tablas encontradas: $TABLE_COUNT"

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo ""
    echo "📊 Primeras tablas:"
    psql -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 10;" 2>/dev/null | sed 's/^/   - /'
    echo ""
    echo "📈 Registros en algunas tablas:"
    psql -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
        SELECT 
            schemaname||'.'||tablename as tabla,
            n_live_tup as registros
        FROM pg_stat_user_tables 
        ORDER BY n_live_tup DESC 
        LIMIT 5;
    " 2>/dev/null | sed 's/^/   - /'
fi

echo ""
echo "✨ Proceso completado!"

