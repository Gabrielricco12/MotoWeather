import React, { useState, useEffect, useRef } from 'react';
import { 
  APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary, InfoWindow 
} from '@vis.gl/react-google-maps';
import axios from 'axios';
import { 
  Wind, Thermometer, Search, Circle, Square, Clock, 
  CloudRain, Sun, Cloud, CloudLightning, Snowflake, Droplets, CloudFog 
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';

// ⚠️ SUAS CHAVES
const GOOGLE_MAPS_API_KEY ='AIzaSyBjtpmPfw4t0Ofkadeb-wx8tmG3D4gtPqg'; 
const MAP_ID = 'DEMO_MAP_ID'; 

// ⚠️ CHAVE DA TOMORROW.IO (Pegue em app.tomorrow.io)
const TOMORROW_API_KEY = 'DFAhzJrNFJuPJqpqHU4k8w9NvUC0A2os'; 

function App() {
  const [position, setPosition] = useState(null);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [routeWeatherPoints, setRouteWeatherPoints] = useState([]);
  const [activeWeatherPoint, setActiveWeatherPoint] = useState(null);

  const [originInput, setOriginInput] = useState("Minha Localização");
  const [selectedPlace, setSelectedPlace] = useState(null); 
  const [routeInfo, setRouteInfo] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);

  const weatherPanelRef = useRef();
  const routePanelRef = useRef();
  const distanceRef = useRef({ value: 0 });

  // 1. GPS Inicial
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        fetchTomorrowWeather(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        const recife = { lat: -8.0476, lng: -34.8770 }; // Fallback
        setPosition(recife);
        fetchTomorrowWeather(recife.lat, recife.lng);
      }
    );
  }, []);

  // 2. Animações GSAP
  useGSAP(() => {
    if (currentWeather && weatherPanelRef.current) {
      gsap.fromTo(weatherPanelRef.current, { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.2 });
    }
  }, { dependencies: [currentWeather] });

  useGSAP(() => {
    if (routeInfo && routePanelRef.current) {
      gsap.fromTo(routePanelRef.current, { y: -100, opacity: 0, scale: 0.8 }, { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "elastic.out(1, 0.6)" });
      gsap.fromTo(distanceRef.current, { value: 0 }, { 
          value: parseFloat(routeInfo.distance.replace(',', '.').replace(' km','')),
          duration: 1.5, ease: "power2.out",
          onUpdate: () => {
            const el = document.getElementById("distance-counter");
            if(el) el.innerText = distanceRef.current.value.toFixed(1);
          }
      });
    }
  }, { dependencies: [routeInfo] });

  // --- FUNÇÃO DE CLIMA: TOMORROW.IO ---
  const fetchTomorrowWeather = async (lat, lng) => {
    if (!TOMORROW_API_KEY) return;
    try {
      // Endpoint Forecast (v4)
      const url = `https://api.tomorrow.io/v4/weather/forecast?location=${lat},${lng}&apikey=${TOMORROW_API_KEY}&units=metric`;
      const res = await axios.get(url);
      
      // A Tomorrow retorna timelines. Vamos pegar a "Hourly" (hora atual)
      // data.timelines.hourly[0] é a previsão para "agora/próxima hora"
      const now = res.data.timelines.hourly[0].values;
      
      setCurrentWeather({
        temp: now.temperature,
        description: getTomorrowDescription(now.weatherCode), // Função auxiliar para traduzir o código
        iconCode: now.weatherCode, // Código numérico (ex: 1000, 4001)
        pop: now.precipitationProbability, // Já vem em % (0-100)
        wind: now.windSpeed,
        humidity: now.humidity
      });
    } catch (e) { 
        console.error("Erro Tomorrow.io:", e); 
        // Fallback fake para não quebrar UI se a chave der erro
        setCurrentWeather({ temp: 28, description: "Erro API", iconCode: 1000, pop: 0, wind: 10, humidity: 60 });
    }
  };

  return (
    <div className="relative h-full w-full bg-gray-100">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <Map defaultCenter={position} defaultZoom={12} mapId={MAP_ID} disableDefaultUI={true} className="h-full w-full outline-none">
          
          <AdvancedMarker position={position}>
            <div className="relative flex h-6 w-6 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-[3px] border-white shadow-lg"></span>
            </div>
          </AdvancedMarker>

          <DirectionsController 
            origin={originInput === "Minha Localização" ? position : originInput}
            destination={selectedPlace?.description}
            setDirectionsResponse={setDirectionsResponse}
            setRouteInfo={setRouteInfo}
            setRouteWeatherPoints={setRouteWeatherPoints} 
          />

          {routeWeatherPoints.map((point, index) => (
            <AdvancedMarker 
              key={index} 
              position={point.coords}
              onClick={() => setActiveWeatherPoint(point)}
              className="cursor-pointer"
            >
              <div className="flex flex-col items-center group transition-transform hover:scale-110">
                <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-gray-200">
                  {/* Ícone mapeado para Tomorrow.io */}
                  <DynamicTomorrowIcon code={point.iconCode} size={22} />
                </div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white/95 shadow-sm mt-[-2px]"></div>
                
                <div className="flex gap-1 mt-1">
                  <span className="bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-md">
                    {Math.round(point.temp)}°
                  </span>
                  {point.pop > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-md flex items-center gap-0.5">
                       <Droplets size={8} className="fill-current" /> {Math.round(point.pop)}%
                    </span>
                  )}
                </div>
              </div>
            </AdvancedMarker>
          ))}

          {/* InfoWindow Detalhada */}
          {activeWeatherPoint && (
            <InfoWindow
              position={activeWeatherPoint.coords}
              onCloseClick={() => setActiveWeatherPoint(null)}
              headerDisabled={true}
              maxWidth={220}
            >
              <div className="p-1">
                <h3 className="font-black text-gray-900 text-base mb-3 border-b border-gray-100 pb-2">
                  {activeWeatherPoint.locationName}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-500 font-medium">
                       <CloudRain size={16} className="text-blue-500" /> Chuva
                    </span>
                    <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                      {Math.round(activeWeatherPoint.pop)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-500 font-medium">
                       <Wind size={16} className="text-gray-400" /> Vento
                    </span>
                    <span className="font-bold text-gray-800">
                      {activeWeatherPoint.wind} m/s
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                     <span className="flex items-center gap-2 text-gray-500 font-medium">
                       <Thermometer size={16} className="text-orange-500" /> Temp
                    </span>
                    <span className="font-bold text-gray-800">
                      {Math.round(activeWeatherPoint.temp)}°C
                    </span>
                  </div>
                  
                  <div className="mt-3 pt-2">
                    <p className="bg-gray-100 text-gray-700 text-xs font-bold text-center py-1.5 rounded-lg capitalize border border-gray-200">
                      {activeWeatherPoint.description}
                    </p>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>

        {/* UI Topo */}
        <div className="absolute top-0 left-0 right-0 p-4 z-30 pointer-events-none">
          <div className="mx-auto max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex gap-3 relative pointer-events-auto">
            <div className="flex flex-col items-center pt-2 gap-1">
              <Circle size={10} className="text-blue-600 fill-current" />
              <div className="w-0.5 h-8 bg-gray-200 rounded-full"></div>
              <Square size={10} className="text-red-500 fill-current" />
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <input value={originInput} onChange={e => setOriginInput(e.target.value)} className="w-full bg-gray-50 text-sm font-semibold rounded-lg p-2 outline-none" />
              <PlaceAutocomplete onPlaceSelect={setSelectedPlace} />
            </div>
          </div>
          {routeInfo && (
            <div ref={routePanelRef} className="mx-auto max-w-md mt-2 pointer-events-auto">
              <div className="bg-blue-600 text-white rounded-xl p-4 shadow-lg flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg"><Clock size={24} /></div>
                  <div>
                    <div className="text-2xl font-bold leading-none">{routeInfo.duration}</div>
                    <div className="text-blue-200 text-xs font-bold uppercase">Chegada</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold leading-none"><span id="distance-counter">0</span> km</div>
                  <div className="text-blue-200 text-xs font-bold uppercase">Distância</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* HUD Base */}
        {currentWeather && (
          <div ref={weatherPanelRef} className="absolute bottom-0 left-0 right-0 p-4 z-20 pointer-events-none">
            <div className="mx-auto max-w-lg rounded-[2rem] bg-white/95 backdrop-blur-xl border border-blue-100 p-5 shadow-2xl pointer-events-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-5xl font-black text-gray-900">{Math.round(currentWeather.temp)}°</span>
                  <p className="text-xs text-gray-500 font-bold uppercase mt-1 tracking-wider">{currentWeather.description}</p>
                </div>
                <div className="h-24 w-24">
                  <RiveWeatherDisplay />
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-xs font-bold text-gray-500 mb-1 uppercase">
                  <span>Chance de Chuva</span>
                  <span>{Math.round(currentWeather.pop)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${currentWeather.pop}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </APIProvider>
    </div>
  );
}

// --- CONTROLLER TOMORROW.IO ---
function DirectionsController({ origin, destination, setDirectionsResponse, setRouteInfo, setRouteWeatherPoints }) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);

  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map, suppressMarkers: false, polylineOptions: { strokeColor: "#2563EB", strokeWeight: 6 } }));
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || !destination) return;
    const originLoc = (typeof origin === 'string') ? origin : origin;
    
    directionsService.route({ origin: originLoc, destination: destination, travelMode: 'DRIVING' }).then(async response => {
      directionsRenderer.setDirections(response);
      setDirectionsResponse(response);
      const route = response.routes[0].legs[0];
      setRouteInfo({ distance: route.distance.text, duration: route.duration.text });

      if (TOMORROW_API_KEY && route.steps) {
        const overviewPath = response.routes[0].overview_path; 
        const totalPoints = overviewPath.length;
        const samples = 5; 
        const stepSize = Math.floor(totalPoints / (samples - 1));
        const pointsToFetch = [];

        for (let i = 0; i < samples; i++) {
          const index = Math.min(i * stepSize, totalPoints - 1);
          const point = overviewPath[index];
          pointsToFetch.push({ lat: point.lat(), lng: point.lng() });
        }

        const weatherPromises = pointsToFetch.map(p => 
          axios.get(`https://api.tomorrow.io/v4/weather/forecast?location=${p.lat},${p.lng}&apikey=${TOMORROW_API_KEY}&units=metric`)
        );

        try {
          const results = await Promise.all(weatherPromises);
          const weatherMarkers = results.map((res, i) => {
            const now = res.data.timelines.hourly[0].values;
            // A Tomorrow não retorna nome da cidade na API de Clima, 
            // então usamos "Ponto X" ou teríamos que usar o Geocoding do Google.
            // Para simplificar, usamos "Ponto da Rota".
            return {
              coords: pointsToFetch[i],
              temp: now.temperature,
              iconCode: now.weatherCode,
              description: getTomorrowDescription(now.weatherCode),
              pop: now.precipitationProbability,
              wind: now.windSpeed,
              locationName: `Ponto ${i + 1} da Rota` 
            };
          });
          setRouteWeatherPoints(weatherMarkers);
        } catch (err) { console.error("Erro Tomorrow Rota:", err); }
      }

    }).catch(e => console.error("Erro rota:", e));
  }, [directionsService, directionsRenderer, destination, origin]);
  return null;
}

const RiveWeatherDisplay = () => {
  const { rive, RiveComponent } = useRive({
    src: '/weather.riv',
    stateMachines: "State Machine 1",
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  });
  if (!rive) return <CloudRain size={80} className="text-blue-500 animate-bounce" />;
  return <RiveComponent className="w-full h-full" />;
};

const PlaceAutocomplete = ({ onPlaceSelect }) => {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const placesLibrary = useMapsLibrary('places');
  const [autocompleteService, setAutocompleteService] = useState(null);

  useEffect(() => { if (placesLibrary) setAutocompleteService(new placesLibrary.AutocompleteService()); }, [placesLibrary]);

  const handleInput = (e) => {
    const value = e.target.value;
    setInputValue(value);
    if (!autocompleteService || value.length < 3) { setOptions([]); return; }
    autocompleteService.getPlacePredictions({ input: value, componentRestrictions: { country: 'br' } }, (preds, stat) => {
      if (stat === 'OK' && preds) { setOptions(preds); setShowDropdown(true); }
    });
  };

  const handleSelect = (place) => {
    setInputValue(place.description);
    setOptions([]);
    setShowDropdown(false);
    onPlaceSelect(place);
  };

  return (
    <div className="relative">
      <input value={inputValue} onChange={handleInput} placeholder="Para onde vamos?" className="w-full bg-gray-50 text-lg font-bold rounded-lg p-2 pr-8 outline-none" />
      <Search size={18} className="absolute right-3 top-3 text-gray-400" />
      {showDropdown && options.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl z-50 divide-y divide-gray-50 max-h-60 overflow-y-auto">
          {options.map((place) => (
            <li key={place.place_id} onClick={() => handleSelect(place)} className="p-3 hover:bg-blue-50 cursor-pointer text-sm font-bold text-gray-700">
              {place.structured_formatting.main_text} <span className="text-xs font-normal text-gray-400 block">{place.structured_formatting.secondary_text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// --- NOVOS HELPERS (TOMORROW.IO) ---
function DynamicTomorrowIcon({ code, size = 50 }) {
  // Códigos oficiais: https://docs.tomorrow.io/reference/data-layers-weather-codes
  switch(code) {
    case 1000: return <Sun size={size} className="text-yellow-500 animate-[spin_10s_linear_infinite]" />; // Clear
    case 1100: case 1101: return <Sun size={size} className="text-yellow-400" />; // Mostly Clear
    case 1102: return <Cloud size={size} className="text-gray-400" />; // Mostly Cloudy
    case 1001: return <Cloud size={size} className="text-gray-500" />; // Cloudy
    case 2000: case 2100: return <CloudFog size={size} className="text-gray-300 animate-pulse" />; // Fog
    case 4000: return <CloudRain size={size} className="text-blue-400 animate-bounce" />; // Drizzle
    case 4001: return <CloudRain size={size} className="text-blue-600 animate-bounce" />; // Rain
    case 4200: case 4201: return <CloudRain size={size} className="text-blue-700 animate-bounce" />; // Heavy Rain
    case 8000: return <CloudLightning size={size} className="text-purple-600 animate-pulse" />; // Thunderstorm
    case 5000: case 5100: return <Snowflake size={size} className="text-cyan-400 animate-spin-slow" />; // Snow
    default: return <Sun size={size} className="text-yellow-500" />;
  }
}

function getTomorrowDescription(code) {
  const map = {
    1000: "Céu Limpo", 1100: "Quase Limpo", 1101: "Parc. Nublado", 1102: "Muito Nublado",
    1001: "Nublado", 2000: "Nevoeiro", 4000: "Garoa", 4001: "Chuva", 
    4200: "Chuva Leve", 4201: "Chuva Forte", 8000: "Tempestade", 5000: "Neve"
  };
  return map[code] || "Desconhecido";
}

export default App;
