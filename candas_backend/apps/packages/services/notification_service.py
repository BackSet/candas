"""
Servicio de notificaciones - WhatsApp y otros canales
"""


class NotificationService:
    """Servicio para gestionar notificaciones (WhatsApp, Email, SMS)"""
    
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
    def format_phone_number(phone):
        """
        Formatea número de teléfono para WhatsApp.
        
        Args:
            phone (str): Número de teléfono
            
        Returns:
            str: Número formateado (solo dígitos)
        """
        import re
        # Eliminar todo excepto dígitos
        clean_phone = re.sub(r'\D', '', phone)
        return clean_phone
    
    @staticmethod
    def send_email_notification(package, subject, message):
        """
        Envía notificación por email (placeholder para implementación futura).
        
        Args:
            package (Package): Instancia del paquete
            subject (str): Asunto del email
            message (str): Contenido del mensaje
        """
        # TODO: Implementar envío de email
        pass
