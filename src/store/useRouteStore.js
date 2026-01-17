import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useRouteStore = create(
  persist(
    (set, get) => ({
      // --- ESTADO DA MOTO ---
      bike: {
        name: 'Minha Moto',
        consumption: 20.0, // km/l
        tankCapacity: 15.0, // litros
        reserve: 3.0, // litros
      },

      // --- ESTADO DA ROTA ---
      origin: null,      // { label, coords: { lat, lng } }
      destination: null, // { label, coords: { lat, lng } }
      stops: [],         // Array de { id, label, coords, type, isSystemSuggested }
      routeData: {
        distance: 0,     // em km
        duration: 0,     // em minutos
        polyline: null,  // string da geometria
      },

      // --- ACTIONS (MOTO) ---
      updateBike: (newBikeData) => 
        set((state) => ({ bike: { ...state.bike, ...newBikeData } })),

      // --- ACTIONS (ROTA) ---
      setOrigin: (origin) => set({ origin }),
      setDestination: (destination) => set({ destination }),
      
      setRouteData: (data) => set({ 
        routeData: { 
          distance: data.distance / 1000, // converte metros para km
          duration: data.duration / 60,   // converte segundos para minutos
          polyline: data.geometry 
        } 
      }),

      addStop: (stop) => set((state) => ({ 
        stops: [...state.stops, { ...stop, id: crypto.randomUUID() }] 
      })),

      removeStop: (id) => set((state) => ({
        stops: state.stops.filter(s => s.id !== id)
      })),

      clearRoute: () => set({ 
        origin: null, 
        destination: null, 
        stops: [], 
        routeData: { distance: 0, duration: 0, polyline: null } 
      }),

      // --- CÁLCULOS DERIVADOS (GETTERS) ---
      
      // Calcula quanto a moto roda antes de precisar de um posto
      getAutonomy: () => {
        const { consumption, tankCapacity, reserve } = get().bike;
        const usefulFuel = tankCapacity - reserve;
        return usefulFuel * consumption;
      },

      // Verifica se a rota atual é segura ou se precisa de combustível
      getFuelStatus: () => {
        const { routeData } = get();
        const autonomy = get().getAutonomy();
        
        if (routeData.distance === 0) return { needsFuel: false, margin: 0 };
        
        const needsFuel = routeData.distance > autonomy;
        const margin = autonomy - routeData.distance; // negativa se faltar
        
        return {
          needsFuel,
          margin: parseFloat(margin.toFixed(2)),
          requiredStops: Math.ceil(routeData.distance / autonomy) - 1
        };
      }
    }),
    {
      name: 'moto-weather-storage', // Nome da chave no localStorage
    }
  )
);