// src/features/profiles/profiles.api.js
import { supabase } from '../../lib/supabase';

export const profilesApi = {
  // Busca os dados do perfil (incluindo a moto)
  async getMyProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  // Atualiza consumo, tanque, etc.
  async updateBikeSettings(settings) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('profiles')
      .update({
        bike_name: settings.bikeName,
        fuel_consumption_km_l: settings.consumption,
        tank_capacity_l: settings.tankCapacity,
        reserve_amount_l: settings.reserve,
        updated_at: new Date()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};