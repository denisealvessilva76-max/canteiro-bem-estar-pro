import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, HelpCircle, Check, X, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { semanaAtualISO } from '@/lib/gamificacao';

export const Route = createFileRoute('/app/quiz')({ component: QuizSemanal });

type Pergunta = { id: string; pergunta: string; opcoes: string[]; correta: number; categoria: string };

function QuizSemanal() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const semana = semanaAtualISO();

  const { data: perguntas } = useQuery({
    queryKey: ['quiz-semana', semana],
    queryFn: async () => {
      const { data } = await supabase
        .from('quiz_obra_perguntas')
        .select('*')
        .eq('ativo', true)
        .eq('semana', semana)
        .limit(5);
      return (data ?? []) as unknown as Pergunta[];
    },
  });

  const { data: respondidas } = useQuery({
    queryKey: ['quiz-respondidas', user?.id, semana],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('quiz_obra_respostas')
        .select('pergunta_id, acertou')
        .eq('user_id', user!.id);
      return data ?? [];
    },
  });

  const { data: ranking } = useQuery({
    queryKey: ['quiz-ranking', semana],
    queryFn: async () => {
      const { data } = await supabase
        .from('quiz_obra_respostas')
        .select('user_id, acertou, profiles!inner(nome)')
        .eq('acertou', true)
        .gte('respondido_em', semana);
      const map = new Map<string, { nome: string; pts: number }>();
      (data ?? []).forEach((r: { user_id: string; profiles: { nome: string }[] | { nome: string } }) => {
        const nome = Array.isArray(r.profiles) ? r.profiles[0]?.nome : (r.profiles as { nome: string }).nome;
        const cur = map.get(r.user_id) ?? { nome: nome ?? '—', pts: 0 };
        cur.pts += 1;
        map.set(r.user_id, cur);
      });
      return Array.from(map.values()).sort((a, b) => b.pts - a.pts).slice(0, 5);
    },
  });

  const [escolhas, setEscolhas] = useState<Record<string, number>>({});

  async function responder(p: Pergunta, opt: number) {
    if (!user) return;
    if (respondidas?.some((r) => r.pergunta_id === p.id)) return;
    if (escolhas[p.id] !== undefined) return;
    setEscolhas((s) => ({ ...s, [p.id]: opt }));
    const acertou = opt === p.correta;
    const { error } = await supabase.from('quiz_obra_respostas').insert({
      user_id: user.id,
      pergunta_id: p.id,
      resposta: opt,
      acertou,
    });
    if (error) {
      toast.error('Erro ao registrar');
      return;
    }
    toast(acertou ? '+5 pts! Acertou 🎯' : 'Errou, próxima vai!');
    void qc.invalidateQueries({ queryKey: ['quiz-respondidas'] });
    void qc.invalidateQueries({ queryKey: ['quiz-ranking'] });
    if (acertou) setTimeout(() => void refreshProfile(), 400);
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <button onClick={() => navigate({ to: '/app/home' })} className="mb-3 flex items-center gap-1 text-sm font-medium text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
      <h1 className="flex items-center gap-2 text-2xl font-extrabold">
        <HelpCircle className="h-6 w-6 text-primary" /> Curiosidades de obra
      </h1>
      <p className="text-sm text-muted-foreground">Quiz semanal sobre EPI, ergonomia e primeiros socorros.</p>

      {(!perguntas || perguntas.length === 0) && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Nenhuma pergunta esta semana ainda. Volte segunda-feira!
        </div>
      )}

      <div className="mt-4 space-y-4">
        {perguntas?.map((p) => {
          const ja = respondidas?.find((r) => r.pergunta_id === p.id);
          const escolha = ja ? (ja.acertou ? p.correta : -1) : escolhas[p.id];
          const respondido = ja || escolhas[p.id] !== undefined;
          return (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{p.categoria}</p>
              <p className="mt-1 font-bold">{p.pergunta}</p>
              <div className="mt-3 space-y-2">
                {p.opcoes.map((o, i) => {
                  const correto = respondido && i === p.correta;
                  const erradoEsc = respondido && i === escolha && i !== p.correta;
                  return (
                    <button
                      key={i}
                      onClick={() => void responder(p, i)}
                      disabled={!!respondido}
                      className={`flex w-full items-center justify-between rounded-xl border-2 px-3 py-2.5 text-left text-sm transition ${
                        correto ? 'border-success bg-success/10' :
                        erradoEsc ? 'border-destructive bg-destructive/10' :
                        'border-border bg-card hover:border-primary'
                      } ${respondido ? 'cursor-default' : ''}`}
                    >
                      <span>{o}</span>
                      {correto && <Check className="h-4 w-4 text-success" />}
                      {erradoEsc && <X className="h-4 w-4 text-destructive" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {ranking && ranking.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Trophy className="h-4 w-4 text-accent" /> Ranking da semana
          </h2>
          <ol className="mt-2 space-y-1 text-sm">
            {ranking.map((r, i) => (
              <li key={i} className="flex justify-between">
                <span>{i + 1}. {r.nome}</span>
                <span className="font-bold">{r.pts} ✅</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
