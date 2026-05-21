import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// Tela sensorial: bolhas estouráveis. Foco em redirecionar atenção, sem pontos.
type Bolha = { id: number; x: number; y: number; cor: string; tom: number };

const CORES = ['#9bd6ff', '#cdb4ff', '#ffb4d6', '#b4ffce', '#ffd6a5'];
// Notas pentatônicas (Dó maior) — sempre soam harmoniosas, sem nota dissonante.
const NOTAS = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];

export function FidgetBubbles() {
  const [seed, setSeed] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);

  const bolhas = useMemo<Bolha[]>(() => {
    const arr: Bolha[] = [];
    for (let i = 0; i < 18; i++) {
      arr.push({
        id: seed * 100 + i,
        x: Math.random() * 80 + 5,
        y: Math.random() * 80 + 5,
        cor: CORES[i % CORES.length],
        tom: NOTAS[Math.floor(Math.random() * NOTAS.length)],
      });
    }
    return arr;
  }, [seed]);

  const [estouradas, setEstouradas] = useState<Set<number>>(new Set());

  function tocarPop(freq: number) {
    if (typeof window === 'undefined') return;
    const W = window as unknown as { webkitAudioContext?: typeof AudioContext };
    const ctx = ctxRef.current ?? new (window.AudioContext || W.webkitAudioContext!)();
    ctxRef.current = ctx;
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.6, t + 0.18);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  function estourar(b: Bolha) {
    if (estouradas.has(b.id)) return;
    tocarPop(b.tom);
    setEstouradas((p) => new Set([...p, b.id]));
  }

  useEffect(() => {
    if (estouradas.size >= bolhas.length) {
      const t = setTimeout(() => { setSeed((s) => s + 1); setEstouradas(new Set()); }, 600);
      return () => clearTimeout(t);
    }
  }, [estouradas, bolhas.length]);

  useEffect(() => () => { try { ctxRef.current?.close(); } catch { /* noop */ } }, []);

  return (
    <div className="relative mt-3 h-72 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 to-pink-50">
      {bolhas.map((b) => {
        const off = estouradas.has(b.id);
        return (
          <motion.button
            key={b.id}
            onPointerDown={() => estourar(b)}
            initial={{ scale: 0 }}
            animate={{ scale: off ? 0 : 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            className="absolute h-12 w-12 rounded-full shadow-soft"
            style={{ left: `${b.x}%`, top: `${b.y}%`, backgroundColor: b.cor }}
          />
        );
      })}
      <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[10px] text-muted-foreground">
        Toque pra estourar · cada bolha toca uma nota suave 🎵
      </p>
    </div>
  );
}
