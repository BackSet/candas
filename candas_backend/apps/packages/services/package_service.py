from django.utils import timezone
from django.db import transaction
from apps.packages.models import Package


class PackageService:
    """Servicio para operaciones de negocio sobre Package"""
    
    @staticmethod
    def change_guide_number(package, new_guide_number):
        """
        Cambia el número de guía y registra en historial.
        
        Args:
            package (Package): Instancia del paquete
            new_guide_number (str): Nuevo número de guía
            
        Returns:
            Package: Paquete actualizado
            
        Raises:
            ValueError: Si el nuevo número ya existe
        """
        if Package.objects.filter(guide_number=new_guide_number).exclude(pk=package.pk).exists():
            raise ValueError(f"El número de guía {new_guide_number} ya existe.")
        
        old_guide = package.guide_number
        package.guide_number = new_guide_number
        
        timestamp = timezone.now().strftime('%Y-%m-%d %H:%M:%S')
        history_entry = f"[{timestamp}] Guía anterior: {old_guide}\n"
        package.guide_history = history_entry + package.guide_history
        
        package.save(update_fields=['guide_number', 'guide_history', 'updated_at'])
        return package
    
    @staticmethod
    def assign_to_agency(package, agency):
        """
        Asigna paquete a agencia de transporte.
        
        Args:
            package (Package): Instancia del paquete
            agency (TransportAgency): Agencia a asignar
            
        Returns:
            Package: Paquete actualizado
        """
        package.transport_agency = agency
        package.save(update_fields=['transport_agency', 'updated_at'])
        return package
    
    @staticmethod
    def unassign_from_agency(package):
        """
        Desasigna paquete de agencia de transporte.
        
        Args:
            package (Package): Instancia del paquete
            
        Returns:
            Package: Paquete actualizado
        """
        package.transport_agency = None
        package.save(update_fields=['transport_agency', 'updated_at'])
        return package
    
    @staticmethod
    def update_status(package, new_status):
        """
        Actualiza el estado del paquete.
        
        Args:
            package (Package): Instancia del paquete
            new_status (str): Nuevo estado (debe estar en STATUS_CHOICES)
            
        Returns:
            Package: Paquete actualizado
            
        Raises:
            ValueError: Si el estado no es válido
        """
        valid_statuses = [choice[0] for choice in Package.STATUS_CHOICES]
        if new_status not in valid_statuses:
            raise ValueError(f"Estado inválido: {new_status}. Válidos: {valid_statuses}")
        
        old_status = package.status
        package.status = new_status
        package.save(update_fields=['status', 'updated_at'])
        
        # Si cambió a EN_TRANSITO, generar mensaje de WhatsApp
        if new_status == 'EN_TRANSITO' and old_status != 'EN_TRANSITO':
            from .notification_service import NotificationService
            NotificationService.generate_transit_whatsapp_message(package)
        
        return package
    
    @staticmethod
    def generate_transit_whatsapp_message(package):
        """
        Genera un mensaje formateado para WhatsApp cuando el paquete está en tránsito.
        Usa los métodos get_shipping_*() para obtener datos efectivos de la jerarquía.
        
        Args:
            package (Package): Instancia del paquete
            
        Returns:
            str: Mensaje formateado para WhatsApp
        """
        # Usar métodos efectivos para obtener agencia y guía
        effective_agency = package.get_shipping_agency()
        effective_guide = package.get_shipping_guide_number()
        
        agency_name = effective_agency.name if effective_agency else "Sin agencia asignada"
        guide_number = effective_guide if effective_guide else "Sin número de guía"
        is_in_pull = package.pull is not None
        is_in_batch = package.get_batch() is not None
        
        # Línea de tránsito con especificación de saca/lote
        if is_in_batch:
            transit_line = f"Tu *LOTE* con destino a {package.city} ya está en tránsito y tu paquete viaja en él."
        elif is_in_pull:
            transit_line = f"Tu *SACA* con destino a {package.city} ya está en tránsito y tu paquete viaja en ella."
        else:
            transit_line = f"Tu paquete con número de guía *{package.guide_number}* ya está en tránsito hacia {package.city}."
        
        # Generar mensaje base
        message = f"""🚚 *Tu paquete está en camino*

Hola {package.name},

{transit_line}

📦 *Detalles del envío:*
• Tu número de guía: {package.guide_number}
• Agencia: {agency_name}
• Número de guía de transporte: {guide_number}
• Destino: {package.address}, {package.city}, {package.province}"""
        
        # Agregar línea de manifiesto si está en saca o lote
        if is_in_pull:
            message += f"\n• Se adjuntará el manifiesto de la saca para tu seguimiento"
        if is_in_batch:
            message += f"\n• El paquete viaja en un lote consolidado"
        
        message += """

Pronto recibirás tu pedido. ¡Gracias por tu paciencia!

_Este es un mensaje automático. Para más información, contáctanos._"""
        
        return message
    
    @staticmethod
    def add_note(package, note):
        """
        Añade una nota al paquete.
        
        Args:
            package (Package): Instancia del paquete
            note (str): Nota a añadir
            
        Returns:
            Package: Paquete actualizado
        """
        timestamp = timezone.now().strftime('%Y-%m-%d %H:%M:%S')
        note_entry = f"[{timestamp}] {note}\n"
        package.notes = note_entry + package.notes
        package.save(update_fields=['notes', 'updated_at'])
        return package

    @staticmethod
    def get_note_flags(notes: str):
        """Detecta patrones en notas y devuelve lista de flags normalizados.
        Patrones soportados: frágil, mañanas, portería, urgente, no llamar, contraentrega, sábado, domingo.
        """
        if not notes:
            return []
        text = notes.lower()
        flags = []
        patterns = {
            'frágil': ['fragil', 'frágil'],
            'mañanas': ['manana', 'mañana', 'mañanas'],
            'portería': ['porteria', 'portería'],
            'urgente': ['urgente'],
            'no llamar': ['no llamar', 'no llamar al'],
            'contraentrega': ['contraentrega', 'contra entrega'],
            'sábado': ['sabado', 'sábado'],
            'domingo': ['domingo'],
        }
        for label, keys in patterns.items():
            if any(k in text for k in keys):
                flags.append(label)
        return flags
    
    @staticmethod
    @transaction.atomic
    def create_package(nro_master, guide_number, name, address, city, province, 
                      phone_number, status='NO_RECEPTADO', 
                      pull=None, transport_agency=None, delivery_agency=None, parent=None, notes='',
                      agency_guide_number='', hashtags=''):
        """
        Crea un nuevo paquete con validaciones.
        
        Args:
            nro_master (str): Número maestro (único)
            guide_number (str): Número de guía (único)
            name (str): Nombre del destinatario
            address (str): Dirección
            city (str): Ciudad
            province (str): Provincia
            phone_number (str): Teléfono
            status (str): Estado inicial
            shipping_type (str): Tipo de envío
            pull (Pull): Pull opcional
            transport_agency (TransportAgency): Agencia de transporte opcional
            delivery_agency (DeliveryAgency): Agencia de reparto opcional
            parent (Package): Paquete padre opcional
            notes (str): Notas iniciales
            agency_guide_number (str): Número de guía de la agencia
            hashtags (str): Hashtags separados por espacios
            
        Returns:
            Package: Nuevo paquete creado
            
        Raises:
            ValueError: Si guide_number ya existe
        """
        if Package.objects.filter(guide_number=guide_number).exists():
            raise ValueError(f"guide_number {guide_number} ya existe.")
        
        package = Package.objects.create(
            nro_master=nro_master,
            guide_number=guide_number,
            name=name,
            address=address,
            city=city,
            province=province,
            phone_number=phone_number,
            status=status,
            pull=pull,
            transport_agency=transport_agency,
            delivery_agency=delivery_agency,
            parent=parent,
            notes=notes,
            agency_guide_number=agency_guide_number,
            hashtags=hashtags
        )
        return package
    
    @staticmethod
    @transaction.atomic
    def bulk_assign_to_agency(package_ids, agency):
        """
        Asigna múltiples paquetes a una agencia.
        
        Args:
            package_ids (list): Lista de IDs de paquetes
            agency (TransportAgency): Agencia a asignar
            
        Returns:
            int: Cantidad de paquetes actualizados
        """
        count = Package.objects.filter(id__in=package_ids).update(transport_agency=agency)
        return count
    
    @staticmethod
    @transaction.atomic
    def bulk_update_status(package_ids, new_status):
        """
        Actualiza el estado de múltiples paquetes.
        
        Args:
            package_ids (list): Lista de IDs de paquetes
            new_status (str): Nuevo estado
            
        Returns:
            int: Cantidad de paquetes actualizados
            
        Raises:
            ValueError: Si el estado no es válido
        """
        valid_statuses = [choice[0] for choice in Package.STATUS_CHOICES]
        if new_status not in valid_statuses:
            raise ValueError(f"Estado inválido: {new_status}")
        
        count = Package.objects.filter(id__in=package_ids).update(status=new_status)
        return count
    
    @staticmethod
    def get_package_tree(parent_package):
        """
        Obtiene el árbol de paquetes hijos.
        
        Args:
            parent_package (Package): Paquete padre
            
        Returns:
            QuerySet: Todos los paquetes descendientes
        """
        children = parent_package.children.all()
        all_descendants = list(children)
        
        for child in children:
            all_descendants.extend(PackageService.get_package_tree(child))
        
        return all_descendants
    
    @staticmethod
    def merge_child_packages(parent_package, child_ids):
        """
        Relaciona paquetes como hijos de un paquete padre.
        
        Args:
            parent_package (Package): Paquete padre
            child_ids (list): Lista de IDs de paquetes hijo
            
        Returns:
            int: Cantidad de paquetes actualizados
        """
        count = Package.objects.filter(id__in=child_ids).update(parent=parent_package)
        return count


