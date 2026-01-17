// src/store/useAuthStore.js
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: { id: 'dev-user', email: 'piloto@teste.com' },
  profile: {
    id: 'dev-user',
    full_name: 'Piloto de Teste',
    bike_name: 'Honda CB 500X',
    fuel_consumption_km_l: 25.0,
    tank_capacity_l: 17.5,
    reserve_amount_l: 3.5
  },
  loading: false, // Nunca fica carregando
  initialize: () => {
    console.log("Modo de Desenvolvimento: Auth desativado.");
    set({ loading: false });
  },
}));