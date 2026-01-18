import { useState, useEffect, useRef } from 'react';
import { Marker, useMap } from 'react-map-gl/maplibre';
import { toast } from 'sonner';

// Função matemática para calcular o ângulo entre dois pontos (Bearing)
function calculateBearing(startLat, startLng, destLat, destLng) {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360; // Normaliza para 0-360
}

export function UserLocation({ onLocationFound, isFollowing, setIsFollowing, mode }) {
  const { current: map } = useMap();
  const [coords, setCoords] = useState(null);
  
  // Guardamos a última posição para calcular a direção do movimento
  const prevCoords = useRef(null);
  const currentBearing = useRef(0);
  const firstFix = useRef(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error("GPS indisponível");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude, heading } = pos.coords;
        const newPos = { lng: longitude, lat: latitude };

        // Lógica de Direção (Bearing)
        let finalBearing = currentBearing.current;

        // 1. Se o GPS der a direção real (celular em movimento), usa ela
        if (heading && !isNaN(heading)) {
          finalBearing = heading;
        } 
        // 2. Se não, calcula baseado no movimento anterior
        else if (prevCoords.current) {
          const dist = Math.sqrt(
            Math.pow(newPos.lat - prevCoords.current.lat, 2) + 
            Math.pow(newPos.lng - prevCoords.current.lng, 2)
          );
          
          // Só atualiza o ângulo se andou um pouquinho (evita o mapa girar sozinho parado)
          if (dist > 0.0001) { 
            finalBearing = calculateBearing(
              prevCoords.current.lat, prevCoords.current.lng,
              newPos.lat, newPos.lng
            );
          }
        }

        // Atualiza referências
        currentBearing.current = finalBearing;
        prevCoords.current = newPos;
        setCoords(newPos);

        if (onLocationFound) onLocationFound([latitude, longitude]);

        // CÂMERA ANIMADA
        if (isFollowing && map) {
          if (!firstFix.current || mode === 'navigation') {
            map.flyTo({
              center: [longitude, latitude],
              zoom: mode === 'navigation' ? 18 : 15,
              pitch: mode === 'navigation' ? 60 : 0, // Inclinação 3D
              bearing: mode === 'navigation' ? finalBearing : 0, // <--- AQUI ESTÁ A MÁGICA
              essential: true,
              duration: 2000,
              curve: 1 // Curva suave na animação
            });
            firstFix.current = true;
          }
        }
      },
      (err) => console.error("Erro GPS", err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [map, isFollowing, mode, onLocationFound]);

  // Listener para parar de seguir se o usuário mexer no mapa
  useEffect(() => {
    if (!map) return;
    const onDrag = () => { if (isFollowing) setIsFollowing(false); };
    map.on('dragstart', onDrag);
    return () => map.off('dragstart', onDrag);
  }, [map, isFollowing, setIsFollowing]);

  if (!coords) return null;

  return (
    <Marker longitude={coords.lng} latitude={coords.lat} anchor="center">
      {/* Ícone Puck com Seta de Direção */}
      <div 
        className="relative flex items-center justify-center w-8 h-8 transition-transform duration-700 ease-linear"
        style={{ transform: `rotate(${currentBearing.current}deg)` }}
      >
        {/* Círculo Azul */}
        <div className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg z-20"></div>
        {/* Onda de Pulso */}
        <div className="absolute w-full h-full bg-blue-500 rounded-full animate-ping opacity-50 z-10"></div>
        {/* Triângulo Branco (Seta) indicando a frente */}
        <div className="absolute -top-1 z-30 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-white"></div>
      </div>
    </Marker>
  );
}