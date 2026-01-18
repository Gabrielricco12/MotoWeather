import { useState, useRef } from 'react';
// Importação correta do MapLibre
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre'; 
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css'; 

import { useAuthStore } from '../store/useAuthStore';
import { useRouteStore } from '../store/useRouteStore';

import { FloatingSearch } from '../features/planner/FloatingSearch';
import { NavigationPanel } from '../features/planner/NavigationPanel';
import { UserLocation } from '../features/planner/UserLocation';
import { WeatherLayers } from '../features/planner/WeatherLayers';
import { AutonomyManager } from '../features/planner/AutonomyManager';
import { LocateFixed } from 'lucide-react';

import polyline from '@mapbox/polyline';
import { toast } from 'sonner';

// Função auxiliar: Geocodificação Reversa
const fetchLocationName = async (lat, lng) => {
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`);
    const data = await res.json();
    if (data.features?.length > 0) return data.features[0].properties.name || "Local";
  } catch (e) { console.error("Erro ao buscar nome da cidade:", e); }
  return "Trajeto";
};

export function Planner() {
  const mapRef = useRef(null);
  const { profile } = useAuthStore();
  const { origin, destination, setOrigin, setDestination } = useRouteStore();

  const [viewState, setViewState] = useState({ longitude: -46.6333, latitude: -23.5505, zoom: 13 });
  const [mode, setMode] = useState('explore'); 
  const [userPos, setUserPos] = useState(null); 
  const [isFollowing, setIsFollowing] = useState(true);
  
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [rawGeometry, setRawGeometry] = useState([]); 
  const [routeInfo, setRouteInfo] = useState(null);
  
  const [rainAlert, setRainAlert] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);

  // --- CÁLCULO DE ROTA (BLINDADO) ---
  const handleCalculateRoute = async () => {
    // 1. Validação
    const start = origin || (userPos ? { coords: { lat: userPos[0], lng: userPos[1] } } : null);
    const end = destination;

    if (!start || !end) { 
        toast.error("Defina origem e destino corretamente."); 
        return; 
    }

    // Toast de carregamento
    const toastId = toast.loading("Calculando melhor rota...");

    try {
      // 2. Busca a Rota (OSRM)
      // OSRM usa formato: longitude,latitude
      const url = `https://router.project-osrm.org/route/v1/driving/${start.coords.lng},${start.coords.lat};${end.coords.lng},${end.coords.lat}?overview=full&geometries=polyline`;
      
      console.log("Fetching Route:", url); // Debug
      const res = await fetch(url);
      
      if (!res.ok) throw new Error("Falha na API de rotas");
      
      const data = await res.json();

      if (!data.routes?.[0]) {
        throw new Error("Nenhuma rota encontrada para este destino.");
      }

      // 3. Processa a Rota
      const route = data.routes[0];
      const decoded = polyline.decode(route.geometry); // [Lat, Lng]
      const geoJSONCoordinates = decoded.map(p => [p[1], p[0]]); // [Lng, Lat] para o MapLibre
      
      // Atualiza o estado da rota IMEDIATAMENTE (para o usuário ver a linha azul)
      setRawGeometry(decoded);
      setRouteGeoJSON({ type: 'Feature', geometry: { type: 'LineString', coordinates: geoJSONCoordinates } });

      const distKm = route.distance / 1000;
      // Autonomia padrão caso o perfil não esteja carregado
      const tank = profile?.tank_capacity_l || 15;
      const consumption = profile?.fuel_consumption_km_l || 30;
      const autonomy = tank * consumption;

      setRouteInfo({
        distance: distKm.toFixed(1),
        duration: Math.round(route.duration / 60),
        autonomy: autonomy.toFixed(0),
        needsFuel: distKm > autonomy
      });

      // Ajusta zoom
      if (mapRef.current) {
          const bounds = geoJSONCoordinates.reduce((bounds, coord) => {
              return bounds.extend(coord);
          }, new maplibregl.LngLatBounds(geoJSONCoordinates[0], geoJSONCoordinates[0]));

          mapRef.current.fitBounds(bounds, { padding: 100, duration: 1000 });
      }

      setMode('preview');
      toast.dismiss(toastId); // Remove o loading

      // 4. Funções Secundárias (Assíncronas - Não travam a rota)
      // Executamos sem 'await' para que se falharem, a rota continue lá
      analyzeWeather(decoded).catch(e => console.error("Erro secundário Clima:", e));
      checkFuel(distKm, autonomy, decoded).catch(e => console.error("Erro secundário Postos:", e));

    } catch (e) { 
      console.error("ERRO CRÍTICO:", e);
      toast.dismiss(toastId);
      toast.error(`Erro: ${e.message}`); 
    }
  };

  const analyzeWeather = async (coords) => {
    setRainAlert(null);
    if (!coords || coords.length < 2) return;

    const steps = [0.2, 0.4, 0.6, 0.8, 1]; 
    // Garante índices válidos
    const indices = steps.map(s => Math.min(Math.floor(coords.length * s), coords.length - 1));
    
    try {
        const forecasts = await Promise.all(indices.map(async idx => {
            const p = coords[idx];
            // API Clima
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p[0]}&longitude=${p[1]}&hourly=precipitation_probability&forecast_days=1`);
            const data = await res.json();
            const hour = new Date().getHours();
            
            // Segurança caso a API mude formato
            const prob = data.hourly?.precipitation_probability?.[hour] || 0;
            return { lat: p[0], lng: p[1], prob };
        }));

        console.log("Previsões encontradas:", forecasts); // Debug

        // --- MUDANÇA: BAIXEI A SENSIBILIDADE PARA 10% PARA TESTE ---
        // Se chover mais que 10%, mostra alerta. Depois você pode subir para 40.
        const worst = forecasts.find(f => f.prob >= 10); 
        
        if (worst) {
            const city = await fetchLocationName(worst.lat, worst.lng);
            setRainAlert({ ...worst, city });
            toast("Alerta de chuva na rota!", { icon: '🌧️' });
        }
    } catch (e) { 
        console.error("Falha ao analisar clima:", e); 
        // Não jogamos erro (throw) para não quebrar a rota principal
    }
  };

  const checkFuel = async (dist, autonomy, coords) => {
     if (dist > autonomy && coords.length > 0) {
        const targetIdx = Math.floor((autonomy * 0.8 / dist) * coords.length);
        const p = coords[Math.min(targetIdx, coords.length - 1)];
        
        try {
            const query = `[out:json];node["amenity"="fuel"](around:15000, ${p[0]}, ${p[1]});out body;`;
            const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
            const data = await res.json();
            setGasStations(data.elements.slice(0, 5));
        } catch (e) {
            console.error("Erro ao buscar postos:", e);
        }
     } else {
        setGasStations([]);
     }
  };

  // --- HANDLERS UI ---
  const handleStartNavigation = () => {
    setMode('navigation');
    setIsFollowing(true);
    toast.success("Navegação 3D Iniciada!");
  };

  const handleSelectDestination = (place) => {
    setDestination(place);
    setMode('destination_selected');
    setIsFollowing(false);
    mapRef.current?.flyTo({ center: [place.coords.lng, place.coords.lat], zoom: 14 });
  };

  const handleCancel = () => {
    setMode('explore');
    setRouteGeoJSON(null);
    setDestination(null);
    setRainAlert(null);
    setSelectedStation(null);
    setIsFollowing(true);
    mapRef.current?.flyTo({ pitch: 0, zoom: 15 });
  };

  return (
    <div className="relative h-full w-full bg-slate-100">
      <Map
        ref={mapRef}
        initialViewState={viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        mapLib={maplibregl}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <UserLocation 
          onLocationFound={(coords) => {
             setUserPos(coords);
             // Só define origem se ainda não tiver uma
             if(!origin) setOrigin({ label: "Minha Localização", coords: { lat: coords[0], lng: coords[1] }});
          }}
          isFollowing={isFollowing}
          setIsFollowing={setIsFollowing}
          mode={mode}
        />

        {routeGeoJSON && (
          <Source id="route-source" type="geojson" data={routeGeoJSON}>
            <Layer id="route-layer" type="line" layout={{ "line-join": "round", "line-cap": "round" }} paint={{ "line-color": "#3b82f6", "line-width": 8, "line-opacity": 0.8 }} />
          </Source>
        )}

        {rawGeometry.length > 0 && (
            <>
                <WeatherLayers geometry={rawGeometry} />
                <AutonomyManager geometry={rawGeometry} distanceKm={parseFloat(routeInfo?.distance || 0)} profile={profile} onStationSelect={setSelectedStation} />
            </>
        )}

        {destination && mode !== 'navigation' && (
           <Marker longitude={destination.coords.lng} latitude={destination.coords.lat} color="#ea580c" />
        )}

        {rainAlert && (
            <Marker longitude={rainAlert.lng} latitude={rainAlert.lat}>
                <div className="animate-bounce text-4xl drop-shadow-lg z-50 cursor-pointer" title={`Chuva em ${rainAlert.city}`}>⛈️</div>
            </Marker>
        )}
      </Map>

      {mode === 'explore' && <FloatingSearch onSelectDestination={handleSelectDestination} onClear={() => {}} />}

      {!isFollowing && (
        <button onClick={() => setIsFollowing(true)} className="absolute bottom-40 right-4 bg-white p-4 rounded-full shadow-xl text-slate-700 z-[1000] active:scale-95 transition-transform">
          <LocateFixed size={24} />
        </button>
      )}

      <NavigationPanel mode={mode} routeInfo={routeInfo} destination={destination} rainAlert={rainAlert} onCalculate={handleCalculateRoute} onStart={handleStartNavigation} onCancel={handleCancel} />
    </div>
  );
}