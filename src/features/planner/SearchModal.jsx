import { motion, AnimatePresence } from 'framer-motion';
import { AddressSearch } from './AddressSearch'; // Certifique-se que o caminho está certo
import { useRouteStore } from '../../store/useRouteStore';
import polyline from '@mapbox/polyline';
import { toast } from 'sonner';

export function SearchModal({ isOpen, setIsOpen, onRouteCalculated }) {
  const { origin, destination, setOrigin, setDestination } = useRouteStore();

  const handleCalculate = async () => {
    if (!origin || !destination) {
      toast.error("Selecione origem e destino.");
      return;
    }

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
      }
    } catch (e) {
      toast.error("Erro ao calcular rota.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-[2000] flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl space-y-6"
          >
            <h2 className="text-3xl font-black italic tracking-tighter text-center">PLANEJAR</h2>
            <div className="space-y-4">
              <AddressSearch onSelect={setOrigin} placeholder="Ponto de Partida" value={origin?.label} />
              <AddressSearch onSelect={setDestination} placeholder="Destino Final" value={destination?.label} />
              <button 
                onClick={handleCalculate} 
                className="w-full bg-slate-900 text-white p-5 rounded-[2rem] font-black shadow-lg uppercase text-xs tracking-widest active:scale-95 transition-all"
              >
                Traçar Rota
              </button>
            </div>
            
            {/* Botão para fechar se já houver rota */}
            <button onClick={() => setIsOpen(false)} className="w-full text-center text-xs font-bold text-slate-400 uppercase">
              Cancelar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}