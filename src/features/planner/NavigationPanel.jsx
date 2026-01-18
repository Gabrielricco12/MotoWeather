import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, MapPin, X, Clock, Fuel, CloudRain, AlertTriangle } from 'lucide-react';

export function NavigationPanel({ mode, routeInfo, destination, rainAlert, onCalculate, onStart, onCancel }) {
  if (mode === 'explore') return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="absolute bottom-0 left-0 right-0 z-[2000] bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] overflow-hidden"
      >
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* --- ESTADO 1: LOCAL SELECIONADO --- */}
        {mode === 'destination_selected' && destination && (
          <div className="p-6 pt-2 space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="bg-red-50 p-3 rounded-full text-red-500">
                  <MapPin size={28} fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 leading-tight">
                     {destination.label.split(',')[0]}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 mt-1 max-w-[250px] truncate">
                    {destination.label}
                  </p>
                </div>
              </div>
              <button onClick={onCancel} className="bg-slate-100 p-2 rounded-full text-slate-500">
                <X size={20} />
              </button>
            </div>

            <button onClick={onCalculate} className="w-full bg-blue-600 text-white p-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <Navigation size={18} fill="currentColor" />
              Traçar Rota
            </button>
          </div>
        )}

        {/* --- ESTADO 2: PREVIEW --- */}
        {mode === 'preview' && routeInfo && (
          <div className="p-6 pt-2">
            
            {/* ALERTA DE CHUVA (Aqui está ele de volta!) */}
            {rainAlert && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-3 shadow-sm"
              >
                <div className="bg-blue-500 text-white p-2 rounded-full animate-pulse">
                  <CloudRain size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-800 uppercase tracking-wide">
                    Alerta de Chuva
                  </p>
                  <p className="text-xs font-bold text-slate-700">
                    {rainAlert.prob}% de chance em <span className="text-slate-900 font-black">{rainAlert.city}</span>
                  </p>
                </div>
              </motion.div>
            )}

            <div className="flex justify-between items-end mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">Melhor trajeto</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-4xl font-black text-slate-900">{routeInfo.duration}<span className="text-lg text-slate-500 ml-1">min</span></h2>
                  <span className="text-slate-300">•</span>
                  <p className="text-lg font-bold text-slate-500">{routeInfo.distance} km</p>
                </div>
                {routeInfo.needsFuel && (
                  <p className="text-xs font-bold text-amber-600 flex items-center gap-1 mt-2">
                    <Fuel size={14} /> Requer abastecimento
                  </p>
                )}
              </div>
              
              <button onClick={onCancel} className="mb-2 text-slate-400 font-bold text-xs uppercase hover:text-red-500">
                Cancelar
              </button>
            </div>

            <button onClick={onStart} className="w-full bg-blue-600 text-white p-4 rounded-xl font-black text-lg uppercase tracking-widest shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-transform">
              <Navigation size={22} fill="currentColor" />
              INICIAR
            </button>
          </div>
        )}

        {/* --- ESTADO 3: NAVEGANDO --- */}
        {mode === 'navigation' && (
          <div className="p-6 pt-2 flex flex-col gap-3">
             {/* Mantemos o alerta de chuva visível mesmo navegando */}
             {rainAlert && (
              <div className="bg-blue-600 text-white p-3 rounded-xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <CloudRain size={20} className="animate-bounce" />
                  <span className="text-xs font-bold uppercase">Chuva em {rainAlert.city}</span>
                </div>
                <span className="font-black text-sm">{rainAlert.prob}%</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chegada em</span>
                <span className="text-2xl font-black text-slate-900">{routeInfo?.duration} min</span>
              </div>
              
              <button onClick={onCancel} className="bg-red-50 text-red-600 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-red-100">
                <X size={18} /> Encerrar
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}