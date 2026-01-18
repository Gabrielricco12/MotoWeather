import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Planner } from './pages/Planner';

// Se você tiver outras páginas (Login, Perfil), importe-as aqui também.
// Ex: import { Login } from './pages/Login';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Rota principal do Planner (Mapa 3D) */}
        <Route path="/planner" element={<Planner />} />

        {/* Redireciona a raiz "/" para o planner por enquanto, 
            ou mude para sua página de Login se preferir */}
        <Route path="/" element={<Navigate to="/planner" replace />} />
        
        {/* Rota coringa para erros 404 */}
        <Route path="*" element={<Navigate to="/planner" replace />} />
      </Routes>
    </Router>
  );
}