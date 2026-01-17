// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app/App'
import './index.css'
// Importante: CSS do Leaflet para o mapa funcionar
import 'leaflet/dist/leaflet.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)