import { motion } from 'framer-motion';
import { Route, Navigation, Gauge, Calendar, Fuel, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const StatCard = ({ icon: Icon, label, value, colorClass, iconColor }) => (
  <div className="bg-white p-5 rounded-[2rem] border-2 border-slate-100 shadow-sm flex flex-col justify-between">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${colorClass}`}>
      <Icon size={24} className={iconColor} strokeWidth={2.5} />
    </div>
    <div>
      <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-900 leading-none">{value}</p>
    </div>
  </div>
);

export function Dashboard() {
  const { profile } = useAuthStore();

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="p-6 space-y-6 max-w-md mx-auto"
    >
      <header className="py-2">
        <p className="text-orange-600 font-black text-xs uppercase tracking-widest mb-1">Status do Piloto</p>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
          Olá, {profile?.full_name?.split(' ')[0] || 'Piloto'}!
        </h2>
      </header>

      {/* Grid Principal de Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          icon={Gauge} 
          label="Km Rodados" 
          value="1.240" 
          colorClass="bg-blue-50" 
          iconColor="text-blue-600" 
        />
        <StatCard 
          icon={Fuel} 
          label="Autonomia" 
          value="420km" 
          colorClass="bg-orange-50" 
          iconColor="text-orange-600" 
        />
      </div>

      {/* Card de Ação Principal - Alta Visibilidade */}
      <motion.div 
        whileTap={{ scale: 0.97 }}
        className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl shadow-slate-200 flex items-center justify-between group"
      >
        <div className="space-y-1">
          <h3 className="text-white font-black text-xl">Planejar Viagem</h3>
          <p className="text-slate-400 text-xs">Previsão de chuva e postos.</p>
        </div>
        <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-900/20">
          <Navigation size={24} fill="currentColor" />
        </div>
      </motion.div>

      {/* Stats Secundários em Linha */}
      <div className="flex gap-4">
        <div className="flex-1 bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center gap-3">
          <Calendar className="text-slate-400" size={20} />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Este Mês</p>
            <p className="font-black text-slate-700">12 Rotas</p>
          </div>
        </div>
        <div className="flex-1 bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center gap-3">
          <Route className="text-slate-400" size={20} />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Moto</p>
            <p className="font-black text-slate-700">{profile?.bike_name?.split(' ')[1] || 'CB 500X'}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}