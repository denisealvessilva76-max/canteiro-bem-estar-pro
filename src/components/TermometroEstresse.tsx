import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Thermometer } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { isSextaFeira, semanaAtualISO } from '@/lib/gamificacao';

const NIVEIS = [
  { n: 1, label: 'Tranquilo', emoji: '😌', cor: 'bg-emerald-500' },
  { n: 2, label: 'Ok', emoji: '🙂', cor: 'bg-lime-500' },
  { n: 3, label: 'Tenso', emoji: '😐', cor: 'bg-yellow-500' },
  { n: 4, label: 'Estressado', emoji: '😣', cor: 'bg-orange-500' },
  { n: 5, label: 'No limite', emoji: '🥵', cor: 'bg-red-600' },
];

export function TermometroEstresse() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const semana = semanaAtualISO();

  const { data: ja } = useQuery({
    queryKey: ['estresse-semana', user?.id, semana],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('estresse_logs')
        .select('*')
        .eq('user_id', user!.id)
        .eq('semana', semana)
        .maybeSingle();
      return data;
    },
  });

  if (!isSextaFeira() && !ja) return null;
  if (ja) return null;

  async function enviar() {
    if (!user || !selecionado) return;
    const { error } = await supabase.from('estresse_logs').insert({
      user_id: user.id,
      nivel: selecionado,
      semana,
    });
    if (error) {
      toast.error('Erro ao registrar');
      return;
    }
    toast.success('Termômetro registrado, valeu!');
    void qc.invalidateQueries({ queryKey: ['estresse-semana'] });
  }

  return (
    <div className="rounded-3xl border-2 border-accent/40 bg-accent/5 p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <Thermometer className="h-4 w-4 text-accent" /> Como foi sua semana?
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">Só uma pergunta, leva 5 segundos.</p>
      <div className="mt-3 grid grid-cols-5 gap-1">
        {NIVEIS.map((n) => (
          <button
            key={n.n}
            onClick={() => setSelecionado(n.n)}
            className={`flex flex-col items-center rounded-xl border-2 p-2 transition ${
              selecionado === n.n ? 'border-primary scale-105' : 'border-transparent bg-card'
            }`}
          >
            <span className="text-2xl">{n.emoji}</span>
            <span className="text-[9px] font-medium">{n.label}</span>
          </button>
        ))}
      </div>
      <button
        onClick={enviar}
        disabled={!selecionado}
        className="mt-3 h-10 w-full rounded-xl bg-gradient-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
      >
        Enviar
      </button>
    </div>
  );
}
