import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type Card = { texto: string; verdade: boolean; explicacao: string };

const CARDS: Card[] = [
  { texto: 'Tomar pílula sem parar faz mal.', verdade: false, explicacao: 'A pausa não é obrigatória; o uso contínuo é seguro com orientação médica.' },
  { texto: 'DIU pode ser usado por quem nunca teve filhos.', verdade: true, explicacao: 'Sim. O DIU é seguro e eficaz para qualquer mulher saudável.' },
  { texto: 'Sangramento intenso por mais de 7 dias é sempre normal.', verdade: false, explicacao: 'Pode indicar problemas — procure a UBS.' },
  { texto: 'O autoexame das mamas substitui a mamografia.', verdade: false, explicacao: 'Autoexame ajuda, mas não substitui a mamografia anual a partir dos 40.' },
  { texto: 'TPM pode afetar humor, sono e disposição.', verdade: true, explicacao: 'Sim, e tem tratamento — fale com a equipe.' },
  { texto: 'Preventivo é gratuito em qualquer UBS.', verdade: true, explicacao: 'Correto, anualmente após o início da vida sexual.' },
  { texto: 'Se eu não menstruar um mês, é gravidez na certa.', verdade: false, explicacao: 'Estresse, peso e hormônios também atrasam. Faça o teste para confirmar.' },
];

export function MulherSwipeCards({ onDone }: { onDone?: () => void }) {
  const { user, refreshProfile } = useAuth();
  const [idx, setIdx] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; explicacao: string } | null>(null);

  if (idx >= CARDS.length) {
    return (
      <div className="rounded-3xl border-2 border-pink-300 bg-pink-50 p-6 text-center">
        <p className="text-2xl">🌸</p>
        <p className="mt-2 text-base font-bold">Fim! {acertos}/{CARDS.length} acertos</p>
        <button
          onClick={async () => {
            if (user) {
              try { await supabase.rpc('conceder_medalha', { _user_id: user.id, _codigo: 'mulher_game' }); } catch { /* ok */ }
              void refreshProfile();
            }
            setIdx(0); setAcertos(0); onDone?.();
          }}
          className="mt-4 h-11 w-full rounded-2xl bg-pink-500 font-bold text-white"
        >
          Reiniciar
        </button>
      </div>
    );
  }

  const c = CARDS[idx];

  function responder(escolha: boolean) {
    const ok = escolha === c.verdade;
    if (ok) setAcertos((a) => a + 1);
    setFeedback({ ok, explicacao: c.explicacao });
    setTimeout(() => { setFeedback(null); setIdx((i) => i + 1); }, 1400);
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground">Arraste para a direita se for <strong className="text-success">Verdade</strong> ou para a esquerda se for <strong className="text-destructive">Mito</strong>.</p>
      <p className="mt-1 text-[10px] text-muted-foreground">Acertos: {acertos} · Carta {idx + 1}/{CARDS.length}</p>

      <div className="relative mt-4 h-64">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 100) responder(true);
              else if (info.offset.x < -100) responder(false);
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, x: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-2 border-pink-300 bg-white p-5 text-center shadow-elevated"
          >
            <p className="text-base font-bold leading-snug">{c.texto}</p>
            <p className="mt-3 text-[10px] text-muted-foreground">Arraste ou use os botões</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {feedback && (
        <div className={`mt-3 rounded-2xl p-3 text-xs ${feedback.ok ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
          <p className="font-bold">{feedback.ok ? '✅ Correto!' : '❌ Errado'}</p>
          <p className="mt-1 text-foreground">{feedback.explicacao}</p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={() => responder(false)} className="flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-destructive bg-destructive/5 font-bold text-destructive">
          <X className="h-5 w-5" /> Mito
        </button>
        <button onClick={() => responder(true)} className="flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-success bg-success/5 font-bold text-success">
          <Check className="h-5 w-5" /> Verdade
        </button>
      </div>
    </div>
  );
}
