import { motion } from 'framer-motion';
import { Search, Menu, X, ArrowRight, MapPin } from 'lucide-react';
import { AddressSearch } from './AddressSearch';
import { useRouteStore } from '../../store/useRouteStore';

export function FloatingSearch({ onSelectDestination, onClear }) {
  const { destination } = useRouteStore();

  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute top-4 left-4 right-4 z-[2000] flex justify-center pointer-events-none" // pointer-events-none para deixar clicar no mapa ao redor
    >
      <div className="bg-white w-full max-w-md shadow-lg rounded-2xl p-2 flex items-center gap-2 border border-slate-100 pointer-events-auto">
        
        {/* Botão Menu (Hambúrguer) */}
        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
          <Menu size={20} />
        </button>

        {/* Input de Busca */}
        <div className="flex-1 relative">
          <AddressSearch 
            placeholder="Pesquise no MotoWeather" 
            onSelect={onSelectDestination}
            value={destination?.label}
            className="w-full bg-transparent outline-none text-slate-800 text-sm font-medium h-10 placeholder:text-slate-400"
          />
        </div>

        {/* Divisor Vertical */}
        <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>

        {/* Ações da Direita */}
        {destination ? (
          <button 
            onClick={onClear}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        ) : (
          <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-white transition-colors shadow-blue-200 shadow-md">
            <Search size={18} />
          </button>
        )}
      </div>
    </motion.div>
  );
}