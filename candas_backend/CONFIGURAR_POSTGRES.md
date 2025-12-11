# Configuración de PostgreSQL en WSL

## Pasos para configurar PostgreSQL

Ejecuta estos comandos en tu terminal WSL (te pedirá tu contraseña de sudo):

### 1. Cambiar contraseña del usuario postgres

```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'host0475392';"
```

### 2. Crear la base de datos

```bash
sudo -u postgres psql -c "CREATE DATABASE candas_db;"
```

### 3. Configurar autenticación (cambiar peer a md5)

```bash
# Encontrar el archivo pg_hba.conf
PG_HBA_FILE=$(sudo find /etc/postgresql -name pg_hba.conf | head -1)
echo "Archivo encontrado: $PG_HBA_FILE"

# Hacer backup
sudo cp "$PG_HBA_FILE" "${PG_HBA_FILE}.backup"

# Editar el archivo (cambiar peer a md5)
sudo nano "$PG_HBA_FILE"
```

En el editor, busca estas líneas y cámbialas:
- `local   all             all                                     peer` → `local   all             all                                     md5`
- `host    all             all             127.0.0.1/32            ident` → `host    all             all             127.0.0.1/32            md5`

Guarda y sal (Ctrl+X, luego Y, luego Enter)

### 4. Reiniciar PostgreSQL

```bash
sudo service postgresql restart
```

### 5. Probar la conexión

```bash
PGPASSWORD=host0475392 psql -h localhost -U postgres -d candas_db -c "SELECT version();"
```

### 6. Ejecutar tu script SQL

```bash
PGPASSWORD=host0475392 psql -h localhost -U postgres -d candas_db -f ../candas_db.sql
```

## Alternativa: Usar el script automático

Si prefieres, puedes ejecutar el script directamente:

```bash
cd /home/backset/Projects/candas/candas_backend
./setup_postgres.sh
```

Este script hace todos los pasos anteriores automáticamente.

## Verificar que Django puede conectarse

Después de configurar, prueba Django:

```bash
cd /home/backset/Projects/candas/candas_backend
source venv_candas/bin/activate
python manage.py runserver
```

Si todo está bien, deberías ver:
```
Starting development server at http://127.0.0.1:8000/
```

