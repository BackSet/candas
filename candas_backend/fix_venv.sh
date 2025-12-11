#!/bin/bash
# Script para reparar el entorno virtual

set -e

echo "🔧 Reparando entorno virtual..."

# Cambiar al directorio del backend
cd "$(dirname "$0")"

# 1. Eliminar el venv corrupto (requiere sudo)
echo "📦 Eliminando entorno virtual corrupto..."
sudo rm -rf venv_candas

# 2. Instalar python3-venv si no está instalado
echo "📥 Verificando python3-venv..."
if ! dpkg -l | grep -q python3.13-venv && ! dpkg -l | grep -q python3-venv; then
    echo "📥 Instalando python3-venv..."
    sudo apt update
    sudo apt install -y python3.13-venv || sudo apt install -y python3-venv
else
    echo "✅ python3-venv ya está instalado"
fi

# 3. Crear nuevo entorno virtual
echo "🆕 Creando nuevo entorno virtual..."
python3 -m venv venv_candas

# 4. Activar y actualizar pip
echo "⬆️ Actualizando pip..."
source venv_candas/bin/activate
pip install --upgrade pip

# 5. Instalar dependencias
echo "📚 Instalando dependencias..."
pip install -r requirements.txt

echo "✅ ¡Entorno virtual reparado exitosamente!"
echo ""
echo "Para activar el entorno virtual, ejecuta:"
echo "  source venv_candas/bin/activate"

