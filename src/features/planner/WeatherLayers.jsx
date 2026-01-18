import { useState, useEffect } from 'react';
// CORREÇÃO: Importando do subpacote maplibre
import { Marker } from 'react-map-gl/maplibre';

export function WeatherLayers({ geometry }) {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    if (!geometry || geometry.length === 0) return;

    const fetchWeather = async () => {
      const samples = [0, 0.25, 0.5, 0.75, 1];
      const indices = samples.map(s => Math.floor(geometry.length * s - (s === 1 ? 1 : 0)));

      try {
        const data = await Promise.all(indices.map(async (idx) => {
          const p = geometry[idx]; 
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
      } catch (error) { console.error("Erro clima:", error); }
    };
    fetchWeather();
  }, [geometry]);

  return points.map((p, i) => (
    <Marker key={`weather-${i}`} latitude={p.lat} longitude={p.lng}>
      <div className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform hover:z-50">
        <div className={`px-2 py-1 rounded-xl shadow-md border-2 flex items-center gap-1 backdrop-blur-sm ${p.prob > 30 ? 'bg-blue-50/90 border-blue-400' : 'bg-white/90 border-orange-100'}`}>
          <span className="text-sm">{p.prob > 30 ? '🌧️' : '☀️'}</span>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-black text-slate-900">{Math.round(p.temp)}°</span>
            <span className={`text-[8px] font-bold ${p.prob > 30 ? 'text-blue-600' : 'text-slate-400'}`}>{p.prob}%</span>
          </div>
        </div>
        <div className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] ${p.prob > 30 ? 'border-t-blue-400' : 'border-t-orange-100'}`}></div>
      </div>
    </Marker>
  ));
}