import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AddressSearch } from './AddressSearch';
import { useRouteStore } from '../../store/useRouteStore';
import polyline from '@mapbox/polyline';
import { toast } from 'sonner';
import { Navigation, MapPin, ArrowRightLeft, LocateFixed, Loader2 } from 'lucide-react';

export function SearchModal({ isOpen, setIsOpen, onRouteCalculated, userLocation }) {
  const { origin, destination, setOrigin, setDestination } = useRouteStore();

  // Função para usar a localização atual
  const handleUseCurrentLocation = () => {
    if (!userLocation) {
      toast.loading("Aguardando sinal de GPS...", { duration: 2000 });
      return;
    }

    setOrigin({
      label: "Minha Localização Atual",
      coords: { lat: userLocation[0], lng: userLocation[1] }
    });
    toast.success("Origem definida como sua localização!");
  };

  // Função para inverter origem e destino
  const handleSwap = () => {
    const tempOrigin = origin;
    setOrigin(destination);
    setDestination(tempOrigin);
  };

  const handleCalculate = async () => {
    if (!origin || !destination) {
      toast.error("Por favor, preencha origem e destino.");
      return;
    }

    const toastId = toast.loading("Calculando melhor rota...");

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.coords.lng},${origin.coords.lat};${destination.coords.lng},${destination.coords.lat}?overview=full&geometries=polyline`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes?.[0]) {
        const route = data.routes[0];
        const decoded = polyline.decode(route.geometry);
        const metrics = {
          distance: (route.distance / 1000).toFixed(1),
          duration: Math.round(route.duration / 60)
        };
        
        onRouteCalculated(decoded, metrics);
        toast.dismiss(toastId);
      } else {
        throw new Error("Rota não encontrada");
      }
    } catch (e) {
      toast.dismiss(toastId);
      toast.error("Não foi possível traçar a rota.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-end sm:items-center justify-center sm:p-6"
        >
          {/* Card Modal */}
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-white w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl shadow-slate-900/20 space-y-6"
          >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-black italic tracking-tighter text-slate-900">VAMOS RODAR?</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Defina seu trajeto</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-full text-orange-600">
                <Navigation size={24} className="fill-current" />
              </div>
            </div>

            {/* Inputs de Endereço */}
            <div className="space-y-4 relative">
              {/* Linha decorativa conectando os pontos */}
              <div className="absolute left-[1.15rem] top-10 bottom-10 w-0.5 bg-slate-100 -z-10 border-l-2 border-dotted border-slate-300" />

              {/* Input Origem */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-400 pl-2">Ponto de Partida</label>
                  
                  {/* Botão Mágico: Usar Localização Atual */}
                  <button 
                    onClick={handleUseCurrentLocation}
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-full transition-colors"
                  >
                    {userLocation ? <LocateFixed size={12} /> : <Loader2 size={12} className="animate-spin" />}
                    {userLocation ? "Usar minha localização" : "Buscando GPS..."}
                  </button>
                </div>
                
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 z-10">
                    <MapPin size={18} fill="currentColor" className="opacity-20" />
                    <div className="absolute inset-0 bg-blue-500 rounded-full w-2 h-2 top-1.5 left-1.5 animate-ping opacity-20" />
                  </div>
                  <AddressSearch 
                    onSelect={setOrigin} 
                    placeholder="De onde vamos sair?" 
                    value={origin?.label} 
                  />
                </div>
              </div>

              {/* Botão de Troca (Inverter) */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
                <button 
                  onClick={handleSwap}
                  className="bg-slate-50 hover:bg-slate-100 p-2 rounded-full border border-slate-200 text-slate-400 transition-all active:rotate-180"
                >
                  <ArrowRightLeft size={14} className="rotate-90" />
                </button>
              </div>

              {/* Input Destino */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 pl-2">Destino Final</label>
                <div className="relative">
                 
            
                  <AddressSearch 
                    onSelect={setDestination} 
                    placeholder="Para onde vamos?" 
                    value={destination?.label} 
                  />
                </div>
              </div>
            </div>

            {/* Botão de Ação */}
            <button 
              onClick={handleCalculate} 
              className="w-full bg-slate-900 text-white p-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              Traçar Rota
              <Navigation size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button 
              onClick={() => setIsOpen(false)} 
              className="w-full text-center text-[10px] font-black text-slate-300 uppercase hover:text-slate-500 transition-colors"
            >
              Cancelar e voltar ao mapa
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}