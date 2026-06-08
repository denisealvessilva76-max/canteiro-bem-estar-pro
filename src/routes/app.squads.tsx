import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/squads")({
  component: SquadsApp,
});

function SquadsApp() {
  const { profile } = useAuth();

  const { data: ranking } = useQuery({
    queryKey: ["squads-ranking"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ranking_squads_por_capita");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: minhaSquad } = useQuery({
    queryKey: ["minha-squad", profile?.squad_id],
    enabled: !!profile?.squad_id,
    queryFn: async () => {
      const [{ data: squad }, { data: membros }] = await Promise.all([
        supabase.from("squads").select("*").eq("id", profile!.squad_id!).maybeSingle(),
        supabase.from("profiles").select("id, nome, matricula, pontos_acumulados, avatar_url")
          .eq("squad_id", profile!.squad_id!).order("pontos_acumulados", { ascending: false }),
      ]);
      return { squad, membros: membros ?? [] };
    },
  });

  return (
    <div className="px-5 pb-8 pt-6">
      <Link to="/app/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Início
      </Link>
      <h1 className="mt-3 flex items-center gap-2 text-2xl font-extrabold"><Users className="h-7 w-7" /> Squads</h1>
      <p className="text-sm text-muted-foreground">Equipes da obra disputando pela média de pontos por integrante.</p>

      {minhaSquad?.squad ? (
        <section className="mt-5 rounded-3xl border border-border p-4 shadow-soft"
          style={{ borderColor: minhaSquad.squad.cor }}>
          <p className="text-xs font-bold uppercase text-muted-foreground">Minha squad</p>
          <h2 className="text-xl font-extrabold" style={{ color: minhaSquad.squad.cor }}>
            {minhaSquad.squad.nome}
          </h2>
          <ul className="mt-3 space-y-1.5">
            {minhaSquad.membros.map((m, i) => (
              <li key={m.id} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-center text-xs font-bold text-muted-foreground">{i + 1}</span>
                {m.avatar_url ? <img src={m.avatar_url} className="h-6 w-6 rounded-full object-cover" alt="" />
                  : <span>👤</span>}
                <span className="flex-1 truncate">{m.nome}</span>
                <span className="font-bold text-primary">{m.pontos_acumulados}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
          Você ainda não está em uma squad. Fale com seu líder para ser incluído.
        </p>
      )}

      <h2 className="mt-8 text-base font-bold">🏆 Ranking de squads</h2>
      <ul className="mt-3 space-y-2">
        {(ranking ?? []).map((s: { squad_id: string; nome: string; cor: string; integrantes: number; media_pontos: number; total_pontos: number }, i: number) => {
          const minha = s.squad_id === profile?.squad_id;
          return (
            <li key={s.squad_id}
              className={`flex items-center gap-3 rounded-2xl border p-3 ${minha ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
              <span className="w-6 text-center font-extrabold">{i + 1}º</span>
              <span className="h-8 w-8 rounded-full" style={{ background: s.cor }} />
              <div className="flex-1">
                <p className="text-sm font-bold">{s.nome}</p>
                <p className="text-xs text-muted-foreground">{s.integrantes} integrante{s.integrantes !== 1 ? "s" : ""} · {s.total_pontos} pts totais</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold text-primary">{s.media_pontos}</p>
                <p className="text-[10px] text-muted-foreground">média</p>
              </div>
            </li>
          );
        })}
        {(ranking ?? []).length === 0 && (
          <li className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">Aguardando squads.</li>
        )}
      </ul>
    </div>
  );
}
