import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, MapPin, Phone, Sunrise, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { todayISO } from "@/lib/canteiro";
import { GameBoundary } from "@/components/GameBoundary";
import { EscovaDragDrop } from "@/components/jogos/EscovaDragDrop";
import { QuizOdonto } from "@/components/jogos/QuizOdonto";
import { PlacarPessoal } from "@/components/PlacarPessoal";
import { DenteVirtual } from "@/components/DenteVirtual";

export const Route = createFileRoute("/app/odonto")({
  component: Odontologia,
});

const PERIODOS = [
  { id: 'manha', label: 'Manhã', icon: Sunrise, hora: '08:30' },
  { id: 'almoco', label: 'Após almoço', icon: Sun, hora: '13:00' },
  { id: 'noite', label: 'Antes de dormir', icon: Moon, hora: '21:00' },
] as const;

function Odontologia() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [aba, setAba] = useState<'info' | 'praticar' | 'quiz'>('info');

  const { data: feitas } = useQuery({
    queryKey: ['odonto-hoje', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from('odonto_logs').select('periodo').eq('user_id', user!.id).eq('data', todayISO());
      return new Set((data ?? []).map((d) => d.periodo));
    },
  });

  const { data: dicas } = useQuery({
    queryKey: ['odonto-dicas'],
    queryFn: async () => {
      const { data } = await supabase.from('odonto_dicas').select('*').eq('ativo', true).order('ordem');
      return data ?? [];
    },
  });

  const { data: clinicas } = useQuery({
    queryKey: ['clinicas-odonto'],
    queryFn: async () => {
      const { data } = await supabase.from('ubs_clinicas').select('*').in('tipo', ['odonto', 'ubs']).eq('ativo', true).order('nome');
      return data ?? [];
    },
  });

  async function marcar(periodo: string) {
    if (!user) return;
    const { error } = await supabase.from('odonto_logs').insert({ user_id: user.id, periodo, data: todayISO() });
    if (error) {
      if ((error as { code?: string }).code === '23505') { toast.info('Já registrado hoje.'); return; }
      toast.error(error.message); return;
    }
    toast.success('Boa! Sorriso saudável.');
    void qc.invalidateQueries({ queryKey: ['odonto-hoje'] });
  }

  const done = feitas?.size ?? 0;

  return (
    <div className="px-5 pb-20 pt-5">
      <Link to="/app/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="mt-2 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-500 p-5 text-white shadow-elevated">
        <h1 className="text-2xl font-extrabold">🦷 Odontologia</h1>
        <p className="text-sm opacity-90">Escove 3x ao dia. Hoje: {done}/3</p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/30">
          <div className="h-full bg-white transition-all" style={{ width: `${(done / 3) * 100}%` }} />
        </div>
      </div>

      <div className="mt-4 inline-flex w-full rounded-full bg-muted p-1 text-xs font-bold">
        {(['info', 'praticar', 'quiz'] as const).map((a) => (
          <button key={a} onClick={() => setAba(a)}
            className={`flex-1 rounded-full px-3 py-1.5 ${aba === a ? 'bg-cyan-500 text-white' : 'text-muted-foreground'}`}>
            {a === 'info' ? 'Informativos' : a === 'praticar' ? 'Praticar' : 'Quiz'}
          </button>
        ))}
      </div>

      {aba === 'info' && (
        <>
          <h2 className="mt-5 text-sm font-bold">Registrar escovação</h2>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PERIODOS.map((p) => {
              const Icon = p.icon;
              const done = feitas?.has(p.id);
              return (
                <button key={p.id} onClick={() => void marcar(p.id)} disabled={done}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-xs font-bold transition ${
                    done ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-border bg-card'
                  }`}>
                  <Icon className="h-5 w-5" />
                  {p.label}
                  <span className="text-[10px] opacity-70">{p.hora}</span>
                  {done && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>

          <h2 className="mt-6 text-sm font-bold">Dicas e cuidados</h2>
          <div className="mt-2 space-y-2">
            {(dicas ?? []).map((d) => (
              <details key={d.id} className="rounded-2xl border border-border bg-card p-4">
                <summary className="cursor-pointer text-sm font-bold">{d.titulo}</summary>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d.conteudo}</p>
              </details>
            ))}
          </div>

          <h2 className="mt-6 text-sm font-bold">Onde se atender</h2>
          <div className="mt-2 space-y-2">
            {(clinicas ?? []).length === 0 && <p className="text-xs text-muted-foreground">A equipe ainda está cadastrando as clínicas odontológicas.</p>}
            {(clinicas ?? []).map((c) => (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-sm font-bold">{c.nome}</p>
                {c.endereco && <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3 w-3" />{c.endereco}{c.cidade ? ` — ${c.cidade}` : ''}</p>}
                {c.telefone && <a href={`tel:${c.telefone}`} className="mt-1 flex items-center gap-1 text-xs font-bold text-primary"><Phone className="h-3 w-3" />{c.telefone}</a>}
                {c.observacoes && <p className="mt-2 text-xs text-muted-foreground">{c.observacoes}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {aba === 'praticar' && (
        <div className="mt-5">
          <GameBoundary componente="EscovaDragDrop" userId={user?.id} onAbort={() => setAba('info')}>
            <EscovaDragDrop onDone={() => setAba('info')} />
          </GameBoundary>
        </div>
      )}

      {aba === 'quiz' && (
        <div className="mt-5">
          <PlacarPessoal jogo="odonto_quiz" />
          <div className="mt-3">
            <GameBoundary componente="QuizOdonto" userId={user?.id} onAbort={() => setAba('info')}>
              <QuizOdonto onDone={() => setAba('info')} />
            </GameBoundary>
          </div>
        </div>
      )}
    </div>
  );
}
