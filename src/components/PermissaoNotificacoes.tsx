import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { pedirPermissao, ativarLembretes, lerCfg, salvarCfg, registrarSW, inscreverPush, registrarSincronizacaoPeriodica } from '@/lib/notificacoes';
import { VAPID_PUBLIC_KEY } from '@/lib/vapid';
import { useAuth } from '@/contexts/AuthContext';

export function PermissaoNotificacoes() {
  const { user } = useAuth();
  const [estado, setEstado] = useState<NotificationPermission | 'unsupported'>('default');
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) { setEstado('unsupported'); return; }
    setEstado(Notification.permission);
    setOculto(localStorage.getItem('notif-banner-dismiss') === '1');
    // Se já tem permissão, garante SW registrado e reagenda lembretes do dia
    if (Notification.permission === 'granted') {
      void (async () => {
        await registrarSW();
        await ativarLembretes(lerCfg());
        await registrarSincronizacaoPeriodica();
        if (user) {
          try { await inscreverPush(user.id, VAPID_PUBLIC_KEY); } catch { /* noop */ }
        }
      })();
    }
  }, [user]);

  async function ativar() {
    await registrarSW();
    const p = await pedirPermissao();
    setEstado(p);
    if (p === 'granted') {
      const cfg = { ...lerCfg() };
      salvarCfg(cfg);
      await ativarLembretes(cfg, { force: true });
      await registrarSincronizacaoPeriodica();
      // Inscreve para Web Push (cross-device, funciona com app fechado)
      if (user) {
        try { await inscreverPush(user.id, VAPID_PUBLIC_KEY); } catch { /* noop */ }
      }
      // Disparar um "ping" agora para o usuário ver que funcionou
      try {
        new Notification('Lembretes ativados ✅', {
          body: 'Você receberá avisos de água, alongamento e check-in.',
          icon: '/icon-192.png',
        });
      } catch { /* noop */ }
    }
  }

  function fechar() {
    localStorage.setItem('notif-banner-dismiss', '1');
    setOculto(true);
  }

  if (oculto || estado === 'unsupported' || estado === 'granted' || estado === 'denied') return null;

  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Bell className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold">Ative os lembretes</p>
        <p className="text-[11px] text-muted-foreground">Avisos de água, check-in, alongamento e escovação no horário certo.</p>
      </div>
      <button onClick={() => void ativar()} className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">Ativar</button>
      <button onClick={fechar} aria-label="Fechar"><X className="h-4 w-4 text-muted-foreground" /></button>
    </div>
  );
}
