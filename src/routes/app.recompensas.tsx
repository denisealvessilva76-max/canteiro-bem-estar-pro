import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/app/recompensas")({
  component: Recompensas,
});

function Recompensas() {
  const { user, profile, refreshProfile } = useAuth();
  const qc = useQueryClient();
  const pontos = profile?.pontos_acumulados ?? 0;

  const { data: items } = useQuery({
    queryKey: ['recompensas'],
    queryFn: async () => {
      const { data } = await supabase.from('recompensas').select('*').eq('ativo', true).order('custo_pontos');
      return data ?? [];
    },
  });

  const { data: historico } = useQuery({
    queryKey: ['resgates', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from('resgates').select('*, recompensas(titulo)')
        .eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  async function resgatar(rec: { id: string; titulo: string; custo_pontos: number }) {
    if (!user) return;
    if (pontos < rec.custo_pontos) { toast.error('Pontos insuficientes'); return; }
    const { error } = await supabase.from('resgates').insert({
      user_id: user.id, recompensa_id: rec.id, pontos_gastos: rec.custo_pontos,
    });
    if (error) { toast.error('Erro no resgate'); return; }
    await supabase.from('profiles').update({ pontos_acumulados: pontos - rec.custo_pontos }).eq('id', user.id);
    toast.success(`Resgatado! ${rec.titulo}`);
    void refreshProfile();
    void qc.invalidateQueries({ queryKey: ['resgates'] });
  }

  return (
    <div className="px-5 pb-8 pt-6">
      <Link to="/app/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Início
      </Link>
      <div className="mt-3 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold">
          <Gift className="h-7 w-7 text-accent" /> Loja
        </h1>
        <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
          <Sparkles className="h-4 w-4" /> {pontos} pts
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {(items ?? []).map((r) => {
          const podeResgatar = pontos >= r.custo_pontos;
          const falta = r.custo_pontos - pontos;
          const img = (r as { imagem_url: string | null }).imagem_url;
          return (
            <div key={r.id} className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
              {img && (
                <img src={img} alt={r.titulo} className="h-40 w-full object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold">{r.titulo}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{r.descricao}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-accent/15 px-3 py-1 text-sm font-bold text-accent">
                    {r.custo_pontos} pts
                  </span>
                </div>
                <button
                  disabled={!podeResgatar}
                  onClick={() => resgatar(r)}
                  className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-primary font-bold text-primary-foreground disabled:bg-none disabled:bg-muted disabled:text-muted-foreground"
                >
                  {podeResgatar ? 'Resgatar' : `Falta ${falta} pts`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {historico && historico.length > 0 && (
        <>
          <h2 className="mt-8 text-base font-bold">Meus resgates</h2>
          <ul className="mt-3 space-y-2">
            {historico.map((h) => (
              <li key={h.id} className="rounded-2xl border border-border bg-card p-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold">{(h as { recompensas: { titulo: string } | null }).recompensas?.titulo}</span>
                  <span className="text-xs text-muted-foreground">{h.status}</span>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString('pt-BR')}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
