import { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Flag, Navigation, Plus, X, Search, GripHorizontal } from 'lucide-react';
import { useRouteStore } from '../store/useRouteStore';
import { AddressSearch } from '../features/planner/AddressSearch';
import { toast } from 'sonner';

export function Planner() {
  const { origin, destination, setOrigin, setDestination } = useRouteStore();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const constraintsRef = useRef(null); // Referência para limitar o arrasto à tela

  const handleStart = () => {
    if (!origin || !destination) {
      toast.error("Defina origem e destino!");
      return;
    }
    toast.success("Rota iniciada! Boa viagem 🏍️");
    setIsModalOpen(false);
  };

  return (
    <div ref={constraintsRef} className="relative h-full w-full bg-slate-100 overflow-hidden">
      
      {/* MAPA */}
      <MapContainer center={[-23.5505, -46.6333]} zoom={12} zoomControl={false} className="h-full w-full z-0">
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        {origin && <Marker position={[origin.coords.lat, origin.coords.lng]} />}
        {destination && <Marker position={[destination.coords.lat, destination.coords.lng]} />}
      </MapContainer>

      {/* FAB (Botão de abrir) */}
      <AnimatePresence>
        {!isModalOpen && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            onClick={() => setIsModalOpen(true)}
            className="absolute bottom-6 right-6 w-16 h-16 bg-orange-600 text-white rounded-2xl shadow-2xl z-[1001] flex items-center justify-center shadow-orange-500/40"
          >
            <Plus size={32} strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* MODAL DRAGGABLE */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            dragMomentum={false}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="absolute top-10 left-10 right-10 md:left-auto md:right-10 md:w-80 z-[1002] cursor-grab active:cursor-grabbing"
          >
            <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white p-5 space-y-4">
              
              {/* Handle de Arrasto Visual */}
              <div className="flex flex-col items-center gap-1 mb-2">
                <GripHorizontal className="text-slate-300" size={24} />
                <div className="flex w-full justify-between items-center">
                  <h3 className="font-black text-lg tracking-tighter flex items-center gap-2">
                    <Search size={18} className="text-orange-600" />
                    Destino
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-500">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Inputs Brancos */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Partida</label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-1 rounded-xl">
                    <MapPin size={16} className="ml-2 text-slate-400" />
                    <AddressSearch onSelect={setOrigin} placeholder="Minha localização" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Chegada</label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-1 rounded-xl">
                    <Flag size={16} className="ml-2 text-orange-600" />
                    <AddressSearch onSelect={setDestination} placeholder="Para onde?" />
                  </div>
                </div>

                <button
                  onClick={handleStart}
                  className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Navigation size={20} fill="white" />
                  INICIAR ROTA
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}