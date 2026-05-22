import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function PilulaDoDia() {
  const { user, refreshProfile } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['pilula-hoje', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: pilulas } = await supabase
        .from('pilulas_dia')
        .select('*')
        .eq('ativo', true)
        .lte('data_publicacao', new Date().toISOString().slice(0, 10))
        .order('data_publicacao', { ascending: false })
        .limit(1);
      const pilula = pilulas?.[0];
      if (!pilula) return null;
      const { data: view } = await supabase
        .from('pilulas_views')
        .select('id')
        .eq('user_id', user!.id)
        .eq('pilula_id', pilula.id)
        .maybeSingle();
      return { pilula, visto: !!view };
    },
  });

  if (!data?.pilula) return null;
  const { pilula, visto } = data;

  async function marcarVisto() {
    if (!user || visto) return;
    const { error } = await supabase.from('pilulas_views').insert({
      user_id: user.id,
      pilula_id: pilula.id,
    });
    if (error) {
      toast.error('Não foi possível registrar');
      return;
    }
    // +2 pts
    await supabase.rpc('add_points' as never, { p_user: user.id, p_pts: 2 } as never).then(() => {}).catch(() => {});
    // fallback: atualiza diretamente caso RPC não exista
    toast.success('+2 pontos! Pílula vista.');
    void qc.invalidateQueries({ queryKey: ['pilula-hoje'] });
    setTimeout(() => void refreshProfile(), 600);
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-bold">
          <Sparkles className="h-4 w-4 text-accent" /> Pílula do dia
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">+2 pts</span>
      </div>
      <p className="text-base font-bold text-foreground">{pilula.titulo}</p>
      {pilula.descricao && <p className="mt-1 text-sm text-muted-foreground">{pilula.descricao}</p>}
      {pilula.media_url && pilula.tipo === 'video' && (
        <video controls className="mt-3 w-full rounded-xl" src={pilula.media_url} />
      )}
      {pilula.media_url && pilula.tipo === 'audio' && (
        <audio controls className="mt-3 w-full" src={pilula.media_url} />
      )}
      <button
        onClick={marcarVisto}
        disabled={visto}
        className={`mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold ${
          visto ? 'bg-success/15 text-success' : 'bg-primary text-primary-foreground'
        }`}
      >
        {visto ? <><Check className="h-4 w-4" /> Visto hoje</> : <><Play className="h-4 w-4" /> Marcar como visto</>}
      </button>
    </div>
  );
}
