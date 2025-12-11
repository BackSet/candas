import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

# Leer el archivo SQL
with open('create_batch_table.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

# Ejecutar el SQL
with connection.cursor() as cursor:
    cursor.execute(sql)
    result = cursor.fetchone()
    if result:
        print(result[0])
    
print("✓ Tabla dispatch_batch creada correctamente")
