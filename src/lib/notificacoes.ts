// Notificações locais (sem servidor de push) — registra SW, pede permissão
// e agenda lembretes diários por horário. Funciona enquanto o navegador roda;
// para 100% em background o usuário precisa instalar como PWA.
import { supabase } from '@/integrations/supabase/client';

const LEMBRETES_KEY = 'canteiro-lembretes-cfg';
const ULTIMO_AGENDAMENTO_KEY = 'canteiro-lembretes-ultimo';

export type LembreteCfg = {
  agua: boolean;       // a cada 90 min entre 7h e 17h
  alongar: boolean;    // 10h e 15h
  escovar: boolean;    // 8h, 13h, 21h
  checkin: boolean;    // 8h
  ciclo: boolean;      // alerta de período (mulheres)
};

export const LEMBRETES_PADRAO: LembreteCfg = {
  agua: true, alongar: true, escovar: true, checkin: true, ciclo: false,
};

export function lerCfg(): LembreteCfg {
  if (typeof window === 'undefined') return LEMBRETES_PADRAO;
  try { return { ...LEMBRETES_PADRAO, ...JSON.parse(localStorage.getItem(LEMBRETES_KEY) || '{}') }; }
  catch { return LEMBRETES_PADRAO; }
}

export function salvarCfg(cfg: LembreteCfg) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LEMBRETES_KEY, JSON.stringify(cfg));
}

export async function registrarSW() {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (e) {
    console.warn('SW register falhou', e);
    return null;
  }
}

export async function pedirPermissao(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return await Notification.requestPermission();
}

function proximoHorario(hour: number, minute = 0): number {
  const now = new Date();
  const alvo = new Date(); alvo.setHours(hour, minute, 0, 0);
  if (alvo.getTime() <= now.getTime()) alvo.setDate(alvo.getDate() + 1);
  return alvo.getTime() - now.getTime();
}

async function agendarLocal(delayMs: number, title: string, body: string, url = '/app/home') {
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (reg?.active) {
    reg.active.postMessage({ type: 'schedule-local', delay: delayMs, title, body, url });
    return;
  }
  // fallback foreground
  setTimeout(() => {
    try { new Notification(title, { body, icon: '/icon-192.png' }); }
    catch { /* noop */ }
  }, delayMs);
}

export async function ativarLembretes(cfg: LembreteCfg, opts?: { force?: boolean }) {
  if (typeof window === 'undefined') return;
  if (Notification?.permission !== 'granted') return;
  // Reagenda no máximo 1x por dia (cada agendamento é via setTimeout no SW)
  const hoje = new Date().toDateString();
  if (!opts?.force && localStorage.getItem(ULTIMO_AGENDAMENTO_KEY) === hoje) return;
  localStorage.setItem(ULTIMO_AGENDAMENTO_KEY, hoje);

  if (cfg.checkin) await agendarLocal(proximoHorario(8, 0), 'Check-in diário', 'Como você está hoje?', '/app/home');
  if (cfg.alongar) {
    await agendarLocal(proximoHorario(10, 0), 'Hora do alongamento', '3 minutos pra soltar o corpo.', '/app/ergonomia');
    await agendarLocal(proximoHorario(15, 0), 'Hora do alongamento', 'Mais 3 minutos pra terminar bem o dia.', '/app/ergonomia');
  }
  if (cfg.agua) {
    for (const h of [7, 9, 11, 13, 15, 17]) {
      await agendarLocal(proximoHorario(h, 0), 'Beba água', 'Hora de mais um copo. Sua meta agradece!', '/app/hidratacao');
    }
  }
  if (cfg.escovar) {
    await agendarLocal(proximoHorario(8, 30), 'Escovação', 'Escove os dentes — manhã.', '/app/odonto');
    await agendarLocal(proximoHorario(13, 0), 'Escovação', 'Escove os dentes — após o almoço.', '/app/odonto');
    await agendarLocal(proximoHorario(21, 0), 'Escovação', 'Escove os dentes — antes de dormir.', '/app/odonto');
  }
}

// ====== Push subscription (placeholder — depende de VAPID configurado) ======
export async function inscreverPush(userId: string, vapidPublicKey?: string) {
  if (!vapidPublicKey) return { ok: false, reason: 'sem-vapid' as const };
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
  const j = sub.toJSON();
  await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: sub.endpoint,
    p256dh: j.keys?.p256dh ?? '',
    auth: j.keys?.auth ?? '',
    user_agent: navigator.userAgent,
  });
  return { ok: true as const };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
