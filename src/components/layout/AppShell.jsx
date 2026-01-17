import { Outlet, NavLink } from 'react-router-dom';
import { Home, Map, User, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export function AppShell() {
  const navItems = [
    { icon: <Home size={24} />, label: 'Início', to: '/' },
    { icon: <Map size={24} />, label: 'Planejar', to: '/planner' },
    { icon: <User size={24} />, label: 'Perfil', to: '/profile' },
    { icon: <Settings size={24} />, label: 'Ajustes', to: '/settings' },
  ];

  return (
    // h-screen e overflow-hidden impedem que o mapa estique a página inteira
    <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <header className="h-16 flex-shrink-0 flex justify-between items-center px-4 border-b-2 border-slate-100 bg-white z-[1001] shadow-sm">
        <h1 className="font-black text-xl tracking-tighter">
          MOTO<span className="text-orange-600">WEATHER</span>
        </h1>
        <div className="w-9 h-9 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-xs font-bold">GP</div>
      </header>

      {/* CONTEÚDO PRINCIPAL (MAPA OU DASHBOARD) */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>

      {/* BOTTOM NAV - Z-INDEX ALTO É ESSENCIAL AQUI */}
      <nav className="h-20 flex-shrink-0 bg-white border-t-2 border-slate-200 px-2 pb-safe z-[1001] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex justify-around items-center h-full max-w-md mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                relative flex flex-col items-center justify-center w-full h-full transition-all
                ${isActive ? 'text-orange-600' : 'text-slate-400'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className={`${isActive ? 'bg-orange-50 p-1.5 rounded-xl' : ''}`}>
                    {item.icon}
                  </div>
                  <span className={`text-[10px] mt-1 font-black uppercase tracking-tighter ${isActive ? 'block' : 'hidden'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -top-[2px] w-12 h-1 bg-orange-600 rounded-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}