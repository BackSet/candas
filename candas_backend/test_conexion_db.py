#!/usr/bin/env python
"""
Script para probar la conexión a la base de datos desde Django
"""
import os
import sys
import django

# Configurar Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    django.setup()
    
    from django.db import connection
    from django.conf import settings
    
    print("🔍 Configuración de Base de Datos:")
    print(f"   Base de datos: {settings.DATABASES['default']['NAME']}")
    print(f"   Usuario: {settings.DATABASES['default']['USER']}")
    print(f"   Host: {settings.DATABASES['default']['HOST']}")
    print(f"   Puerto: {settings.DATABASES['default']['PORT']}")
    print(f"   Contraseña: {'***' if settings.DATABASES['default']['PASSWORD'] else '(vacía)'}")
    print()
    
    print("🔌 Intentando conectar...")
    try:
        connection.ensure_connection()
        print("✅ Conexión exitosa!")
        print()
        
        # Probar una consulta simple
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"📊 Versión de PostgreSQL: {version[0][:50]}...")
            print()
            
            # Verificar base de datos actual
            cursor.execute("SELECT current_database(), current_user;")
            db_info = cursor.fetchone()
            print(f"📦 Base de datos actual: {db_info[0]}")
            print(f"👤 Usuario actual: {db_info[1]}")
            print()
            
            # Verificar tablas
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                LIMIT 10;
            """)
            tables = cursor.fetchall()
            if tables:
                print(f"📋 Tablas encontradas: {len(tables)}")
                for table in tables[:5]:
                    print(f"   - {table[0]}")
            else:
                print("📋 No hay tablas en la base de datos")
                print("   💡 Ejecuta: python manage.py migrate")
        
    except Exception as e:
        print(f"❌ Error de conexión: {type(e).__name__}")
        print(f"   Mensaje: {str(e)}")
        print()
        print("💡 Posibles soluciones:")
        print("   1. Verifica que PostgreSQL esté corriendo: sudo service postgresql status")
        print("   2. Verifica el puerto: psql -h localhost -p 5433 -U backset -d candas_db")
        print("   3. Crea la base de datos si no existe: sudo -u postgres psql -c 'CREATE DATABASE candas_db;'")
        print("   4. Verifica la configuración en config/settings/development.py")
        sys.exit(1)
        
except Exception as e:
    print(f"❌ Error al configurar Django: {e}")
    sys.exit(1)

