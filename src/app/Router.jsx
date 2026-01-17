import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { AuthGuard } from './AuthGuard';
import { Dashboard } from '../pages/Dashboard';
import { Planner } from '../pages/Planner';
import { Auth } from '../pages/Auth';
import { useAuthStore } from '../store/useAuthStore';

export function Router() {
  const { user, loading } = useAuthStore();

  // Enquanto estiver carregando a sessão inicial do Supabase, 
  // evitamos renderizar qualquer rota para não dar "flash" de tela errada.
  if (loading) {
    return (
      <div className="h-screen w-full bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
          <p className="font-black text-slate-400 text-xs tracking-widest uppercase">Carregando Piloto...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rota de Login: Se já estiver logado e tentar acessar /login, manda para a Home */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Auth />} 
        />

        {/* Rotas Protegidas: Todas dentro do AppShell com AuthGuard */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="planner" element={<Planner />} />
          
          {/* Adicione aqui a rota de perfil quando ela estiver pronta */}
          <Route path="profile" element={<div className="p-8 font-bold">Configurações da Moto em breve...</div>} />
        </Route>

        {/* Fallback: Qualquer rota inexistente manda para o Dashboard (que o AuthGuard protegerá) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}