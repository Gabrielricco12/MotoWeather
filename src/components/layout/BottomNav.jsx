    // src/components/layout/BottomNav.jsx
import { NavLink } from 'react-router-dom';
import { Home, Map, Settings, User } from 'lucide-react';
import { motion } from 'framer-motion';

export function BottomNav() {
  const navItems = [
    { icon: <Home size={22} />, label: 'Início', to: '/' },
    { icon: <Map size={22} />, label: 'Planejar', to: '/planner' },
    { icon: <User size={22} />, label: 'Perfil', to: '/profile' },
    { icon: <Settings size={22} />, label: 'Ajustes', to: '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-lg border-t border-slate-800 pb-safe-area-inset-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              relative flex flex-col items-center justify-center w-full h-full transition-colors
              ${isActive ? 'text-orange-500' : 'text-slate-500'}
            `}
          >
            {({ isActive }) => (
              <>
                {item.icon}
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-[1px] w-8 h-[2px] bg-orange-500"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}