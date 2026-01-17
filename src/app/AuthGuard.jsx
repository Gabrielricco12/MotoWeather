// src/app/AuthGuard.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export function AuthGuard({ children }) {
  const { user, loading, initialize } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center text-orange-500">Carregando...</div>;

  return user ? children : null;
}