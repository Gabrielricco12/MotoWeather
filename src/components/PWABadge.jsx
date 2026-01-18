
// src/components/PWABadge.jsx
import { useRegisterSW } from 'virtual:pwa-register/react';

export function PWABadge() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[9999] bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-2xl max-w-[300px] animate-in fade-in slide-in-from-bottom-4">
      <p className="text-sm text-slate-200 mb-3">
        {offlineReady ? 'App pronto para uso offline!' : 'Nova versão disponível!'}
      </p>
      <div className="flex gap-2">
        {needRefresh && (
          <button 
            onClick={() => updateServiceWorker(true)}
            className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
          >
            Atualizar
          </button>
        )}
        <button onClick={close} className="text-slate-400 px-3 py-1.5 text-xs">Fechar</button>
      </div>
    </div>
  );
}