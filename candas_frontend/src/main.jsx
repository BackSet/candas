import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './index.css'

// Temporalmente deshabilitado StrictMode para diagnosticar problemas de bloqueo
// TODO: Re-habilitar después de resolver el problema
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
