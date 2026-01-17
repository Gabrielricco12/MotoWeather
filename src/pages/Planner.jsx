import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import polyline from '@mapbox/polyline';
import { useRouteStore } from '../store/useRouteStore';
import { useAuthStore } from '../store/useAuthStore';
import { AddressSearch } from '../features/planner/AddressSearch';
import { Fuel, CloudRain, Sun, Cloud, CloudLightning, CheckCircle2, AlertTriangle, Droplets, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import L from 'leaflet';

// Ícones personalizados
const gasIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/483/483497.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

// Função auxiliar para descobrir o nome da cidade baseado na coordenada (Reverse Geocoding)
const fetchLocationName = async (lat, lng) => {
  try {
    // Usando Photon para geocodificação reversa (rápido e gratuito)
    const res = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
        const props = data.features[0].properties;
        // Tenta pegar o nome mais relevante (cidade, vila, ou bairro)
        return props.city || props.town || props.village || props.name || "Local na rota";
    }
  } catch (error) {
    console.error("Erro ao buscar nome do local", error);
  }
  return "Ponto na estrada";
};

// Componente para focar o mapa
function RouteFocus({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords?.length > 0) map.fitBounds(coords, { padding: [60, 60] });
  }, [coords, map]);
  return null;
}

export function Planner() {
  const { origin, destination, setOrigin, setDestination } = useRouteStore();
  const { profile } = useAuthStore();
  
  const [routeInfo, setRouteInfo] = useState(null);
  const [geometry, setGeometry] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [gasStations, setGasStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [weatherPoints, setWeatherPoints] = useState([]);
  const [criticalRainPoint, setCriticalRainPoint] = useState(null); // Novo estado para o ponto principal de chuva

  // Lógica de Clima Avançada
  const fetchWeatherOnRoute = async (coords) => {
    // Aumentei para 6 pontos de análise para maior precisão na estrada
    const steps = [0, 0.2, 0.4, 0.6, 0.8, 1];
    const indices = steps.map(s => Math.floor(coords.length * s - (s === 1 ? 1 : 0)));

    try {
      const weatherData = await Promise.all(indices.map(async (idx) => {
        const p = coords[idx];
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p[0]}&longitude=${p[1]}&hourly=precipitation_probability,temperature_2m&forecast_days=1`);
        const data = await res.json();
        
        const currentHour = new Date().getHours();
        const prob = data.hourly.precipitation_probability[currentHour];
        const temp = data.hourly.temperature_2m[currentHour];
        const isRainy = prob >= 40; // Consideramos chuva acima de 40%

        let locationName = null;
        // Se for um ponto de chuva, descobrimos o nome do lugar
        if (isRainy) {
            locationName = await fetchLocationName(p[0], p[1]);
        }

        return { lat: p[0], lng: p[1], prob, temp, isRainy, locationName };
      }));

      setWeatherPoints(weatherData);

      // Encontra o primeiro ponto onde a chuva é significativa para destacar
      const firstMajorRain = weatherData.find(p => p.isRainy);
      setCriticalRainPoint(firstMajorRain || null);

    } catch (e) {
      console.error("Erro clima detalhado:", e);
    }
  };

  const handleCalculate = async () => {
    if (!origin || !destination) return;
    toast.loading("Calculando a melhor rota e verificando o clima...");
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.coords.lng},${origin.coords.lat};${destination.coords.lng},${destination.coords.lat}?overview=full&geometries=polyline`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes?.[0]) {
        const route = data.routes[0];
        const decoded = polyline.decode(route.geometry);
        const distKm = route.distance / 1000;
        const autonomy = profile.tank_capacity_l * profile.fuel_consumption_km_l;

        setGeometry(decoded);
        setRouteInfo({
          distance: distKm.toFixed(1),
          duration: Math.round(route.duration / 60),
          autonomy: autonomy.toFixed(0),
          needsFuel: distKm > autonomy
        });

        if (distKm > autonomy) {
            const targetKm = autonomy * 0.85;
            const stopIdx = Math.floor((targetKm / distKm) * decoded.length);
            const stopPoint = decoded[stopIdx];
            const gasRes = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(`[out:json];node["amenity"="fuel"](around:15000, ${stopPoint[0]}, ${stopPoint[1]});out body;`)}`);
            const gasData = await gasRes.json();
            setGasStations(gasData.elements.slice(0, 5));
        }

        await fetchWeatherOnRoute(decoded);
        toast.dismiss();
        setIsModalOpen(false);
      }
    } catch (e) { 
        toast.dismiss();
        toast.error("Erro ao calcular rota. Tente novamente."); 
    }
  };

  return (
    <div className="relative h-full w-full bg-slate-50">
      <MapContainer center={[-8.0476, -34.8770]} zoom={10} zoomControl={false} className="h-full w-full">
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        
        {geometry.length > 0 && (
          <Polyline positions={geometry} pathOptions={{ color: '#f97316', weight: 6, opacity: 0.8, lineCap: 'round' }} />
        )}
        
        <RouteFocus coords={geometry} />

        {/* MARCADORES DE CLIMA NORMAIS (Pequenos) */}
        {weatherPoints.map((p, i) => {
          // Não desenha o marcador pequeno se ele for o mesmo do marcador crítico (para não sobrepor)
          if (criticalRainPoint && p.lat === criticalRainPoint.lat) return null;

          return (
            <Marker 
                key={`w-${i}`} 
                position={[p.lat, p.lng]} 
                icon={L.divIcon({
                className: 'custom-icon',
                html: `<div class="flex flex-col items-center opacity-80 hover:opacity-100 transition-opacity">
                        <div class="bg-white/90 backdrop-blur px-2 py-1 rounded-xl shadow-sm border border-slate-100 flex items-center gap-1">
                            <span class="text-sm">${p.prob >= 40 ? '🌧️' : '☀️'}</span>
                            <span class="text-[9px] font-black text-slate-700">${Math.round(p.temp)}°</span>
                        </div>
                        </div>`,
                iconSize: [40, 30]
                })}
            />
          )
        })}

        {/* MARCADOR CRÍTICO DE CHUVA (GRANDE E DESTAQUE) */}
        {criticalRainPoint && (
             <Marker 
             position={[criticalRainPoint.lat, criticalRainPoint.lng]} 
             zIndexOffset={1000} // Garante que fica por cima de tudo
             icon={L.divIcon({
               className: 'critical-weather-icon',
               html: `<div class="flex flex-col items-center animate-bounce-slow">
                        <div class="bg-blue-600 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-blue-900/30 border-2 border-white flex items-center gap-3">
                          <span class="text-3xl">🌧️</span>
                          <div class="flex flex-col">
                            <span class="text-[10px] font-bold uppercase opacity-80 leading-none mb-1">Alerta de Chuva</span>
                            <span class="text-sm font-black leading-none break-words max-w-[120px]">${criticalRainPoint.locationName}</span>
                            <span class="text-xs font-bold mt-1">Probabilidade: ${criticalRainPoint.prob}%</span>
                          </div>
                        </div>
                        <div class="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] border-t-blue-600 mt-[-2px]"></div>
                      </div>`,
               iconSize: [180, 80],
               iconAnchor: [90, 80] // Ancora a ponta do triângulo no local exato
             })}
           />
        )}

        {gasStations.map((s) => (
            <Marker key={s.id} position={[s.lat, s.lon]} icon={gasIcon}>
                <Popup>
                  {/* Popup do posto (igual ao anterior) */}
                    <div className="p-1 text-center min-w-[120px]">
                        <p className="font-black text-slate-800 leading-tight mb-2">{s.tags.name || "Posto"}</p>
                        <button 
                        onClick={() => { setSelectedStation(s); toast.success("Parada selecionada!"); }}
                        className="bg-orange-600 text-white text-[10px] px-3 py-2 rounded-xl font-black uppercase w-full"
                        >
                        Abastecer Aqui
                        </button>
                    </div>
                </Popup>
            </Marker>
        ))}
      </MapContainer>

      {/* DASHBOARD SUPERIOR */}
      <AnimatePresence>
        {routeInfo && !isModalOpen && (
          <motion.div initial={{ y: -100 }} animate={{ y: 20 }} className="absolute top-0 left-4 right-4 z-[1000] space-y-2">
            <div className={`rounded-[2.5rem] p-6 shadow-2xl border transition-colors ${criticalRainPoint ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-100'}`}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                    <p className="text-xl font-black">{routeInfo.distance}km</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempo</p>
                    <p className="text-xl font-black">{routeInfo.duration}min</p>
                  </div>
                </div>
                
                {/* Header muda se tiver chuva crítica */}
                {criticalRainPoint && (
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
                    <CloudRain size={20} />
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase opacity-80 leading-none">Prepare-se</span>
                        <span className="text-xs font-black uppercase">Chuva à frente</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Alertas de Combustível (mantidos) */}
              {selectedStation ? (
                <div className="flex items-center gap-3 bg-green-100 p-3 rounded-2xl border border-green-200">
                  <CheckCircle2 className="text-green-700" size={20} />
                  <p className="text-[10px] font-black text-green-800 uppercase truncate">
                    Parada confirmada: {selectedStation.tags.name || 'Posto'}
                  </p>
                </div>
              ) : routeInfo.needsFuel && (
                <div className="bg-amber-100 p-3 rounded-2xl flex items-center gap-3 border border-amber-200 animate-pulse">
                  <Fuel className="text-amber-700" size={20} />
                  <p className="text-[10px] font-black text-amber-800 leading-tight">
                    Autonomia crítica. Selecione um posto no mapa.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ... Modal de Busca e Botão Nova Viagem (mantidos iguais) ... */}
       {!isModalOpen && (
        <button onClick={() => setIsModalOpen(true)} className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-10 py-5 rounded-full font-black text-[10px] tracking-widest z-[1000] shadow-2xl uppercase">
          Nova Viagem
        </button>
      )}
       <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-[2000] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl space-y-6"
            >
              <h2 className="text-3xl font-black italic tracking-tighter text-center">PLANEJAR ROTA</h2>
              <div className="space-y-4">
                <AddressSearch onSelect={setOrigin} placeholder="Início da Viagem" />
                <AddressSearch onSelect={setDestination} placeholder="Destino Final" />
                <button 
                  onClick={handleCalculate} 
                  className="w-full bg-slate-900 text-white p-5 rounded-[2rem] font-black shadow-lg active:scale-95 transition-all uppercase tracking-widest text-sm"
                >
                  CALCULAR TRAJETO
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}