import { useEffect, useState } from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';
import { pendingCount, flushQueue } from '@/lib/offline';

export function OfflineIndicator() {
  const [count, setCount] = useState(0);
  const [online, setOnline] = useState(true);
  const [sincronizando, setSinc] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const upd = async () => { setCount(await pendingCount()); setOnline(navigator.onLine); };
    void upd();
    const t = setInterval(upd, 5000);
    window.addEventListener('online', upd);
    window.addEventListener('offline', upd);
    return () => { clearInterval(t); window.removeEventListener('online', upd); window.removeEventListener('offline', upd); };
  }, []);

  if (count === 0 && online) return null;

  async function sincronizarAgora() {
    setSinc(true);
    await flushQueue();
    setCount(await pendingCount());
    setSinc(false);
  }

  return (
    <button onClick={() => void sincronizarAgora()}
      className="fixed top-3 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1.5 text-xs font-bold shadow-elevated">
      {online ? <RefreshCw className={`h-3.5 w-3.5 ${sincronizando ? 'animate-spin' : ''}`} /> : <CloudOff className="h-3.5 w-3.5 text-destructive" />}
      {online ? `${count} ${count === 1 ? 'ação aguardando' : 'ações aguardando'}` : 'Sem internet'}
    </button>
  );
}
