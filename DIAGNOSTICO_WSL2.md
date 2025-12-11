# Diagnóstico de Configuración WSL2

## Estado Actual de la Configuración

### Información del Sistema
- **Distribución**: Debian
- **Versión WSL**: 2
- **Kernel**: Linux 6.6.87.2-microsoft-standard-WSL2
- **systemd**: Habilitado (`systemd=true`)

### Configuración de Red

#### Interfaces de Red
- **Loopback (lo)**: `127.0.0.1/8` ✓
- **Ethernet (eth0)**: `172.21.190.130/20` ✓
- **Gateway**: `172.21.176.1` (IP del host Windows)

#### Conectividad
- ✅ **Internet**: Funcional (ping a 8.8.8.8 exitoso)
- ⚠️ **Gateway**: No responde a ping (normal en WSL2)
- ✅ **DNS**: Configurado (`10.255.255.254`)

### Configuración de Archivos

#### `/etc/wsl.conf`
```ini
[boot]
systemd=true
```

#### `/etc/resolv.conf`
```
nameserver 10.255.255.254
```

### Configuración del Proyecto

#### Backend (Django)
- **ALLOWED_HOSTS**: `['localhost', '127.0.0.1', '0.0.0.0']` ✓
- **Puerto**: 8000
- **Estado**: No está corriendo actualmente

#### Frontend (Vite)
- **Host**: `localhost` ✓
- **Puerto**: 3000
- **Proxy**: Configurado para `http://localhost:8000` ✓
- **Estado**: No está corriendo actualmente

## Problemas Identificados

### 1. Servidores No Están Corriendo
Los puertos 3000 y 8000 no están en escucha actualmente.

**Solución**: Iniciar los servidores:
```bash
# Terminal 1 - Backend
cd candas_backend
python manage.py runserver

# Terminal 2 - Frontend
cd candas_frontend
npm run dev
```

### 2. Posible Problema con localhost en WSL2
En algunas configuraciones de WSL2, `localhost` puede tener problemas. 

**Verificación**:
```bash
# Verificar que localhost resuelve correctamente
ping -c 1 localhost
hostname -I
```

### 3. Configuración de Firewall de Windows
El firewall de Windows podría estar bloqueando conexiones desde el navegador hacia WSL2.

**Solución**: Verificar en Windows PowerShell (como administrador):
```powershell
# Ver reglas de firewall
netsh advfirewall firewall show rule name=all | findstr "3000\|8000"
```

## Recomendaciones

### 1. Verificar que los Servidores Estén Corriendo
```bash
# Verificar puertos en uso
ss -tuln | grep -E ":(3000|8000)"
```

### 2. Probar Conectividad Local
```bash
# Probar backend
curl http://localhost:8000/api/

# Probar frontend
curl http://localhost:3000
```

### 3. Verificar en el Navegador
- Usar exactamente: `http://localhost:3000`
- No usar: `http://127.0.0.1:3000` (aunque debería funcionar)
- Limpiar caché del navegador (Ctrl+Shift+Delete)
- Probar en ventana de incógnito

### 4. Ver Logs de los Servidores
Revisar los logs en las terminales donde corren los servidores para ver errores específicos.

### 5. Configuración Adicional de WSL2 (Opcional)

Si persisten problemas, puedes agregar a `/etc/wsl.conf`:

```ini
[boot]
systemd=true

[network]
generateHosts = true
generateResolvConf = true
```

Luego reiniciar WSL2 desde Windows PowerShell:
```powershell
wsl --shutdown
wsl
```

## Comandos Útiles para Diagnóstico

```bash
# Ver configuración de red
ip addr show
ip route show

# Ver puertos en escucha
ss -tuln | grep -E ":(3000|8000)"

# Probar conectividad
curl -v http://localhost:8000/api/
curl -v http://localhost:3000

# Ver procesos corriendo
ps aux | grep -E "(runserver|vite)"

# Ver configuración WSL
cat /etc/wsl.conf
cat /etc/resolv.conf
```

## Próximos Pasos

1. ✅ Verificar que los servidores estén corriendo
2. ✅ Probar con `curl` desde WSL2
3. ✅ Limpiar caché del navegador
4. ✅ Verificar logs de errores en consola del navegador (F12)
5. ✅ Probar en ventana de incógnito

