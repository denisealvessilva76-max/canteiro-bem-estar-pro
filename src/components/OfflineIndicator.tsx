import { useEffect } from 'react';
import { toast } from 'sonner';
import { flushQueue } from '@/lib/offline';

export function OfflineIndicator() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncWhenOnline = async () => {
      if (!navigator.onLine) return;
      const r = await flushQueue();
      if (r.ok > 0) toast.success(`${r.ok} ${r.ok === 1 ? 'ação sincronizada' : 'ações sincronizadas'}`);
      if (r.discarded > 0) toast.message(`${r.discarded} ${r.discarded === 1 ? 'ação descartada' : 'ações descartadas'} após falhas`);
    };

    const avisarOffline = () => {
      toast.message('Sem internet. Seus registros serão enviados quando a conexão voltar.', {
        id: 'offline-warning',
      });
    };

    const onOnline = () => { void syncWhenOnline(); };
    window.addEventListener('offline', avisarOffline);
    window.addEventListener('online', onOnline);

    return () => {
      window.removeEventListener('offline', avisarOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  return null;
}
