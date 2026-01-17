// src/features/planner/AddressSearch.jsx
import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, MapPin, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

export function AddressSearch({ placeholder, onSelect, value }) {
  const [query, setQuery] = useState(value || '');
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
  }, [wrapperRef]);

  useEffect(() => {
    const searchAddress = async () => {
      if (debouncedQuery.length < 3) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedQuery)}&limit=5&addressdetails=1`
        );
        const data = await response.json();
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Erro na busca:", error);
      } finally {
        setLoading(false);
      }
    };

    searchAddress();
  }, [debouncedQuery]);

  const handleSelect = (item) => {
    const label = item.display_name;
    const coords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
    
    setQuery(label.split(',')[0] + (item.address.city ? `, ${item.address.city}` : ''));
    setIsOpen(false);
    onSelect({ label, coords });
  };

  return (
    <div ref={wrapperRef} className="relative w-full group">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-white text-slate-900 text-sm font-bold placeholder:text-slate-400 placeholder:font-medium py-3 px-2 outline-none rounded-xl transition-all"
        />
        
        <div className="absolute right-2 flex items-center gap-2">
          {loading ? (
            <Loader2 size={16} className="animate-spin text-orange-500" />
          ) : query.length > 0 && (
            <button 
              onClick={() => { setQuery(''); setResults([]); }}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-300 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* DROPDOWN DE RESULTADOS (MODO CLARO) */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-[2000] left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {results.map((item) => (
            <button
              key={item.place_id}
              onClick={() => handleSelect(item)}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex items-start gap-3"
            >
              <div className="mt-1 p-1.5 bg-slate-100 rounded-lg text-slate-400">
                <MapPin size={14} />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-slate-800 text-xs truncate">
                  {item.display_name.split(',')[0]}
                </span>
                <span className="text-[10px] text-slate-500 line-clamp-1">
                  {item.display_name}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}