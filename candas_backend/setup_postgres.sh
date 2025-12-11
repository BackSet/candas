#!/bin/bash
# Script para configurar PostgreSQL en WSL

set -e

echo "🔧 Configurando PostgreSQL en WSL..."

# 1. Verificar que PostgreSQL esté corriendo
echo "📊 Verificando estado de PostgreSQL..."
sudo service postgresql status || sudo service postgresql start

# 2. Cambiar contraseña del usuario postgres
echo "🔑 Configurando contraseña para usuario postgres..."
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'host0475392';"

# 3. Crear la base de datos si no existe
echo "📦 Creando base de datos candas_db..."
sudo -u postgres psql -c "CREATE DATABASE candas_db;" 2>/dev/null || echo "⚠️  Base de datos ya existe"

# 4. Configurar pg_hba.conf para usar md5 en lugar de peer
echo "⚙️  Configurando autenticación en pg_hba.conf..."
PG_HBA_FILE=$(sudo find /etc/postgresql -name pg_hba.conf | head -1)

if [ -n "$PG_HBA_FILE" ]; then
    echo "📝 Archivo encontrado: $PG_HBA_FILE"
    
    # Hacer backup
    sudo cp "$PG_HBA_FILE" "${PG_HBA_FILE}.backup"
    
    # Cambiar peer a md5 para conexiones locales
    sudo sed -i 's/local   all             all                                     peer/local   all             all                                     md5/' "$PG_HBA_FILE"
    sudo sed -i 's/local   all             all                                     ident/local   all             all                                     md5/' "$PG_HBA_FILE"
    
    # Cambiar ident a md5 para conexiones TCP/IP
    sudo sed -i 's/host    all             all             127.0.0.1\/32            ident/host    all             all             127.0.0.1\/32            md5/' "$PG_HBA_FILE"
    sudo sed -i 's/host    all             all             ::1\/128                   ident/host    all             all             ::1\/128                   md5/' "$PG_HBA_FILE"
    
    echo "✅ pg_hba.conf configurado"
else
    echo "⚠️  No se encontró pg_hba.conf"
fi

# 5. Reiniciar PostgreSQL
echo "🔄 Reiniciando PostgreSQL..."
sudo service postgresql restart

# 6. Probar conexión
echo "🧪 Probando conexión..."
sleep 2
PGPASSWORD=host0475392 psql -h localhost -U postgres -d candas_db -c "SELECT version();" && echo "✅ Conexión exitosa!" || echo "❌ Error en la conexión"

echo ""
echo "✨ Configuración completada!"
echo ""
echo "Ahora puedes conectarte con:"
echo "  PGPASSWORD=host0475392 psql -h localhost -U postgres -d candas_db"
echo ""
echo "O ejecutar tu script SQL:"
echo "  PGPASSWORD=host0475392 psql -h localhost -U postgres -d candas_db -f ../candas_db.sql"

