import { useState } from 'react';
import { Bug, X, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function BugReportButton() {
  const { user } = useAuth();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState('');
  const [severidade, setSeveridade] = useState<'normal' | 'critico'>('normal');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (!user || !texto.trim()) return;
    setEnviando(true);
    const { error } = await supabase.from('reportes_bug').insert({
      user_id: user.id,
      rota: loc.pathname,
      descricao: texto.trim(),
      severidade,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    });
    setEnviando(false);
    if (error) { toast.error('Falha ao enviar: ' + error.message); return; }
    toast.success('Obrigado! Reporte enviado para a equipe.');
    setTexto(''); setSeveridade('normal'); setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Reportar problema"
        className="fixed bottom-24 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-card border border-border text-muted-foreground shadow-elevated active:scale-95"
      >
        <Bug className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
               className="w-full max-w-md mx-auto rounded-t-3xl bg-card p-5 safe-bottom">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">Reportar problema</h3>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <p className="text-xs text-muted-foreground">Conta o que aconteceu nesta tela ({loc.pathname}). Vamos consertar rápido.</p>
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={5}
              placeholder="Ex: o botão de respiração não inicia..."
              className="mt-3 w-full rounded-2xl border-2 border-input bg-background p-3 text-sm outline-none focus:border-primary" />
            <div className="mt-3 flex gap-2 text-xs">
              <button onClick={() => setSeveridade('normal')}
                className={`flex-1 rounded-full border-2 px-3 py-2 font-bold ${severidade === 'normal' ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>
                Normal
              </button>
              <button onClick={() => setSeveridade('critico')}
                className={`flex-1 rounded-full border-2 px-3 py-2 font-bold ${severidade === 'critico' ? 'border-destructive bg-destructive/10 text-destructive' : 'border-border'}`}>
                🚨 Crítico (não consigo usar)
              </button>
            </div>
            <button onClick={() => void enviar()} disabled={enviando || !texto.trim()}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary font-bold text-primary-foreground disabled:opacity-50">
              <Send className="h-4 w-4" /> {enviando ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
