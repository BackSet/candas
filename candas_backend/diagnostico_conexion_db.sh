#!/bin/bash
# Script de diagnóstico completo para la conexión a la base de datos

echo "🔍 Diagnóstico de Conexión a Base de Datos"
echo "==========================================="
echo ""

# 1. Verificar configuración de Django
echo "📋 Configuración de Django:"
cd /home/backset/Projects/candas/candas_backend
python3 -c "
from config.settings import development as settings
db = settings.DATABASES['default']
print(f\"  Base de datos: {db['NAME']}\")
print(f\"  Usuario: {db['USER']}\")
print(f\"  Host: {db['HOST']}\")
print(f\"  Puerto: {db['PORT']}\")
print(f\"  Contraseña: {'***' if db['PASSWORD'] else '(vacía)'}\")
"
echo ""

# 2. Verificar si PostgreSQL está corriendo
echo "🔄 Estado de PostgreSQL:"
if pg_isready -h localhost -p 5432 &>/dev/null; then
    echo "  ✅ PostgreSQL está corriendo en puerto 5432"
    PG_PORT=5432
elif pg_isready -h localhost -p 5433 &>/dev/null; then
    echo "  ✅ PostgreSQL está corriendo en puerto 5433"
    PG_PORT=5433
else
    echo "  ❌ PostgreSQL NO está corriendo en 5432 ni 5433"
    echo "  💡 Intenta: sudo service postgresql start"
    PG_PORT=""
fi
echo ""

# 3. Verificar puertos en uso
echo "🔌 Puertos PostgreSQL en uso:"
sudo netstat -tlnp 2>/dev/null | grep postgres || sudo ss -tlnp 2>/dev/null | grep postgres || echo "  No se encontraron puertos PostgreSQL"
echo ""

# 4. Probar conexiones
if [ -n "$PG_PORT" ]; then
    echo "🧪 Probando conexiones:"
    echo ""
    
    # Probar con usuario backset sin contraseña (peer auth)
    echo "  Método 1: Usuario 'backset' sin contraseña (puerto $PG_PORT)"
    if psql -h localhost -p $PG_PORT -U backset -d postgres -c "SELECT current_user;" 2>&1 | grep -q "backset"; then
        echo "    ✅ Conexión exitosa con usuario 'backset'"
    else
        ERROR=$(psql -h localhost -p $PG_PORT -U backset -d postgres -c "SELECT 1;" 2>&1 | tail -1)
        echo "    ❌ Error: $ERROR"
    fi
    echo ""
    
    # Probar con usuario postgres
    echo "  Método 2: Usuario 'postgres' con contraseña (puerto $PG_PORT)"
    if PGPASSWORD=host0475392 psql -h localhost -p $PG_PORT -U postgres -d postgres -c "SELECT 1;" 2>&1 | grep -q "1"; then
        echo "    ✅ Conexión exitosa con usuario 'postgres'"
    else
        ERROR=$(PGPASSWORD=host0475392 psql -h localhost -p $PG_PORT -U postgres -d postgres -c "SELECT 1;" 2>&1 | tail -1)
        echo "    ❌ Error: $ERROR"
    fi
    echo ""
    
    # Verificar si existe la base de datos
    echo "  Verificando base de datos 'candas_db':"
    if psql -h localhost -p $PG_PORT -U backset -d candas_db -c "SELECT 1;" 2>&1 | grep -q "1"; then
        echo "    ✅ Base de datos 'candas_db' existe y es accesible"
    elif PGPASSWORD=host0475392 psql -h localhost -p $PG_PORT -U postgres -d candas_db -c "SELECT 1;" 2>&1 | grep -q "1"; then
        echo "    ✅ Base de datos 'candas_db' existe (accesible con postgres)"
    else
        echo "    ❌ Base de datos 'candas_db' NO existe o no es accesible"
        echo "    💡 Crea la base de datos: sudo -u postgres psql -c \"CREATE DATABASE candas_db;\""
    fi
fi
echo ""

# 5. Verificar pg_hba.conf
echo "📝 Configuración de autenticación (pg_hba.conf):"
PG_HBA=$(sudo find /etc/postgresql -name pg_hba.conf 2>/dev/null | head -1)
if [ -n "$PG_HBA" ]; then
    echo "  Archivo: $PG_HBA"
    echo "  Líneas relevantes:"
    sudo grep -E "^local|^host.*127.0.0.1" "$PG_HBA" 2>/dev/null | head -5 || echo "    No se encontraron líneas relevantes"
else
    echo "  ❌ No se encontró pg_hba.conf"
fi
echo ""

# 6. Probar conexión desde Django
echo "🐍 Probando conexión desde Django:"
cd /home/backset/Projects/candas/candas_backend
source venv_candas/bin/activate 2>/dev/null || echo "  ⚠️  Entorno virtual no activado"
python manage.py check --database default 2>&1 | head -10 || echo "  ❌ Error al verificar conexión"
echo ""

echo "✨ Diagnóstico completado"
echo ""
echo "💡 Soluciones recomendadas:"
echo "  1. Si PostgreSQL no está corriendo: sudo service postgresql start"
echo "  2. Si el puerto es incorrecto: ./cambiar_puerto_postgres.sh [puerto]"
echo "  3. Si falta la base de datos: ./solucion_rapida_postgres.sh"
echo "  4. Si hay problemas de autenticación: Revisa pg_hba.conf"

