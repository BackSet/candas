# Instrucciones para ejecutar React + Django

## 🚀 Pasos para iniciar el proyecto

### 1. Terminal 1 - Backend Django

```bash
cd /home/backset/Downloads/candas/candas_backend
source venv_candas/bin/activate
python manage.py runserver
```

**Debe mostrar:**
```
Starting development server at http://127.0.0.1:8000/
```

### 2. Terminal 2 - Frontend React

```bash
cd /home/backset/Downloads/candas/candas_frontend
npm run dev
```

**Debe mostrar:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:3000/
```

### 3. Reiniciar Django después de cambios

Si hiciste cambios en el backend, **debes reiniciar Django**:

1. En el Terminal 1, presiona `Ctrl+C`
2. Ejecuta de nuevo: `python manage.py runserver`

### 4. Probar la aplicación

1. Abre el navegador en: **http://localhost:3000**
2. Presiona `Ctrl+Shift+R` para limpiar caché
3. Abre la consola del navegador (F12)
4. Intenta iniciar sesión

### 5. Verificar logs

**En la consola del navegador (F12) deberías ver:**
```
🌐 Request: GET /api/v1/auth/csrf/
📝 Cookies: ...
✅ Response: /api/v1/auth/csrf/ 200
🌐 Request: POST /api/v1/auth/login/
✅ Login response: {success: true, user: {...}}
```

**En el terminal de Django deberías ver:**
```
✅ Login exitoso para [usuario]
Session Key: ...
User ID en sesión: ...
"POST /api/v1/auth/login/ HTTP/1.1" 200
```

## 🐛 Solución de problemas

### Error 401 al hacer login

1. **Reinicia Django** (Ctrl+C y vuelve a ejecutar)
2. **Limpia cookies del navegador**:
   - F12 → Application → Cookies → Eliminar todas
3. **Recarga la página** (Ctrl+Shift+R)

### "npm: command not found"

Necesitas instalar Node.js:
```bash
# Debian/Ubuntu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Django no se ejecuta

Verifica que el entorno virtual esté activado:
```bash
which python
# Debe mostrar: .../candas_backend/venv_candas/bin/python
```

Si no está activado:
```bash
source venv_candas/bin/activate
```

## 📝 URLs importantes

- Frontend React: http://localhost:3000
- Backend Django: http://127.0.0.1:8000
- Admin Django: http://127.0.0.1:8000/admin
- API Docs: http://127.0.0.1:8000/api/docs/

## ✅ Checklist antes de reportar un error

- [ ] Ambos servidores están corriendo (Django y React)
- [ ] Django se reinició después de los últimos cambios
- [ ] Se limpió la caché del navegador (Ctrl+Shift+R)
- [ ] Se revisaron los logs en la consola del navegador (F12)
- [ ] Se revisaron los logs en el terminal de Django

## 🔧 Cambios realizados

1. **Configuración de cookies** en `config/settings/base.py`:
   - `SESSION_COOKIE_SAMESITE = 'Lax'`
   - `SESSION_COOKIE_HTTPONLY = False`
   - `SESSION_SAVE_EVERY_REQUEST = True`

2. **Login endpoint** mejorado con:
   - Debug logs
   - Cookie de sesión explícita
   - Mejor manejo de respuesta

3. **User endpoint** con debug logs para diagnosticar problemas

4. **Frontend** con logs en consola para seguir las peticiones
