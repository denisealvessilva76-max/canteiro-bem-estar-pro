// Rate limiting client-side (cooldown amigável).
// Persistido em localStorage para não depender de roundtrip ao banco.

const KEY_PREFIX = 'rl:';

export function podeRegistrar(chave: string, cooldownMs: number): { ok: true } | { ok: false; faltamMs: number } {
  if (typeof localStorage === 'undefined') return { ok: true };
  const ultimo = Number(localStorage.getItem(KEY_PREFIX + chave) ?? 0);
  const diff = Date.now() - ultimo;
  if (diff >= cooldownMs) return { ok: true };
  return { ok: false, faltamMs: cooldownMs - diff };
}

export function marcarRegistro(chave: string) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEY_PREFIX + chave, String(Date.now()));
}

export function formatFaltam(ms: number): string {
  const min = Math.ceil(ms / 60000);
  if (min <= 1) return 'menos de 1 minuto';
  return `${min} minutos`;
}
