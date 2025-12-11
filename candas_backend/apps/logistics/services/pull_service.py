from io import BytesIO
import barcode
from barcode.writer import ImageWriter
from django.core.files.base import ContentFile
from django.db import transaction
from apps.logistics.models import Pull
import uuid


class PullService:
    """Servicio para operaciones de negocio sobre Pull"""
    
    @staticmethod
    def generate_barcode_image(pull, pull_number=None, total_pulls=None):
        """
        Genera imagen de código de barras para un Pull con información adicional.
        
        Args:
            pull (Pull): Instancia del Pull
            pull_number (int): Número de saca en el lote (ej: 1, 2, 3)
            total_pulls (int): Total de sacas en el lote (ej: 3)
            
        Returns:
            bytes: Contenido de la imagen PNG
        """
        from PIL import Image, ImageDraw, ImageFont
        
        # Generar código de barras
        barcode_format = barcode.get_barcode_class('code128')
        barcode_string = str(pull.id).replace('-', '')[:20]
        barcode_instance = barcode_format(barcode_string, writer=ImageWriter())
        
        # Crear código de barras base
        buffer = BytesIO()
        barcode_instance.write(buffer)
        buffer.seek(0)
        
        # Si no hay información adicional, retornar código básico
        if pull_number is None or total_pulls is None:
            return buffer.read()
        
        # Cargar imagen del código de barras
        barcode_img = Image.open(buffer)
        
        # Crear nueva imagen con espacio para texto adicional
        new_height = barcode_img.height + 80
        new_img = Image.new('RGB', (barcode_img.width, new_height), 'white')
        
        # Pegar código de barras
        new_img.paste(barcode_img, (0, 40))
        
        # Preparar texto
        draw = ImageDraw.Draw(new_img)
        try:
            font_large = ImageFont.truetype("arial.ttf", 24)
            font_small = ImageFont.truetype("arial.ttf", 16)
        except:
            font_large = ImageFont.load_default()
            font_small = ImageFont.load_default()
        
        # Obtener número de paquetes
        num_packages = pull.packages.count()
        
        # Texto superior: Número de saca
        pull_text = f"SACA {pull_number}/{total_pulls}"
        bbox = draw.textbbox((0, 0), pull_text, font=font_large)
        text_width = bbox[2] - bbox[0]
        x_position = (new_img.width - text_width) // 2
        draw.text((x_position, 10), pull_text, fill='black', font=font_large)
        
        # Texto inferior: Número de paquetes
        packages_text = f"Paquetes: {num_packages}"
        bbox = draw.textbbox((0, 0), packages_text, font=font_small)
        text_width = bbox[2] - bbox[0]
        x_position = (new_img.width - text_width) // 2
        draw.text((x_position, new_height - 25), packages_text, fill='black', font=font_small)
        
        # Guardar imagen final
        final_buffer = BytesIO()
        new_img.save(final_buffer, format='PNG')
        final_buffer.seek(0)
        return final_buffer.read()
    
    @staticmethod
    def create_barcode(pull, pull_number=None, total_pulls=None):
        """
        Crea y guarda el código de barras de un Pull con información adicional.
        
        Args:
            pull (Pull): Instancia del Pull
            pull_number (int): Número de saca en el lote (opcional)
            total_pulls (int): Total de sacas en el lote (opcional)
        """
        image_content = PullService.generate_barcode_image(pull, pull_number, total_pulls)
        filename = f"pull_{pull.id}.png"
        pull.barcode_image.save(filename, ContentFile(image_content), save=False)
    
    @staticmethod
    @transaction.atomic
    def create_pull(common_destiny, size, package_ids=None):
        """
        Crea un nuevo Pull con validaciones.
        
        Args:
            common_destiny (str): Destino común
            size (str): Tamaño del pull
            package_ids (list): IDs de paquetes a asociar (pueden ser strings o UUIDs)
            
        Returns:
            Pull: Nuevo Pull creado
        """
        pull = Pull.objects.create(
            common_destiny=common_destiny,
            size=size
        )
        
        # Asociar paquetes si se proporciona
        if package_ids:
            from apps.packages.models import Package
            
            print(f"DEBUG PullService - package_ids recibidos: {package_ids}")
            print(f"DEBUG PullService - tipo de package_ids: {type(package_ids)}")
            
            # Buscar paquetes por ID (UUID) o por guide_number
            found_packages = []
            uuid_list = []
            guide_number_list = []
            
            for pkg_identifier in package_ids:
                if not pkg_identifier or not str(pkg_identifier).strip():
                    continue
                
                pkg_identifier = str(pkg_identifier).strip()
                
                # Intentar como UUID primero
                try:
                    pkg_uuid = uuid.UUID(pkg_identifier)
                    uuid_list.append(pkg_uuid)
                    print(f"DEBUG PullService - Identificado como UUID: {pkg_uuid}")
                except (ValueError, AttributeError):
                    # Si no es UUID, tratar como guide_number
                    guide_number_list.append(pkg_identifier)
                    print(f"DEBUG PullService - Identificado como guide_number: {pkg_identifier}")
            
            # Buscar paquetes por UUID
            if uuid_list:
                packages_by_uuid = Package.objects.filter(id__in=uuid_list)
                found_packages.extend(list(packages_by_uuid))
                print(f"DEBUG PullService - Paquetes encontrados por UUID: {packages_by_uuid.count()}")
            
            # Buscar paquetes por guide_number
            if guide_number_list:
                packages_by_guide = Package.objects.filter(guide_number__in=guide_number_list)
                found_packages.extend(list(packages_by_guide))
                print(f"DEBUG PullService - Paquetes encontrados por guide_number: {packages_by_guide.count()}")
            
            # Eliminar duplicados (por si un paquete se encontró por ambos métodos)
            unique_packages = {}
            for pkg in found_packages:
                unique_packages[pkg.id] = pkg
            
            all_packages = list(unique_packages.values())
            print(f"DEBUG PullService - Total paquetes únicos encontrados: {len(all_packages)}")
            
            if len(all_packages) == 0:
                print(f"DEBUG PullService - ERROR: No se encontraron paquetes")
                print(f"DEBUG PullService - UUIDs buscados: {uuid_list}")
                print(f"DEBUG PullService - guide_numbers buscados: {guide_number_list}")
            else:
                # Verificar estado de cada paquete
                for pkg in all_packages:
                    print(f"DEBUG PullService - Paquete {pkg.id} (guide: {pkg.guide_number}): status={pkg.status}, pull={pkg.pull_id}")
                
                # Filtrar solo paquetes sin pull asignado (más flexible)
                packages_to_assign = [pkg for pkg in all_packages if pkg.pull is None]
                print(f"DEBUG PullService - Paquetes sin pull asignado: {len(packages_to_assign)}")
                
                # Si hay paquetes sin pull, asignarlos
                if packages_to_assign:
                    # Asignar pull a cada paquete individualmente
                    assigned_count = 0
                    for pkg in packages_to_assign:
                        pkg.pull = pull
                        pkg.save(update_fields=['pull', 'updated_at'])
                        assigned_count += 1
                        print(f"DEBUG PullService - ✓ Paquete {pkg.id} (guide: {pkg.guide_number}) asignado a pull {pull.id}")
                    
                    # Verificar que se guardaron correctamente
                    pull.refresh_from_db()
                    final_count = pull.packages.count()
                    print(f"DEBUG PullService - ✓ Total paquetes asignados: {assigned_count}")
                    print(f"DEBUG PullService - ✓ Paquetes en pull (verificación): {final_count}")
                else:
                    # Verificar si los paquetes ya tienen pull asignado
                    packages_with_pull = [pkg for pkg in all_packages if pkg.pull is not None]
                    if packages_with_pull:
                        print(f"DEBUG PullService - WARNING: {len(packages_with_pull)} paquetes ya tienen pull asignado")
                        for pkg in packages_with_pull:
                            print(f"DEBUG PullService - Paquete {pkg.id} (guide: {pkg.guide_number}) ya tiene pull {pkg.pull_id}")
                    else:
                        print("DEBUG PullService - ERROR: No se pudo determinar el estado de los paquetes")
        
        return pull
    
    @staticmethod
    def update_status(pull, new_status):
        """
        Actualiza el estado de un Pull.
        
        Args:
            pull (Pull): Instancia del Pull
            new_status (str): Nuevo estado
            
        Returns:
            Pull: Pull actualizado
            
        Raises:
            ValueError: Si el estado no es válido
        """
        valid_statuses = [choice[0] for choice in Pull.STATUS_CHOICES]
        if new_status not in valid_statuses:
            raise ValueError(f"Estado inválido: {new_status}")
        
        pull.status = new_status
        pull.save(update_fields=['status', 'updated_at'])
        return pull
    
    @staticmethod
    @transaction.atomic
    def complete_pull(pull):
        """
        Marca un Pull como completado y actualiza estado de paquetes.
        
        Args:
            pull (Pull): Instancia del Pull
            
        Returns:
            Pull: Pull actualizado
        """
        from apps.packages.models import Package
        
        pull.status = 'COMPLETADO'
        pull.save(update_fields=['status', 'updated_at'])
        
        # Actualizar paquetes asociados
        pull.packages.all().update(status='ENTREGADO')
        
        return pull
    
    @staticmethod
    def get_pull_statistics(pull):
        """
        Obtiene estadísticas de un Pull.
        
        Args:
            pull (Pull): Instancia del Pull
            
        Returns:
            dict: Estadísticas del Pull
        """
        packages = pull.packages.all()
        
        return {
            'total_packages': packages.count(),
            'delivered': packages.filter(status='ENTREGADO').count(),
            'in_transit': packages.filter(status='EN_TRANSITO').count(),
            'pending': packages.filter(status='RECIBIDO').count(),
            'retained': packages.filter(status='RETENIDO').count(),
            'returned': packages.filter(status='DEVUELTO').count(),
        }
