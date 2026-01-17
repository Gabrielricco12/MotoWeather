import { useState, useEffect } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

export function WeatherLayers({ geometry }) {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    if (!geometry || geometry.length === 0) return;

    const fetchWeather = async () => {
      // Amostra 5 pontos equidistantes na rota
      const samples = [0, 0.25, 0.5, 0.75, 1];
      const indices = samples.map(s => Math.floor(geometry.length * s - (s === 1 ? 1 : 0)));

      try {
        const data = await Promise.all(indices.map(async (idx) => {
          const p = geometry[idx];
          // Busca probabilidade de chuva na hora atual
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p[0]}&longitude=${p[1]}&hourly=precipitation_probability,temperature_2m&forecast_days=1`);
          const json = await res.json();
          
          const currentHour = new Date().getHours();
          return {
            lat: p[0], 
            lng: p[1],
            temp: json.hourly.temperature_2m[currentHour],
            prob: json.hourly.precipitation_probability[currentHour]
          };
        }));
        setPoints(data);
      } catch (error) {
        console.error("Erro ao carregar clima:", error);
      }
    };

    fetchWeather();
  }, [geometry]);

  return points.map((p, i) => (
    <Marker 
      key={`weather-${i}`} 
      position={[p.lat, p.lng]} 
      icon={L.divIcon({
        className: 'weather-marker',
        html: `<div class="flex flex-col items-center">
                 <div class="bg-white/90 backdrop-blur px-2 py-1 rounded-xl shadow-md border-2 ${p.prob > 30 ? 'border-blue-400' : 'border-orange-100'} flex items-center gap-1">
                   <span class="text-sm">${p.prob > 30 ? '🌧️' : '☀️'}</span>
                   <div class="flex flex-col leading-none">
                     <span class="text-[9px] font-black text-slate-900">${Math.round(p.temp)}°</span>
                     <span class="text-[8px] font-bold ${p.prob > 30 ? 'text-blue-600' : 'text-slate-400'}">${p.prob}%</span>
                   </div>
                 </div>
               </div>`,
        iconSize: [50, 40]
      })} 
    />
  ));
}