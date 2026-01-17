import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, CloudSun } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        toast.success('Bem-vindo de volta, piloto!');
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { full_name: formData.fullName }
          }
        });
        if (error) throw error;
        toast.success('Cadastro realizado! Verifique seu e-mail.');
      }
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-50">
      {/* Logo Area */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8 text-center"
      >
        <div className="w-16 h-16 bg-orange-600 rounded-3xl flex items-center justify-center shadow-lg shadow-orange-900/40 mx-auto mb-4">
          <CloudSun size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">MotoWeather</h1>
        <p className="text-slate-500 text-sm">Seu planejamento começa aqui.</p>
      </motion.div>

      {/* Auth Card */}
      <motion.div 
        layout
        className="w-full max-w-sm bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl"
      >
        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-slate-500" size={18} />
                  <input
                    type="text"
                    placeholder="Nome Completo"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-slate-500" size={18} />
            <input
              type="email"
              placeholder="E-mail"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
            <input
              type="password"
              placeholder="Senha"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Criar Conta'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-400 text-sm hover:text-orange-500 transition-colors"
          >
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}