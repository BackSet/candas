"""
Management command para importar Agencias de Reparto desde Excel

Uso:
    python manage.py import_delivery_agencies ruta/al/archivo.xlsx
    python manage.py import_delivery_agencies --help
"""

from django.core.management.base import BaseCommand, CommandError
import pandas as pd
from apps.catalog.models import DeliveryAgency


class Command(BaseCommand):
    help = 'Importa Agencias de Reparto desde un archivo Excel'

    def add_arguments(self, parser):
        parser.add_argument(
            'excel_file',
            type=str,
            help='Ruta al archivo Excel con las agencias'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simula la importación sin crear registros'
        )
        parser.add_argument(
            '--update',
            action='store_true',
            help='Actualiza agencias existentes en lugar de saltarlas'
        )

    def normalize_text(self, text):
        """Normaliza texto: elimina espacios extra y convierte a mayúsculas"""
        if pd.isna(text) or text is None:
            return ''
        return str(text).strip().upper()

    def handle(self, *args, **options):
        excel_file = options['excel_file']
        dry_run = options['dry_run']
        update = options['update']

        self.stdout.write(self.style.SUCCESS('🚀 IMPORTADOR DE AGENCIAS DE REPARTO'))
        self.stdout.write('=' * 60 + '\n')

        if dry_run:
            self.stdout.write(self.style.WARNING('⚠️  MODO DRY-RUN: No se crearán registros\n'))

        try:
            # Leer Excel
            self.stdout.write(f'📂 Leyendo archivo: {excel_file}')
            df = pd.read_excel(excel_file)
            self.stdout.write(self.style.SUCCESS(f'✅ Archivo leído: {len(df)} filas encontradas\n'))

            # Verificar columnas requeridas
            required_columns = ['CIUDAD', 'NOMBRE DE LA AGENCIA']
            missing_columns = [col for col in required_columns if col not in df.columns]

            if missing_columns:
                raise CommandError(
                    f"Faltan columnas requeridas: {missing_columns}\n"
                    f"Columnas encontradas: {list(df.columns)}"
                )

            # Estadísticas
            created_count = 0
            updated_count = 0
            skipped_count = 0
            error_count = 0

            # Procesar cada fila
            for index, row in df.iterrows():
                try:
                    # Normalizar datos
                    city = self.normalize_text(row.get('CIUDAD', ''))
                    name = str(row.get('NOMBRE DE LA AGENCIA', '')).strip()
                    address = str(row.get('DIRECCIÓN', '')).strip() if 'DIRECCIÓN' in row else ''
                    phone = str(row.get('TELÉFONO', '')).strip() if 'TELÉFONO' in row else ''
                    contact = str(row.get('NOMBRE PERSONAL', '')).strip() if 'NOMBRE PERSONAL' in row else ''

                    # Validar datos mínimos
                    if not city or not name:
                        self.stdout.write(
                            self.style.WARNING(f'⚠️  Fila {index + 2}: Saltada - falta ciudad o nombre')
                        )
                        skipped_count += 1
                        continue

                    # Verificar si ya existe
                    existing = DeliveryAgency.objects.filter(
                        name__iexact=name,
                        city__iexact=city
                    ).first()

                    if existing:
                        if update and not dry_run:
                            # Actualizar
                            existing.address = address
                            existing.phone_number = phone
                            existing.contact_person = contact
                            existing.save()
                            self.stdout.write(
                                self.style.SUCCESS(f'🔄 Fila {index + 2}: Actualizada - {name} ({city})')
                            )
                            updated_count += 1
                        else:
                            self.stdout.write(f'⏭️  Fila {index + 2}: Ya existe - {name} ({city})')
                            skipped_count += 1
                        continue

                    if not dry_run:
                        # Crear agencia
                        agency = DeliveryAgency.objects.create(
                            name=name,
                            city=city,
                            address=address,
                            phone_number=phone,
                            contact_person=contact,
                            active=True,
                            notes=f'Importado desde Excel'
                        )
                        self.stdout.write(
                            self.style.SUCCESS(f'✅ Fila {index + 2}: Creada - {name} ({city})')
                        )
                    else:
                        self.stdout.write(f'✅ Fila {index + 2}: Se crearía - {name} ({city})')

                    created_count += 1

                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'❌ Fila {index + 2}: Error - {str(e)}')
                    )
                    error_count += 1
                    continue

            # Resumen
            self.stdout.write('\n' + '=' * 60)
            self.stdout.write(self.style.SUCCESS('📊 RESUMEN DE IMPORTACIÓN'))
            self.stdout.write('=' * 60)
            self.stdout.write(f'✅ Creadas:     {created_count}')
            if update:
                self.stdout.write(f'🔄 Actualizadas: {updated_count}')
            self.stdout.write(f'⏭️  Saltadas:    {skipped_count}')
            self.stdout.write(f'❌ Errores:     {error_count}')
            self.stdout.write(f'📋 Total:       {len(df)}')
            self.stdout.write('=' * 60)

            if created_count > 0:
                if not dry_run:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'\n🎉 Se importaron exitosamente {created_count} agencias de reparto'
                        )
                    )
                    self.stdout.write(f'   Puedes verlas en: /admin/catalog/deliveryagency/')
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f'\n⚠️  DRY-RUN: Se crearían {created_count} agencias (usa sin --dry-run para importar)'
                        )
                    )

        except FileNotFoundError:
            raise CommandError(f'Archivo no encontrado: {excel_file}')
        except Exception as e:
            raise CommandError(f'Error al procesar archivo: {str(e)}')
