import { useState, useEffect } from 'react';
// CORREÇÃO: Importando do subpacote maplibre
import { Marker } from 'react-map-gl/maplibre'; 
import { toast } from 'sonner';
import { Fuel } from 'lucide-react';

export function AutonomyManager({ geometry, distanceKm, profile, onStationSelect }) {
  const [stations, setStations] = useState([]);

  useEffect(() => {
    if (!geometry || geometry.length === 0 || !profile) return;
    const autonomy = profile.tank_capacity_l * profile.fuel_consumption_km_l;
    
    if (distanceKm > autonomy) {
      const targetKm = autonomy * 0.8;
      const index = Math.floor((targetKm / distanceKm) * geometry.length);
      const searchPoint = geometry[index] || geometry[Math.floor(geometry.length / 2)];

      const fetchStations = async () => {
        try {
          const query = `[out:json];node["amenity"="fuel"](around:15000, ${searchPoint[0]}, ${searchPoint[1]});out body;`;
          const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
          const data = await res.json();
          setStations(data.elements.slice(0, 5));
          toast.info("Sugestão de postos carregada.");
        } catch (e) { console.error("Erro Overpass:", e); }
      };
      fetchStations();
    } else { setStations([]); }
  }, [geometry, distanceKm, profile]);

  return stations.map((s) => (
    <Marker 
      key={s.id} latitude={s.lat} longitude={s.lon} anchor="bottom"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onStationSelect(s);
        toast.success(`Parada: ${s.tags.name || "Posto"}`);
      }}
    >
      <div className="group relative flex flex-col items-center cursor-pointer hover:z-50">
        <div className="bg-white p-1.5 rounded-full shadow-lg border-2 border-orange-500 hover:bg-orange-50 hover:scale-110 transition-all">
          <Fuel size={16} className="text-orange-600" />
        </div>
        <div className="absolute bottom-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap pointer-events-none">
            {s.tags.name || "Posto"}
        </div>
      </div>
    </Marker>
  ));
}