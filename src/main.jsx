import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// --- ESTILOS DE MAPA ---
// Removemos o estilo antigo do Leaflet
// import 'leaflet/dist/leaflet.css'; 

// Adicionamos o estilo do novo motor 3D (MapLibre)
import 'maplibre-gl/dist/maplibre-gl.css';

// Componente de notificações (Toasts)
import { Toaster } from 'sonner';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    
    {/* Renderiza as notificações no topo da tela, visível em qualquer página */}
    <Toaster 
      position="top-center" 
      richColors 
      toastOptions={{
        style: {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1.5rem',
          padding: '1rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }
      }}
    />
  </React.StrictMode>,
)