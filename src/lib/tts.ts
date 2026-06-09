// Narração via Web Speech API — voz feminina pt-BR, ritmo calmo.
// Mais humana possível usando voz nativa do dispositivo (sem custo / offline).

let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesReady = false;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Vozes femininas pt-BR mais naturais por fabricante (ordem de preferência)
  const preferidos = [
    /pt-?BR.*(Francisca|Letícia|Leticia|Camila|Maria|Helena|Luciana|Vitoria|Vitória|Joana|Fernanda|Thalita)/i,
    /Microsoft.*(Francisca|Maria|Helena|Letícia|Camila).*pt-?BR/i,
    /Google.*português.*Brasil/i,
    /(Luciana|Joana|Helena|Catarina).*pt/i, // Apple iOS/macOS
    /pt-?BR.*female/i,
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
    setTimeout(() => { if (!voicesReady) { voicesReady = true; cachedVoice = pickVoice(); resolve(); } }, 1000);
  });
}

// Ritmo padrão: bem calmo, claro, feminino e acolhedor.
const RATE_PADRAO = 0.72;   // mais devagar — voz tranquila
const PITCH_PADRAO = 0.96;  // ligeiramente mais grave = mais humano/quente

// Quebra o texto em frases curtas com pausas naturais para soar mais humano.
function humanizar(texto: string): string {
  return texto
    .replace(/\s*\.\s*/g, '. ')
    .replace(/,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function speak(texto: string, opts?: { rate?: number; pitch?: number; calmo?: boolean; fila?: boolean }) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  await ensureVoices();
  const u = new SpeechSynthesisUtterance(humanizar(texto));
  u.lang = 'pt-BR';
  u.rate = opts?.rate ?? (opts?.calmo ? 0.66 : RATE_PADRAO);
  u.pitch = opts?.pitch ?? PITCH_PADRAO;
  u.volume = 1;
  if (cachedVoice) u.voice = cachedVoice;
  if (!opts?.fila) window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

// Pequena dica calma (ex.: "Inspire... e solte"). Não interrompe a narração principal.
export async function speakCue(texto: string) {
  return speak(texto, { rate: 0.62, pitch: 0.92, fila: true });
}

export function stopSpeaking() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
}

export function isTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Música de fundo bem suave (drone calmo) para sessões guiadas.
let audioCtx: AudioContext | null = null;
let bgNodes: { osc: OscillatorNode; gain: GainNode; lfo: OscillatorNode; lfoGain: GainNode } | null = null;

export function startBackgroundMusic(volume = 0.025) {
  if (typeof window === 'undefined') return;
  if (bgNodes) return;
  const W = window as unknown as { webkitAudioContext?: typeof AudioContext };
  audioCtx = audioCtx ?? new (window.AudioContext || W.webkitAudioContext!)();
  const ctx = audioCtx;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 196; // G3 — grave e relaxante
  const gain = ctx.createGain();
  gain.gain.value = 0;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.12; // bem lento
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
