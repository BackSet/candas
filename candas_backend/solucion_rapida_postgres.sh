#!/bin/bash
# Solución rápida: Crear usuario PostgreSQL con el nombre del usuario actual

set -e

CURRENT_USER=$(whoami)
echo "🔧 Configurando PostgreSQL para usuario: $CURRENT_USER"
echo ""

# 1. Verificar que PostgreSQL esté corriendo
echo "📊 Verificando PostgreSQL..."
sudo service postgresql status || sudo service postgresql start
echo ""

# 2. Crear usuario PostgreSQL con el nombre del usuario actual (si no existe)
echo "👤 Creando usuario PostgreSQL '$CURRENT_USER'..."
sudo -u postgres psql -c "CREATE USER $CURRENT_USER WITH SUPERUSER PASSWORD 'host0475392';" 2>/dev/null || \
sudo -u postgres psql -c "ALTER USER $CURRENT_USER WITH SUPERUSER PASSWORD 'host0475392';" 2>/dev/null || \
echo "⚠️  Usuario ya existe o error al crear"
echo ""

# 3. Crear la base de datos
echo "📦 Creando base de datos candas_db..."
sudo -u postgres psql -c "CREATE DATABASE candas_db OWNER $CURRENT_USER;" 2>/dev/null || echo "⚠️  Base de datos ya existe"
echo ""

# 4. Dar permisos al usuario
echo "🔐 Otorgando permisos..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE candas_db TO $CURRENT_USER;"
echo ""

# 5. Probar conexión
echo "🧪 Probando conexión..."
if psql -d candas_db -c "SELECT current_user, current_database();" 2>/dev/null; then
    echo "✅ ¡Conexión exitosa!"
    echo ""
    echo "Ahora puedes:"
    echo "  1. Ejecutar: psql -d candas_db"
    echo "  2. Ejecutar tu script: psql -d candas_db -f ../candas_db.sql"
    echo "  3. Ejecutar Django: python manage.py runserver"
else
    echo "❌ Error en la conexión"
    echo ""
    echo "Intenta manualmente:"
    echo "  psql -d candas_db"
fi

