#!/bin/bash
# Script de diagnóstico para PostgreSQL

echo "🔍 Diagnóstico de PostgreSQL"
echo "=============================="
echo ""

# 1. Verificar usuario actual
echo "👤 Usuario actual: $(whoami)"
echo ""

# 2. Intentar conectarse sin contraseña como usuario del sistema
echo "🔌 Intentando conectar sin contraseña..."
if psql -d postgres -c "SELECT current_user;" 2>/dev/null; then
    echo "✅ Conexión exitosa sin contraseña"
    CURRENT_USER=$(psql -d postgres -t -c "SELECT current_user;" 2>/dev/null | xargs)
    echo "   Usuario conectado: $CURRENT_USER"
else
    echo "❌ No se pudo conectar sin contraseña"
fi
echo ""

# 3. Verificar si existe el usuario postgres en el sistema
echo "🔍 Verificando usuarios del sistema..."
if id postgres &>/dev/null; then
    echo "✅ Usuario 'postgres' existe en el sistema"
else
    echo "❌ Usuario 'postgres' NO existe en el sistema"
fi
echo ""

# 4. Verificar archivos de configuración
echo "📁 Buscando archivos de configuración..."
PG_HBA=$(find /etc/postgresql -name pg_hba.conf 2>/dev/null | head -1)
if [ -n "$PG_HBA" ]; then
    echo "✅ Encontrado: $PG_HBA"
    echo ""
    echo "📝 Configuración actual (primeras líneas):"
    sudo cat "$PG_HBA" | grep -E "^local|^host" | head -5
else
    echo "❌ No se encontró pg_hba.conf"
fi
echo ""

# 5. Verificar estado de PostgreSQL
echo "🔄 Estado de PostgreSQL:"
if systemctl is-active --quiet postgresql 2>/dev/null || service postgresql status &>/dev/null; then
    echo "✅ PostgreSQL está corriendo"
else
    echo "❌ PostgreSQL NO está corriendo"
    echo "   Ejecuta: sudo service postgresql start"
fi
echo ""

# 6. Intentar diferentes métodos de conexión
echo "🧪 Probando diferentes métodos de conexión..."
echo ""

echo "Método 1: Sin especificar usuario (usa usuario del sistema)"
psql -d postgres -c "SELECT current_user, version();" 2>&1 | head -3
echo ""

echo "Método 2: Como usuario postgres del sistema"
sudo -u postgres psql -d postgres -c "SELECT current_user;" 2>&1 | head -3
echo ""

echo "Método 3: Con contraseña (host0475392)"
PGPASSWORD=host0475392 psql -h localhost -U postgres -d postgres -c "SELECT 1;" 2>&1 | head -3
echo ""

echo "✨ Diagnóstico completado"
echo ""
echo "💡 Soluciones posibles:"
echo "   1. Si Método 1 funciona: Crea un usuario PostgreSQL con tu nombre de usuario"
echo "   2. Si Método 2 funciona: Usa 'sudo -u postgres' para cambiar la contraseña"
echo "   3. Si nada funciona: Necesitas configurar pg_hba.conf y cambiar la contraseña"

