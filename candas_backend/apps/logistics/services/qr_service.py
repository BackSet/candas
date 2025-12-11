"""
Servicio para generación de códigos QR
"""
import qrcode
import json
import io
import base64
from PIL import Image


class QRService:
    """Servicio para generar códigos QR para sacas"""
    
    @staticmethod
    def generate_pull_qr(pull):
        """
        Genera código QR para una saca (solo con ID)
        
        Args:
            pull: Instancia del modelo Pull
            
        Returns:
            BytesIO con la imagen del QR
        """
        # QR solo con ID de la saca
        qr_content = str(pull.id)
        
        # Crear QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_content)
        qr.make(fit=True)
        
        # Generar imagen
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convertir a BytesIO
        img_io = io.BytesIO()
        img.save(img_io, 'PNG')
        img_io.seek(0)
        
        return img_io
    
    @staticmethod
    def generate_pull_qr_base64(pull):
        """
        Genera código QR en formato base64
        
        Args:
            pull: Instancia del modelo Pull
            
        Returns:
            String con imagen en base64
        """
        img_io = QRService.generate_pull_qr(pull)
        img_base64 = base64.b64encode(img_io.getvalue()).decode()
        return f"data:image/png;base64,{img_base64}"
    
    @staticmethod
    def generate_qr_with_size(data, size=(200, 200)):
        """
        Genera QR code con tamaño específico
        
        Args:
            data: Datos para el QR (string o dict)
            size: Tupla con (ancho, alto) en píxeles
            
        Returns:
            BytesIO con la imagen del QR
        """
        # Convertir dict a JSON si es necesario
        if isinstance(data, dict):
            qr_content = json.dumps(data, ensure_ascii=False)
        else:
            qr_content = str(data)
        
        # Crear QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=2,
        )
        qr.add_data(qr_content)
        qr.make(fit=True)
        
        # Generar imagen
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Redimensionar si es necesario
        img = img.resize(size, Image.Resampling.LANCZOS)
        
        # Convertir a BytesIO
        img_io = io.BytesIO()
        img.save(img_io, 'PNG')
        img_io.seek(0)
        
        return img_io
