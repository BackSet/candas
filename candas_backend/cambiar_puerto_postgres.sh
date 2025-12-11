#!/bin/bash
# Script para cambiar el puerto de PostgreSQL a 5433

set -e

NEW_PORT=${1:-5433}  # Usar el puerto proporcionado o 5433 por defecto

echo "🔧 Cambiando puerto de PostgreSQL a $NEW_PORT"
echo ""

# 1. Encontrar el archivo postgresql.conf
PG_CONF=$(sudo find /etc/postgresql -name postgresql.conf | head -1)

if [ -z "$PG_CONF" ]; then
    echo "❌ No se encontró postgresql.conf"
    echo "   Busca manualmente en: /etc/postgresql/[versión]/main/postgresql.conf"
    exit 1
fi

echo "📁 Archivo encontrado: $PG_CONF"
echo ""

# 2. Hacer backup
sudo cp "$PG_CONF" "${PG_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup creado"
echo ""

# 3. Cambiar el puerto
echo "⚙️  Cambiando puerto a $NEW_PORT..."

# Comentar la línea actual si existe
sudo sed -i "s/^port = .*/port = $NEW_PORT/" "$PG_CONF"

# Si no existe, agregarla
if ! grep -q "^port = " "$PG_CONF"; then
    echo "port = $NEW_PORT" | sudo tee -a "$PG_CONF" > /dev/null
fi

echo "✅ Puerto configurado en postgresql.conf"
echo ""

# 4. Verificar el cambio
echo "📝 Verificando configuración:"
sudo grep "^port" "$PG_CONF" || echo "⚠️  No se encontró la línea 'port'"
echo ""

# 5. Reiniciar PostgreSQL
echo "🔄 Reiniciando PostgreSQL..."
sudo service postgresql restart
echo ""

# 6. Verificar que está escuchando en el nuevo puerto
echo "🧪 Verificando que PostgreSQL está escuchando en el puerto $NEW_PORT..."
sleep 2
if sudo netstat -tlnp 2>/dev/null | grep -q ":$NEW_PORT " || sudo ss -tlnp 2>/dev/null | grep -q ":$NEW_PORT "; then
    echo "✅ PostgreSQL está escuchando en el puerto $NEW_PORT"
else
    echo "⚠️  No se pudo verificar. Intenta manualmente:"
    echo "   sudo netstat -tlnp | grep $NEW_PORT"
    echo "   o"
    echo "   sudo ss -tlnp | grep $NEW_PORT"
fi
echo ""

echo "✨ Configuración completada!"
echo ""
echo "Ahora puedes conectarte usando:"
echo "  psql -h localhost -p $NEW_PORT -d candas_db"
echo ""
echo "O con Django (ya está configurado en development.py):"
echo "  python manage.py runserver"

