import { useState, useEffect, useRef } from 'react';
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'sonner';

// Ícone "Puck" (Bolinha Azul Pulsante)
const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div class="relative flex items-center justify-center w-6 h-6">
      <div class="absolute w-full h-full bg-blue-500 rounded-full border-2 border-white shadow-lg z-20"></div>
      <div class="absolute w-full h-full bg-blue-500 rounded-full animate-ping opacity-75 z-10"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export function UserLocation({ onLocationFound, isFollowing, setIsFollowing, mode }) {
  const [position, setPosition] = useState(null);
  const map = useMap();
  const firstFix = useRef(false);

  // 1. Detecta se o usuário arrastou o mapa para parar de seguir automaticamente
  useMapEvents({
    dragstart: () => {
      if (isFollowing) setIsFollowing(false);
    },
  });

  // 2. Monitoramento do GPS
  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error("GPS não suportado.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos = [latitude, longitude];
        
        setPosition(newPos);
        if (onLocationFound) onLocationFound(newPos);

        // Se for a primeira vez que acha o GPS, foca no usuário
        if (!firstFix.current) {
          map.flyTo(newPos, 15, { animate: true });
          firstFix.current = true;
          setIsFollowing(true);
        }
      },
      (err) => console.error("Erro GPS:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [map, onLocationFound, setIsFollowing]);

  // 3. Lógica de "Seguir o Usuário" (Câmera)
  useEffect(() => {
    if (position && isFollowing) {
      // Se estiver navegando (Waze Mode), dá zoom forte (18)
      // Se estiver só explorando, mantém o zoom atual ou usa 15
      const targetZoom = mode === 'navigation' ? 18 : Math.max(map.getZoom(), 15);
      
      map.flyTo(position, targetZoom, { 
        animate: true, 
        duration: 1.5, // Animação mais lenta para ser "cinematográfica"
        easeLinearity: 0.25 
      });
    }
  }, [position, isFollowing, map, mode]);

  return position === null ? null : (
    <Marker position={position} icon={userIcon}>
      <Popup>Você está aqui</Popup>
    </Marker>
  );
}