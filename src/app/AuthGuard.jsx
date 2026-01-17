// src/app/AuthGuard.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export function AuthGuard({ children }) {
  const { user, loading, initialize } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    initialize(); // Verifica se existe sessão no Supabase
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-50 flex flex-col items-center justify-center">
        <div className="text-orange-600 animate-bounce font-black text-2xl tracking-tighter">
          MOTO<span className="text-slate-900">WEATHER</span>
        </div>
      </div>
    );
  }

  return user ? children : null;
}
