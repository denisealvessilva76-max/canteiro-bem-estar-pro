import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Play, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Coerência cardíaca: bata no coração no ritmo da bolinha pulsando.
// 60 segundos de prática. Salva pontos pelo nº de toques no compasso.
const DURACAO = 60; // segundos
const BPM = 60; // 1 batida/seg (ritmo relaxante)
const JANELA_MS = 300; // tolerância em ms

export function CardioMental({ onDone }: { onDone?: () => void }) {
  const { user, refreshProfile } = useAuth();
  const [rodando, setRodando] = useState(false);
  const [tempo, setTempo] = useState(DURACAO);
  const [acertos, setAcertos] = useState(0);
  const [toques, setToques] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const startRef = useRef<number>(0);
  const intervaloBatidaMs = 60000 / BPM;

  useEffect(() => {
    if (!rodando) return;
    const t0 = performance.now();
    startRef.current = t0;
    const tick = setInterval(() => {
      const decorrido = (performance.now() - t0) / 1000;
      const rest = DURACAO - Math.floor(decorrido);
      setTempo(rest);
      if (rest <= 0) {
        clearInterval(tick);
        finalizar();
      }
    }, 250);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rodando]);

  function bater() {
    if (!rodando) return;
    setToques((t) => t + 1);
    const decorrido = performance.now() - startRef.current;
    const restoFase = decorrido % intervaloBatidaMs;
    const distancia = Math.min(restoFase, intervaloBatidaMs - restoFase);
    if (distancia <= JANELA_MS) setAcertos((a) => a + 1);
  }

  async function finalizar() {
    setRodando(false);
    setFinalizado(true);
    const totalBatidasIdeal = DURACAO * (BPM / 60);
    const pontos = Math.round((acertos / totalBatidasIdeal) * 100);
    if (!user) return;
    try {
      await supabase.from('jogo_scores').insert({
        user_id: user.id, jogo: 'mental_cardio', categoria: 'mental', pontos, acertos, total: Math.round(totalBatidasIdeal),
      });
      await supabase.rpc('conceder_medalha', { _user_id: user.id, _codigo: 'mental_cardio' });
      toast.success(`Coerência: ${pontos}%`);
      void refreshProfile();
    } catch { /* noop */ }
  }

  function comecar() {
    setTempo(DURACAO); setAcertos(0); setToques(0); setFinalizado(false); setRodando(true);
  }

  if (finalizado) {
    const totalIdeal = DURACAO * (BPM / 60);
    const pct = Math.round((acertos / totalIdeal) * 100);
    return (
      <div className="rounded-2xl border-2 border-border bg-card p-6 text-center">
        <p className="text-5xl">❤️</p>
        <p className="mt-2 text-xl font-extrabold">Coerência: {pct}%</p>
        <p className="mt-1 text-xs text-muted-foreground">{acertos} acertos · {toques} toques · {DURACAO}s</p>
        <button onClick={comecar} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 font-bold text-white">
          <RotateCcw className="h-4 w-4" /> Tentar de novo
        </button>
        {onDone && <button onClick={onDone} className="mt-2 h-10 w-full rounded-2xl border border-border text-sm font-bold">Voltar</button>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-6 text-center">
      <p className="text-xs text-muted-foreground">Toque no coração no ritmo da batida (1 por segundo).</p>
      <div className="mt-4 flex flex-col items-center">
        <motion.button
          onPointerDown={bater}
          animate={rodando ? { scale: [1, 1.25, 1] } : { scale: 1 }}
          transition={rodando ? { duration: 1, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
          className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-violet-500 text-white shadow-elevated active:scale-95"
        >
          <Heart className="h-12 w-12" fill="currentColor" />
        </motion.button>
        <p className="mt-3 text-2xl font-extrabold tabular-nums">{tempo}s</p>
        {rodando && <p className="text-xs text-muted-foreground">Acertos: {acertos}</p>}
      </div>
      {!rodando && (
        <button onClick={comecar} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 font-bold text-white">
          <Play className="h-4 w-4" /> Começar
        </button>
      )}
    </div>
  );
}
