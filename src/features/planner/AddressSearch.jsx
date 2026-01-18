import { useState, useEffect, useRef } from 'react';
import { Loader2, MapPin, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

export function AddressSearch({ placeholder, onSelect, value = '' }) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const debouncedQuery = useDebounce(query, 600);
  const wrapperRef = useRef(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const search = async () => {
      const trimmedQuery = debouncedQuery.trim();
      
      if (trimmedQuery.length < 3) {
        setResults([]);
        return;
      }

      setLoading(true);
      
      // Montagem da URL com sanitização
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmedQuery)}&limit=5&lang=default`;
      
      console.log("🚀 MOTO-WEATHER: Requisitando:", url);

      try {
        const response = await fetch(url);
        
        console.log("📡 STATUS:", response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ DETALHES DO ERRO 400:", errorText);
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("✅ DADOS RECEBIDOS:", data);
        
        if (data && data.features) {
          const mappedResults = data.features.map(feat => ({
            id: feat.properties.osm_id || Math.random(),
            name: feat.properties.name || 'Local desconhecido',
            city: feat.properties.city || feat.properties.state || feat.properties.country || '',
            full_label: `${feat.properties.name}${feat.properties.city ? ', ' + feat.properties.city : ''}`,
            coords: {
              lat: feat.geometry.coordinates[1],
              lng: feat.geometry.coordinates[0]
            }
          }));
          setResults(mappedResults);
          setIsOpen(true);
        }
      } catch (err) {
        console.warn("⚠️ FALHA NA BUSCA:", err.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [debouncedQuery]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-100 focus-within:border-orange-300 transition-all overflow-hidden">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-slate-900 text-sm font-bold py-3 px-3 outline-none placeholder:text-slate-400 placeholder:font-medium"
        />
        <div className="flex items-center pr-3">
          {loading ? (
            <Loader2 size={16} className="animate-spin text-orange-600" />
          ) : query.length > 0 && (
            <button 
              type="button"
              onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={16} className="text-slate-300 hover:text-orange-600" />
            </button>
          )}
        </div>
      </div>

      {/* DROPDOWN DE RESULTADOS */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-[10000] left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setQuery(item.name);
                setIsOpen(false);
                onSelect({ label: item.full_label, coords: item.coords });
              }}
              className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-slate-50 last:border-0 flex items-start gap-3 transition-colors group"
            >
              <MapPin size={14} className="mt-1 text-slate-400 shrink-0 group-hover:text-orange-500 transition-colors" />
              <div className="flex flex-col min-w-0">
                <span className="font-black text-slate-800 text-xs truncate">{item.name}</span>
                <span className="text-[10px] text-slate-500 truncate font-bold uppercase tracking-tight">{item.city}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
