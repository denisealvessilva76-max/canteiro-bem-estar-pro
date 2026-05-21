import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Calendar as CalIcon, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { todayISO } from "@/lib/canteiro";
import { GameBoundary } from "@/components/GameBoundary";
import { MulherSwipeCards } from "@/components/jogos/MulherSwipeCards";

export const Route = createFileRoute("/app/mulher")({
  component: SaudeMulher,
});

const SINTOMAS = ['Cólica', 'Dor de cabeça', 'Cansaço', 'Inchaço', 'Ansiedade', 'TPM', 'Sangramento intenso'];

function SaudeMulher() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [aba, setAba] = useState<'ciclo' | 'educacao' | 'clinicas' | 'praticar'>('ciclo');

  const { data: ciclos } = useQuery({
    queryKey: ['ciclos', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from('ciclo_menstrual').select('*').eq('user_id', user!.id).order('data_inicio', { ascending: false });
      return data ?? [];
    },
  });

  const { data: clinicas } = useQuery({
    queryKey: ['clinicas-mulher'],
    queryFn: async () => {
      const { data } = await supabase.from('ubs_clinicas').select('*').in('tipo', ['ubs', 'mulher']).eq('ativo', true).order('nome');
      return data ?? [];
    },
  });

  const ultimoCiclo = ciclos?.[0];
  const proximoEstimado = ultimoCiclo?.data_inicio
    ? (() => { const d = new Date(ultimoCiclo.data_inicio); d.setDate(d.getDate() + 28); return d.toISOString().slice(0,10); })()
    : null;

  return (
    <div className="px-5 pb-20 pt-5">
      <Link to="/app/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div className="mt-2 rounded-3xl bg-gradient-to-br from-pink-500 to-rose-400 p-5 text-white shadow-elevated">
        <h1 className="text-2xl font-extrabold">💗 Saúde da Mulher</h1>
        <p className="text-sm opacity-90">Calendário, educação e atendimento gratuito.</p>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-1 rounded-full bg-muted p-1 text-[11px] font-bold">
        {(['ciclo', 'educacao', 'clinicas', 'praticar'] as const).map((a) => (
          <button key={a} onClick={() => setAba(a)}
            className={`rounded-full px-2 py-1.5 ${aba === a ? 'bg-pink-500 text-white' : 'text-muted-foreground'}`}>
            {a === 'ciclo' ? 'Calendário' : a === 'educacao' ? 'Educação' : a === 'clinicas' ? 'Onde ir' : 'Praticar'}
          </button>
        ))}
      </div>

      {aba === 'praticar' && (
        <div className="mt-5">
          <GameBoundary componente="MulherSwipeCards" userId={user?.id} onAbort={() => setAba('ciclo')}>
            <MulherSwipeCards onDone={() => setAba('educacao')} />
          </GameBoundary>
        </div>
      )}

      {aba === 'ciclo' && (
        <CalendarioCiclo user={user} ciclos={ciclos ?? []} qc={qc} proximoEstimado={proximoEstimado} />
      )}

      {aba === 'educacao' && (
        <div className="mt-5 space-y-3">
          {EDUCACAO.map((e, i) => (
            <details key={i} className="rounded-2xl border border-border bg-card p-4">
              <summary className="cursor-pointer text-sm font-bold">{e.t}</summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{e.d}</p>
            </details>
          ))}
        </div>
      )}

      {aba === 'clinicas' && (
        <div className="mt-5 space-y-3">
          {(clinicas ?? []).length === 0 && <p className="text-sm text-muted-foreground">A equipe ainda está cadastrando as clínicas. Em breve aparecerão aqui.</p>}
          {(clinicas ?? []).map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-bold">{c.nome}</p>
              {c.endereco && <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3 w-3" />{c.endereco}{c.cidade ? ` — ${c.cidade}` : ''}</p>}
              {c.telefone && <a href={`tel:${c.telefone}`} className="mt-1 flex items-center gap-1 text-xs font-bold text-primary"><Phone className="h-3 w-3" />{c.telefone}</a>}
              {c.observacoes && <p className="mt-2 text-xs text-muted-foreground">{c.observacoes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CalendarioCiclo({ user, ciclos, qc, proximoEstimado }: {
  user: { id: string } | null;
  ciclos: Array<{ id: string; data_inicio: string; data_fim: string | null; fluxo: string | null; sintomas: string[] | null; observacoes: string | null }>;
  qc: ReturnType<typeof useQueryClient>;
  proximoEstimado: string | null;
}) {
  const [inicio, setInicio] = useState(todayISO());
  const [fim, setFim] = useState('');
  const [fluxo, setFluxo] = useState('medio');
  const [sint, setSint] = useState<string[]>([]);
  const [obs, setObs] = useState('');

  async function registrar() {
    if (!user) return;
    const { error } = await supabase.from('ciclo_menstrual').insert({
      user_id: user.id, data_inicio: inicio, data_fim: fim || null, fluxo, sintomas: sint, observacoes: obs || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Ciclo registrado!');
    setFim(''); setObs(''); setSint([]);
    void qc.invalidateQueries({ queryKey: ['ciclos'] });
  }

  return (
    <div className="mt-5 space-y-4">
      {proximoEstimado && (
        <div className="rounded-2xl border border-border bg-pink-50 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-pink-700"><CalIcon className="h-4 w-4" />Próximo período estimado</p>
          <p className="mt-1 text-lg font-extrabold text-pink-900">{new Date(proximoEstimado).toLocaleDateString('pt-BR')}</p>
          <p className="text-xs text-pink-700/70">Baseado em ciclo médio de 28 dias.</p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-bold">Registrar novo ciclo</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-xs">Início
            <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="mt-1 w-full rounded-xl border border-input bg-background p-2 text-sm" />
          </label>
          <label className="text-xs">Fim (opcional)
            <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="mt-1 w-full rounded-xl border border-input bg-background p-2 text-sm" />
          </label>
        </div>
        <div className="mt-3 flex gap-2 text-xs">
          {['leve', 'medio', 'intenso'].map((f) => (
            <button key={f} onClick={() => setFluxo(f)} className={`flex-1 rounded-full border px-2 py-1.5 font-bold ${fluxo === f ? 'border-pink-500 bg-pink-100 text-pink-800' : 'border-border'}`}>
              {f === 'leve' ? 'Leve' : f === 'medio' ? 'Médio' : 'Intenso'}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {SINTOMAS.map((s) => (
            <button key={s} onClick={() => setSint((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s])}
              className={`rounded-full border px-2 py-1 text-[11px] font-medium ${sint.includes(s) ? 'border-pink-500 bg-pink-100 text-pink-800' : 'border-border'}`}>{s}</button>
          ))}
        </div>
        <textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observações..." rows={2}
          className="mt-3 w-full rounded-xl border border-input bg-background p-2 text-sm" />
        <button onClick={() => void registrar()} className="mt-3 flex h-11 w-full items-center justify-center gap-1 rounded-2xl bg-pink-500 font-bold text-white">
          <Plus className="h-4 w-4" /> Salvar
        </button>
      </div>

      {ciclos.length > 0 && (
        <div>
          <p className="text-sm font-bold">Histórico</p>
          <ul className="mt-2 space-y-2">
            {ciclos.slice(0, 6).map((c) => (
              <li key={c.id} className="rounded-xl border border-border bg-card p-3 text-xs">
                <p className="font-bold">{new Date(c.data_inicio).toLocaleDateString('pt-BR')}{c.data_fim ? ` → ${new Date(c.data_fim).toLocaleDateString('pt-BR')}` : ''}</p>
                <p className="text-muted-foreground">Fluxo: {c.fluxo ?? '—'} {(c.sintomas?.length ?? 0) > 0 ? ` · ${c.sintomas!.join(', ')}` : ''}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const EDUCACAO = [
  { t: 'Ciclo menstrual: o que é normal?', d: 'Ciclos entre 21 e 35 dias são considerados regulares. Sangramentos muito intensos, dor incapacitante ou ciclos muito irregulares merecem avaliação médica.' },
  { t: 'Autoexame das mamas', d: 'Faça mensalmente, de preferência uma semana após o início da menstruação. Procure caroços, alterações no formato, secreção ou retração da pele.' },
  { t: 'Preventivo (Papanicolau)', d: 'Recomendado anualmente a partir do início da vida sexual. Disponível gratuitamente em qualquer UBS.' },
  { t: 'Anticoncepção', d: 'A UBS oferece pílula, DIU, injeção e preservativos gratuitamente. Converse com a enfermeira sobre o método ideal pra você.' },
  { t: 'Pré-natal', d: 'Suspeitou de gravidez? Procure a UBS rapidamente. O pré-natal completo é gratuito e essencial.' },
  { t: 'Saúde mental no período', d: 'TPM intensa, tristeza profunda ou ansiedade não são "frescura". Converse com a equipe do app — temos apoio.' },
];
