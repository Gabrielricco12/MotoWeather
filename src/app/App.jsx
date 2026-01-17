// src/app/App.jsx
import { Toaster } from 'sonner';
import { Router } from './Router';

export function App() {
  return (
    <>
      {/* Toaster centralizado no topo para mobile */}
      <Toaster 
        theme="dark" 
        position="top-center" 
        richColors 
        expand={false}
        closeButton
      />
      
      {/* Gerenciador de Rotas */}
      <Router />
    </>
  );
}