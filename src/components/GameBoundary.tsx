import React from 'react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Props = {
  componente: string;
  userId?: string;
  rota?: string;
  onAbort?: () => void;
  children: React.ReactNode;
};

type State = { hasError: boolean; msg: string };

// Captura erros de jogos/mini-games: aborta a tela e cria um reporte crítico
// que aparece no painel admin imediatamente (admin.bugs com refetchInterval).
export class GameBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, msg: '' };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, msg: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // Auto-reporte crítico (silencioso).
    try {
      void supabase.from('reportes_bug').insert({
        user_id: this.props.userId ?? null,
        rota: this.props.rota ?? (typeof location !== 'undefined' ? location.pathname : null),
        componente: this.props.componente,
        severidade: 'critico',
        descricao: `[AUTO] ${this.props.componente}: ${this.state.msg}\n${(error instanceof Error && error.stack) || ''}\n${info.componentStack}`,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      });
    } catch { /* ignora */ }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="rounded-3xl border-2 border-warning bg-warning/5 p-6 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-warning" />
        <p className="mt-3 text-sm font-bold">Esta atividade está em manutenção.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          A gente já foi avisado e vai consertar rapidinho. Tome seus pontos pela tentativa! 💪
        </p>
        <button
          onClick={() => { this.setState({ hasError: false, msg: '' }); this.props.onAbort?.(); }}
          className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao menu
        </button>
      </div>
    );
  }
}
