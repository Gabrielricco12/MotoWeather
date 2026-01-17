// src/app/Router.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Dashboard } from '../pages/Dashboard';
import { Planner } from '../pages/Planner';
import { Auth } from '../pages/Auth';

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota de Auth ainda existe se você quiser ver o design dela */}
        <Route path="/login" element={<Auth />} />

        {/* Rotas agora estão abertas diretamente no AppShell */}
        <Route path="/" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="planner" element={<Planner />} />
          <Route path="profile" element={<div className="p-8">Tela de Perfil (Dev)</div>} />
          <Route path="settings" element={<div className="p-8">Configurações (Dev)</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}