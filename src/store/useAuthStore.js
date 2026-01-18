import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,

  // Função para atualizar o perfil localmente (importante para o Dashboard)
  setProfile: (newProfile) => set({ profile: newProfile }),

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        set({ user, profile, loading: false });
      } else {
        set({ user: null, profile: null, loading: false });
      }
    } catch (error) {
      console.error("Erro ao inicializar:", error);
      set({ loading: false });
    }

    // Ouvinte em tempo real para mudanças de login/logout
    supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        set({ user: currentUser, profile, loading: false });
      } else {
        set({ user: null, profile: null, loading: false });
      }
    });
  },
}));