import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Heart, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/app/elogios')({ component: ElogiosPage });

function ElogiosPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busca, setBusca] = useState('');
  const [escolhido, setEscolhido] = useState<{ id: string; nome: string } | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [anonimo, setAnonimo] = useState(false);

  const { data: colegas } = useQuery({
    queryKey: ['colegas', busca, user?.id],
    enabled: busca.length >= 2,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, nome, cargo')
        .ilike('nome', `%${busca}%`)
        .neq('id', user!.id)
        .limit(8);
      return data ?? [];
    },
  });

  const { data: recebidos } = useQuery({
    queryKey: ['elogios-recebidos', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('elogios')
        .select('id, mensagem, anonimo, created_at, de_user_id, profiles!elogios_de_user_id_fkey(nome)')
        .eq('para_user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  async function enviar() {
    if (!user || !escolhido || mensagem.trim().length < 3) {
      toast.error('Escolha um colega e escreva uma mensagem');
      return;
    }
    const { error } = await supabase.from('elogios').insert({
      de_user_id: user.id,
      para_user_id: escolhido.id,
      mensagem: mensagem.trim(),
      anonimo,
    });
    if (error) {
      toast.error('Não foi possível enviar');
      return;
    }
    toast.success(`Elogio enviado para ${escolhido.nome}!`);
    setEscolhido(null);
    setMensagem('');
    setBusca('');
    void qc.invalidateQueries({ queryKey: ['elogios-recebidos'] });
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <button onClick={() => navigate({ to: '/app/home' })} className="mb-3 flex items-center gap-1 text-sm font-medium text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
      <h1 className="flex items-center gap-2 text-2xl font-extrabold">
        <Heart className="h-6 w-6 text-pink-500" /> Você foi nominado
      </h1>
      <p className="text-sm text-muted-foreground">Elogie um colega que fez algo bacana hoje.</p>

      <div className="mt-5 rounded-2xl border border-border bg-card p-4">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Para quem?</label>
        <input
          value={busca}
          onChange={(e) => { setBusca(e.target.value); setEscolhido(null); }}
          placeholder="Digite o nome do colega"
          className="mt-1 h-11 w-full rounded-xl border-2 border-input bg-card px-3 outline-none focus:border-primary"
        />
        {colegas && colegas.length > 0 && !escolhido && (
          <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-border">
            {colegas.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => { setEscolhido({ id: c.id, nome: c.nome }); setBusca(c.nome); }}
                  className="flex w-full items-center justify-between border-b border-border px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span>{c.nome}</span>
                  {c.cargo && <span className="text-xs text-muted-foreground">{c.cargo}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}

        <label className="mt-3 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Mensagem</label>
        <textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder='Ex.: "Salvou minha pele segurando a escada hoje, valeu!"'
          className="mt-1 w-full rounded-xl border-2 border-input bg-card p-3 text-sm outline-none focus:border-primary"
        />
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={anonimo} onChange={(e) => setAnonimo(e.target.checked)} />
          Enviar de forma anônima
        </label>
        <button
          onClick={() => void enviar()}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary font-bold text-primary-foreground"
        >
          <Send className="h-4 w-4" /> Enviar elogio
        </button>
      </div>

      <h2 className="mt-6 text-base font-bold">Elogios recebidos</h2>
      {recebidos && recebidos.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {recebidos.map((e) => (
            <li key={e.id} className="rounded-2xl border border-border bg-card p-3">
              <p className="text-sm">{e.mensagem}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                — {e.anonimo ? 'colega anônimo' : ((e.profiles as { nome?: string } | null)?.nome ?? 'colega')}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Nenhum elogio ainda. Seja a mudança e elogie alguém!</p>
      )}
    </div>
  );
}
