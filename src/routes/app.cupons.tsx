import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Ticket, ChevronLeft, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/cupons")({ component: Cupons });

function Cupons() {
  const { user, profile } = useAuth();
  const { data: cupons } = useQuery({
    queryKey: ['meus-cupons', user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await supabase
      .from('cupons').select('*').eq('user_id', user!.id)
      .order('created_at', { ascending: false })).data ?? [],
  });

  const proximoMarco = [100, 500, 1000, 2500, 5000].find((m) => (profile?.pontos_acumulados ?? 0) < m);

  async function copiar(codigo: string) {
    await navigator.clipboard.writeText(codigo);
    toast.success('Código copiado');
  }

  return (
    <div className="px-4 pt-4">
      <Link to="/app/recompensas" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="text-2xl font-extrabold">Meus cupons</h1>
      <p className="text-sm text-muted-foreground">Ganhe cupons a cada marco de pontos.</p>

      {proximoMarco && (
        <div className="mt-4 rounded-2xl border border-accent/40 bg-accent/5 p-4">
          <p className="text-xs font-bold text-accent">Próximo marco</p>
          <p className="mt-1 text-sm">
            Faltam <strong>{proximoMarco - (profile?.pontos_acumulados ?? 0)}</strong> pontos para o cupom de <strong>{proximoMarco} pts</strong>.
          </p>
        </div>
      )}

      <ul className="mt-5 space-y-3">
        {(cupons ?? []).map((c) => {
          const usado = c.status === 'usado';
          return (
            <li key={c.id} className={`rounded-2xl border-2 p-4 ${usado ? 'border-border bg-muted/30 opacity-60' : 'border-primary/30 bg-card'}`}>
              <div className="flex items-start gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${usado ? 'bg-muted text-muted-foreground' : 'bg-gradient-primary text-primary-foreground'}`}>
                  {usado ? <CheckCircle2 className="h-6 w-6" /> : <Ticket className="h-6 w-6" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{c.descricao}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="rounded-lg bg-muted px-2 py-1 text-xs font-mono font-bold">{c.codigo}</code>
                    {!usado && (
                      <button onClick={() => copiar(c.codigo)} className="text-xs font-bold text-primary">
                        <Copy className="inline h-3 w-3" /> Copiar
                      </button>
                    )}
                  </div>
                  {c.expira_em && !usado && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Válido até {new Date(c.expira_em).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
        {cupons?.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhum cupom ainda. Bata o primeiro marco de 100 pontos!
          </li>
        )}
      </ul>
    </div>
  );
}
