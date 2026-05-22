import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type Pergunta = { p: string; opcoes: string[]; certa: number; explicacao?: string };

// Quiz reutilizável: 1 pergunta por vez, feedback imediato, salva placar em jogo_scores.
export function QuizBase({
  jogo,
  categoria,
  perguntas,
  cor = 'cyan',
  medalhaCodigo,
  onDone,
}: {
  jogo: string;
  categoria: string;
  perguntas: Pergunta[];
  cor?: 'cyan' | 'pink' | 'violet';
  medalhaCodigo?: string;
  onDone?: () => void;
}) {
  const { user, refreshProfile } = useAuth();
  const [idx, setIdx] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [escolha, setEscolha] = useState<number | null>(null);
  const [finalizado, setFinalizado] = useState(false);

  const corClasses = {
    cyan: 'bg-cyan-500 text-white',
    pink: 'bg-pink-500 text-white',
    violet: 'bg-violet-500 text-white',
  }[cor];

  const atual = perguntas[idx];

  function escolher(i: number) {
    if (escolha !== null) return;
    setEscolha(i);
    if (i === atual.certa) setAcertos((a) => a + 1);
  }

  async function proxima() {
    if (idx + 1 < perguntas.length) {
      setIdx(idx + 1);
      setEscolha(null);
      return;
    }
    const pontos = (acertos + (escolha === atual.certa ? 1 : 0)) * 10;
    setFinalizado(true);
    if (!user) return;
    try {
      await supabase.from('jogo_scores').insert({
        user_id: user.id, jogo, categoria, pontos, acertos: acertos + (escolha === atual.certa ? 1 : 0), total: perguntas.length,
      });
      if (medalhaCodigo) await supabase.rpc('conceder_medalha', { _user_id: user.id, _codigo: medalhaCodigo });
      toast.success(`+${pontos} pontos!`);
      void refreshProfile();
    } catch { /* noop */ }
  }

  if (finalizado) {
    const total = acertos;
    return (
      <div className="rounded-2xl border-2 border-border bg-card p-6 text-center">
        <p className="text-5xl">{total === perguntas.length ? '🏆' : total >= perguntas.length / 2 ? '🎉' : '💪'}</p>
        <p className="mt-2 text-xl font-extrabold">{total} de {perguntas.length}</p>
        <p className="mt-1 text-sm text-muted-foreground">+{total * 10} pontos ganhos</p>
        <button onClick={() => { setIdx(0); setAcertos(0); setEscolha(null); setFinalizado(false); }} className={`mt-4 h-11 w-full rounded-2xl font-bold ${corClasses}`}>
          Jogar de novo
        </button>
        {onDone && (
          <button onClick={onDone} className="mt-2 h-10 w-full rounded-2xl border border-border text-sm font-bold">
            Voltar
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Pergunta {idx + 1}/{perguntas.length}</span>
        <span>Acertos: {acertos}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full transition-all ${corClasses}`} style={{ width: `${((idx + 1) / perguntas.length) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} className="mt-4 rounded-2xl border-2 border-border bg-card p-4">
          <p className="text-sm font-bold">{atual.p}</p>
          <div className="mt-3 space-y-2">
            {atual.opcoes.map((op, i) => {
              const isEsc = escolha === i;
              const isCerta = i === atual.certa;
              const cor = escolha === null ? 'border-border bg-background'
                : isCerta ? 'border-success bg-success/10 text-success'
                : isEsc ? 'border-destructive bg-destructive/10 text-destructive'
                : 'border-border bg-background opacity-60';
              return (
                <button key={i} onClick={() => escolher(i)} disabled={escolha !== null}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl border-2 p-3 text-left text-sm font-medium transition ${cor}`}>
                  <span>{op}</span>
                  {escolha !== null && isCerta && <Check className="h-4 w-4" />}
                  {escolha !== null && isEsc && !isCerta && <X className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
          {escolha !== null && atual.explicacao && (
            <p className="mt-3 rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground">💡 {atual.explicacao}</p>
          )}
          {escolha !== null && (
            <button onClick={() => void proxima()} className={`mt-3 h-11 w-full rounded-2xl font-bold ${corClasses}`}>
              {idx + 1 < perguntas.length ? 'Próxima' : 'Ver resultado'}
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
