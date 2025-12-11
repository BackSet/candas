# Solución para PostgreSQL en WSL

## Problema
La autenticación con el usuario `postgres` falla porque la contraseña no coincide o no está configurada.

## Solución Rápida (Recomendada)

### Opción A: Usar tu usuario del sistema (backset)

Esta es la forma más fácil porque no requiere contraseña:

```bash
# 1. Ejecutar el script de solución rápida
cd /home/backset/Projects/candas/candas_backend
./solucion_rapida_postgres.sh
```

Este script:
- Crea un usuario PostgreSQL llamado `backset` (tu usuario del sistema)
- Crea la base de datos `candas_db`
- Te permite conectarte sin contraseña usando autenticación "peer"

**La configuración de Django ya está actualizada para usar este método.**

### Opción B: Configurar usuario postgres con contraseña

Si prefieres usar el usuario `postgres`:

```bash
# 1. Cambiar contraseña del usuario postgres
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'host0475392';"

# 2. Crear la base de datos
sudo -u postgres psql -c "CREATE DATABASE candas_db;"

# 3. Configurar pg_hba.conf para usar md5
PG_HBA_FILE=$(sudo find /etc/postgresql -name pg_hba.conf | head -1)
sudo sed -i 's/local   all             all                                     peer/local   all             all                                     md5/' "$PG_HBA_FILE"
sudo sed -i 's/host    all             all             127.0.0.1\/32            ident/host    all             all             127.0.0.1\/32            md5/' "$PG_HBA_FILE"

# 4. Reiniciar PostgreSQL
sudo service postgresql restart

# 5. Actualizar development.py para usar postgres
# Cambia DB_USER a 'postgres' en el archivo de configuración
```

## Verificar la conexión

### Si usas Opción A (usuario backset):
```bash
# Probar conexión sin contraseña
psql -d candas_db -c "SELECT current_user, current_database();"

# Ejecutar tu script SQL
psql -d candas_db -f ../candas_db.sql
```

### Si usas Opción B (usuario postgres):
```bash
# Probar conexión con contraseña
PGPASSWORD=host0475392 psql -h localhost -U postgres -d candas_db -c "SELECT version();"

# Ejecutar tu script SQL
PGPASSWORD=host0475392 psql -h localhost -U postgres -d candas_db -f ../candas_db.sql
```

## Probar Django

Después de configurar, prueba Django:

```bash
cd /home/backset/Projects/candas/candas_backend
source venv_candas/bin/activate
python manage.py runserver
```

## Scripts disponibles

1. **`diagnostico_postgres.sh`**: Diagnostica el estado de PostgreSQL
2. **`solucion_rapida_postgres.sh`**: Configura PostgreSQL usando tu usuario del sistema
3. **`setup_postgres.sh`**: Configura PostgreSQL usando usuario postgres con contraseña

## Recomendación

**Usa la Opción A** (usuario del sistema) porque:
- ✅ No requiere contraseña
- ✅ Más simple de configurar
- ✅ Funciona inmediatamente con autenticación "peer"
- ✅ Ya está configurado en `development.py`

