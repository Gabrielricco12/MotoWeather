// src/App.jsx
import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Router } from './Router';
import { Toaster } from 'sonner';

export function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <Toaster richColors position="top-center" />
      <Router />
    </>
  );
}