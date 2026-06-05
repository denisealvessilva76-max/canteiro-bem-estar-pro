import { useEffect, useState } from 'react';
import { CloudOff, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { pendingCount, flushQueue, clearQueue } from '@/lib/offline';

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
    const r = await flushQueue();
    const restante = await pendingCount();
    setCount(restante);
    setSinc(false);
    if (r.ok > 0) toast.success(`${r.ok} ${r.ok === 1 ? 'ação sincronizada' : 'ações sincronizadas'}`);
    if (r.discarded > 0) toast.message(`${r.discarded} ${r.discarded === 1 ? 'ação descartada' : 'ações descartadas'} após falhas`);
    if (r.ok === 0 && r.discarded === 0 && restante > 0) {
      toast.error('Não foi possível sincronizar. Toque no X para descartar.');
    }
  }

  async function descartar() {
    const n = await clearQueue();
    setCount(0);
    if (n > 0) toast.message(`${n} ${n === 1 ? 'ação descartada' : 'ações descartadas'}`);
  }

  return (
    <div className="fixed top-3 left-1/2 z-50 -translate-x-1/2 flex items-center gap-1 rounded-full bg-card border border-border pl-3 pr-1 py-1 text-xs font-bold shadow-elevated">
      <button onClick={() => void sincronizarAgora()} className="flex items-center gap-2 py-0.5">
        {online ? <RefreshCw className={`h-3.5 w-3.5 ${sincronizando ? 'animate-spin' : ''}`} /> : <CloudOff className="h-3.5 w-3.5 text-destructive" />}
        {online ? `${count} ${count === 1 ? 'ação aguardando' : 'ações aguardando'}` : 'Sem internet'}
      </button>
      {count > 0 && (
        <button onClick={() => void descartar()} aria-label="Descartar fila"
          className="ml-1 flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
