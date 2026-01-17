import { useState, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { toast } from 'sonner';
import L from 'leaflet';

const gasIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/483/483497.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

export function AutonomyManager({ geometry, distanceKm, profile, onStationSelect }) {
  const [stations, setStations] = useState([]);

  useEffect(() => {
    if (!geometry || geometry.length === 0 || !profile) return;

    const autonomy = profile.tank_capacity_l * profile.fuel_consumption_km_l;
    
    // Só busca postos se a rota for maior que a autonomia
    if (distanceKm > autonomy) {
      // Ponto de busca: 80% da autonomia
      const targetKm = autonomy * 0.8;
      const index = Math.floor((targetKm / distanceKm) * geometry.length);
      const searchPoint = geometry[index] || geometry[Math.floor(geometry.length / 2)];

      const fetchStations = async () => {
        try {
          const query = `[out:json];node["amenity"="fuel"](around:15000, ${searchPoint[0]}, ${searchPoint[1]});out body;`;
          const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
          const data = await res.json();
          setStations(data.elements.slice(0, 5));
          toast.info("Postos sugeridos carregados no mapa.");
        } catch (e) {
          console.error("Erro Overpass:", e);
        }
      };

      fetchStations();
    } else {
      setStations([]); // Limpa se a autonomia for suficiente
    }
  }, [geometry, distanceKm, profile]);

  return stations.map((s) => (
    <Marker key={s.id} position={[s.lat, s.lon]} icon={gasIcon}>
      <Popup>
        <div className="text-center p-1">
          <p className="font-black text-xs mb-2">{s.tags.name || "Posto sem nome"}</p>
          <button 
            onClick={() => {
              onStationSelect(s);
              toast.success(`Parada definida em: ${s.tags.name || "Posto"}`);
            }}
            className="bg-orange-600 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-lg w-full"
          >
            Abastecer Aqui
          </button>
        </div>
      </Popup>
    </Marker>
  ));
}