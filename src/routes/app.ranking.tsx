import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/app/ranking")({
  component: Ranking,
});

function Ranking() {
  const { user } = useAuth();
  const { data: top } = useQuery({
    queryKey: ['ranking'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles').select('id, nome, matricula, pontos_acumulados, avatar_id')
        .order('pontos_acumulados', { ascending: false }).limit(20);
      return data ?? [];
    },
  });

  const podio = (top ?? []).slice(0, 3);
  const resto = (top ?? []).slice(3);

  return (
    <div className="px-5 pb-8 pt-6">
      <Link to="/app/desafios" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold">🏆 Ranking</h1>
      <p className="text-sm text-muted-foreground">Top trabalhadores Canteiro Saudável</p>

      {podio.length >= 3 && (
        <div className="mt-8 grid grid-cols-3 items-end gap-2">
          {[1, 0, 2].map((idx, ord) => {
            const p = podio[idx];
            const heights = [120, 150, 100];
            const colors = ['bg-secondary', 'bg-gradient-warm text-accent-foreground', 'bg-secondary'];
            const medals = ['🥈', '🥇', '🥉'];
            return (
              <div key={p?.id ?? idx} className="text-center">
                <div className="text-3xl">{medals[ord]}</div>
                <p className="mt-1 truncate text-xs font-bold">{p?.nome?.split(' ')[0]}</p>
                <p className="text-xs text-muted-foreground">{p?.pontos_acumulados} pts</p>
                <div className={`mt-2 rounded-t-2xl ${colors[ord]}`} style={{ height: heights[ord] }} />
              </div>
            );
          })}
        </div>
      )}

      <ul className="mt-8 space-y-2">
        {resto.map((p, i) => (
          <li key={p.id} className={`flex items-center gap-3 rounded-2xl border border-border p-3 ${
            p.id === user?.id ? 'bg-primary/5 border-primary' : 'bg-card'
          }`}>
            <span className="w-6 text-center text-sm font-bold text-muted-foreground">{i + 4}</span>
            <span className="text-2xl">👤</span>
            <div className="flex-1">
              <p className="text-sm font-bold">{p.nome}</p>
              <p className="text-xs text-muted-foreground">Mat. {p.matricula}</p>
            </div>
            <span className="text-sm font-extrabold text-primary">{p.pontos_acumulados}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
