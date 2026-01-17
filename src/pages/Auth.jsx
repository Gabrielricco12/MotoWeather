import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bike, Mail, Lock, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function Auth() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Estados do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [bikeName, setBikeName] = useState('');

  // Redirecionamento Automático: Se o usuário logar, manda para o Dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({ 
          email: email.trim(), 
          password 
        });
        if (error) throw error;
        toast.success('Login realizado com sucesso!');
      } else {
        // --- REGISTRO ---
        // 1. Criar usuário no Auth
        const { data, error: signUpError } = await supabase.auth.signUp({ 
          email: email.trim(), 
          password,
          options: {
            data: { full_name: fullName } 
          }
        });

        if (signUpError) throw signUpError;

        // 2. Criar perfil na tabela 'profiles'
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert([
              { 
                id: data.user.id, 
                full_name: fullName, 
                bike_name: bikeName,
                fuel_consumption_km_l: 20, 
                tank_capacity_l: 15 
              }
            ]);
          
          if (profileError) {
            console.error("Erro ao criar perfil:", profileError);
            throw new Error("Usuário criado, mas houve um erro ao salvar os dados da moto.");
          }
          
          toast.success('Conta criada com sucesso! Pilote com segurança.');
        }
      }
    } catch (error) {
      console.error("Erro Auth:", error);
      toast.error(error.message || 'Erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-6 justify-center max-w-md mx-auto">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-black italic tracking-tighter text-slate-900">
          MOTO<span className="text-orange-600">WEATHER</span>
        </h1>
        <p className="text-slate-400 font-bold mt-2">
          {isLogin ? 'Faça login para planejar sua rota' : 'Crie seu perfil de motociclista'}
        </p>
      </header>

      <form onSubmit={handleAuth} className="space-y-4">
        <AnimatePresence mode="wait">
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              {/* NOME */}
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input
                  required
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-50 p-4 pl-12 rounded-2xl outline-none focus:border-orange-500 focus:bg-white font-bold transition-all shadow-inner"
                />
              </div>

              {/* MOTO */}
              <div className="relative">
                <Bike className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input
                  required
                  type="text"
                  placeholder="Modelo da moto (ex: CB 500X)"
                  value={bikeName}
                  onChange={(e) => setBikeName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-50 p-4 pl-12 rounded-2xl outline-none focus:border-orange-500 focus:bg-white font-bold transition-all shadow-inner"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* EMAIL */}
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input
            required
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-50 p-4 pl-12 rounded-2xl outline-none focus:border-orange-500 focus:bg-white font-bold transition-all shadow-inner"
          />
        </div>

        {/* SENHA */}
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input
            required
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-50 p-4 pl-12 rounded-2xl outline-none focus:border-orange-500 focus:bg-white font-bold transition-all shadow-inner"
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full bg-slate-900 text-white p-5 rounded-3xl font-black text-lg shadow-xl shadow-slate-200 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={24} />
          ) : (
            <>
              {isLogin ? 'ACESSAR DASHBOARD' : 'CRIAR PERFIL'}
              <ChevronRight size={22} />
            </>
          )}
        </button>
      </form>

      <footer className="mt-8 text-center">
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="text-slate-400 font-bold text-sm hover:text-orange-600 transition-colors uppercase tracking-widest"
        >
          {isLogin ? 'Não tem conta? Registre sua moto' : 'Já tem conta? Faça o login'}
        </button>
      </footer>
    </div>
  );
}