// Narração via Web Speech API (sem chave, funciona offline-first)
// Voz feminina pt-BR quando disponível.

let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesReady = false;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  // Preferências: feminina pt-BR
  const preferidos = [
    /pt-?BR.*(Maria|Helena|Luciana|Camila|Vitoria|Francisca|Fernanda|Joana)/i,
    /pt-?BR.*female/i,
    /Microsoft.*pt-?BR/i,
    /Google.*português.*Brasil/i,
    /pt-?BR/i,
    /pt-?PT/i,
    /pt/i,
  ];
  for (const re of preferidos) {
    const v = voices.find((vv) => re.test(`${vv.name} ${vv.lang}`));
    if (v) return v;
  }
  return voices[0] ?? null;
}

function ensureVoices(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return resolve();
    if (voicesReady) return resolve();
    const tryNow = () => {
      const vs = window.speechSynthesis.getVoices();
      if (vs.length > 0) {
        voicesReady = true;
        cachedVoice = pickVoice();
        resolve();
        return true;
      }
      return false;
    };
    if (tryNow()) return;
    window.speechSynthesis.onvoiceschanged = () => { tryNow(); };
    setTimeout(() => { if (!voicesReady) { voicesReady = true; cachedVoice = pickVoice(); resolve(); } }, 800);
  });
}

export async function speak(texto: string, opts?: { rate?: number; pitch?: number }) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  await ensureVoices();
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = 'pt-BR';
  u.rate = opts?.rate ?? 0.95;
  u.pitch = opts?.pitch ?? 1.05;
  u.volume = 1;
  if (cachedVoice) u.voice = cachedVoice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
}

export function isTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Música leve de fundo (oscilador suave gerado por WebAudio - sem arquivo externo)
let audioCtx: AudioContext | null = null;
let bgNodes: { osc: OscillatorNode; gain: GainNode; lfo: OscillatorNode; lfoGain: GainNode } | null = null;

export function startBackgroundMusic(volume = 0.04) {
  if (typeof window === 'undefined') return;
  if (bgNodes) return;
  const W = window as unknown as { webkitAudioContext?: typeof AudioContext };
  audioCtx = audioCtx ?? new (window.AudioContext || W.webkitAudioContext!)();
  const ctx = audioCtx;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 220; // A3 — leve, calmo
  const gain = ctx.createGain();
  gain.gain.value = 0;
  // LFO suave
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.18;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = volume;
  lfo.connect(lfoGain).connect(gain.gain);
  osc.connect(gain).connect(ctx.destination);
  osc.start(); lfo.start();
  bgNodes = { osc, gain, lfo, lfoGain };
}

export function stopBackgroundMusic() {
  if (!bgNodes) return;
  try { bgNodes.osc.stop(); bgNodes.lfo.stop(); } catch { /* noop */ }
  bgNodes.osc.disconnect(); bgNodes.lfo.disconnect(); bgNodes.gain.disconnect();
  bgNodes = null;
}
