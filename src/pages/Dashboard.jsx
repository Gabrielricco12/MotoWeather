import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Bike, Fuel, Gauge, CloudSun, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export function Dashboard() {
  const { profile, user, setProfile } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);

  // Estados locais para controlar os campos antes de salvar
  const [tempConsumption, setTempConsumption] = useState('');
  const [tempTank, setTempTank] = useState('');

  // Sincroniza os estados locais quando o perfil carrega
  useEffect(() => {
    if (profile) {
      setTempConsumption(profile.fuel_consumption_km_l);
      setTempTank(profile.tank_capacity_l);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;

    const cons = parseFloat(tempConsumption);
    const tank = parseFloat(tempTank);

    if (isNaN(cons) || isNaN(tank)) {
      toast.error("Insira valores numéricos válidos!");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          fuel_consumption_km_l: cons,
          tank_capacity_l: tank 
        })
        .eq('id', user.id);

      if (error) throw error;

      // Atualiza a store global para refletir em todo o app
      setProfile({ ...profile, fuel_consumption_km_l: cons, tank_capacity_l: tank });
      toast.success("Perfil da moto atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Falha ao salvar no banco. Verifique sua conexão.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="p-6 space-y-8 pb-24">
      <header>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Painel de Controle</p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic">
          Olá, <span className="text-orange-600">{profile.full_name.split(' ')[0]}!</span>
        </h1>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2.5 rounded-2xl">
              <Bike size={24} />
            </div>
            <h2 className="text-2xl font-black tracking-tight">{profile.bike_name}</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* INPUT CONSUMO */}
            <div className="bg-white/5 p-5 rounded-3xl border border-white/10 focus-within:border-orange-500 transition-all">
              <div className="flex items-center gap-2 mb-2 text-orange-500">
                <Fuel size={16} />
                <span className="text-[10px] font-black uppercase">Consumo</span>
              </div>
              <div className="flex items-baseline gap-1">
                <input 
                  type="number"
                  value={tempConsumption}
                  onChange={(e) => setTempConsumption(e.target.value)}
                  className="bg-transparent text-2xl font-black w-full outline-none"
                />
                <span className="text-xs text-slate-500 font-bold italic">km/l</span>
              </div>
            </div>

            {/* INPUT TANQUE */}
            <div className="bg-white/5 p-5 rounded-3xl border border-white/10 focus-within:border-orange-500 transition-all">
              <div className="flex items-center gap-2 mb-2 text-orange-500">
                <Gauge size={16} />
                <span className="text-[10px] font-black uppercase">Tanque</span>
              </div>
              <div className="flex items-baseline gap-1">
                <input 
                  type="number"
                  value={tempTank}
                  onChange={(e) => setTempTank(e.target.value)}
                  className="bg-transparent text-2xl font-black w-full outline-none"
                />
                <span className="text-xs text-slate-500 font-bold italic">Lts</span>
              </div>
            </div>
          </div>

          {/* BOTÃO SALVAR */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white p-5 rounded-3xl font-black flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <Save size={20} />
                SALVAR ALTERAÇÕES
              </>
            )}
          </button>
        </div>
        <Bike className="absolute -right-12 -bottom-12 text-white/[0.03]" size={280} />
      </motion.div>

      {/* WIDGET TEMPO */}
      <section className="bg-white border-2 border-slate-100 p-6 rounded-[2.5rem] flex items-center justify-between shadow-sm">
        <div>
          <p className="text-4xl font-black text-slate-900 tracking-tighter">28°C</p>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-tight italic">Céu Aberto • Petrolina, PE</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-3xl text-orange-600">
           <CloudSun size={32} />
        </div>
      </section>
    </div>
  );
}