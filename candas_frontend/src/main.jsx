import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './index.css'

// #region agent log
try {
  fetch('http://127.0.0.1:7242/ingest/e032b260-3761-424c-8962-a2f280305add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:9',message:'main.jsx ENTRY - before render',data:{rootExists:!!document.getElementById('root')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
} catch (e) {}
// #endregion

// Temporalmente deshabilitado StrictMode para diagnosticar problemas de bloqueo
// TODO: Re-habilitar después de resolver el problema
try {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e032b260-3761-424c-8962-a2f280305add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:12',message:'main.jsx BEFORE createRoot',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const root = ReactDOM.createRoot(document.getElementById('root'))
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e032b260-3761-424c-8962-a2f280305add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:15',message:'main.jsx AFTER createRoot - before render',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  root.render(<App />)
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e032b260-3761-424c-8962-a2f280305add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:18',message:'main.jsx AFTER render',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
} catch (error) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e032b260-3761-424c-8962-a2f280305add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:20',message:'main.jsx ERROR',data:{errorMessage:error?.message,errorStack:error?.stack?.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  console.error('Error rendering app:', error)
  document.getElementById('root').innerHTML = `
    <div style="padding: 20px; font-family: Arial;">
      <h1>Error al cargar la aplicación</h1>
      <p>${error.message}</p>
      <pre>${error.stack}</pre>
    </div>
  `
}
