import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Hand } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/mural")({
  component: Mural,
});

type Item = {
  id: string;
  data: string;
  foto_url: string | null;
  desafio_id: string;
  user_id: string;
  desafio?: { titulo: string } | null;
  profiles?: { nome: string; avatar_url: string | null } | null;
  aplausos: number;
  aplaudido: boolean;
  url_pub?: string | null;
};

function Mural() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: itens } = useQuery({
    queryKey: ["mural", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Item[]> => {
      const { data: checks } = await supabase
        .from("desafio_checkins")
        .select("id, data, foto_url, desafio_id, user_id, desafios(titulo), profiles!desafio_checkins_user_id_fkey(nome, avatar_url)")
        .eq("validado", true)
        .not("foto_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(60);
      const ids = (checks ?? []).map((c) => c.id);
      const [{ data: aps }, urls] = await Promise.all([
        ids.length > 0
          ? supabase.from("mural_aplausos").select("desafio_checkin_id, user_id").in("desafio_checkin_id", ids)
          : Promise.resolve({ data: [] as { desafio_checkin_id: string; user_id: string }[] }),
        Promise.all((checks ?? []).map(async (c) => {
          if (!c.foto_url) return null;
          const { data } = await supabase.storage.from("desafios-fotos").createSignedUrl(c.foto_url, 60 * 60);
          return data?.signedUrl ?? null;
        })),
      ]);
      const apsList = aps ?? [];
      return (checks ?? []).map((c, i) => {
        const meus = apsList.filter((a) => a.desafio_checkin_id === c.id);
        return {
          ...c,
          // Supabase pode retornar relação como array; normaliza para objeto
          desafio: Array.isArray(c.desafios) ? c.desafios[0] : c.desafios,
          profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
          aplausos: meus.length,
          aplaudido: meus.some((a) => a.user_id === user?.id),
          url_pub: urls[i],
        } as Item;
      });
    },
  });

  async function aplaudir(item: Item) {
    if (!user) return;
    if (item.aplaudido) {
      await supabase.from("mural_aplausos").delete()
        .eq("desafio_checkin_id", item.id).eq("user_id", user.id);
    } else {
      await supabase.from("mural_aplausos").insert({
        desafio_checkin_id: item.id, user_id: user.id,
      });
    }
    void qc.invalidateQueries({ queryKey: ["mural"] });
  }

  return (
    <div className="px-5 pb-8 pt-6">
      <Link to="/app/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Início
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold">👏 Mural dos Campeões</h1>
      <p className="text-sm text-muted-foreground">Fotos validadas pelos colegas. Aplauda quem está mandando bem!</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(itens ?? []).map((it) => (
          <article key={it.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            {it.url_pub ? (
              <img src={it.url_pub} alt={it.desafio?.titulo ?? "Desafio"} className="aspect-square w-full object-cover" loading="lazy" />
            ) : <div className="aspect-square w-full bg-muted" />}
            <div className="p-2">
              <p className="truncate text-xs font-bold">{it.profiles?.nome?.split(" ")[0] ?? "Colega"}</p>
              <p className="truncate text-[10px] text-muted-foreground">{it.desafio?.titulo}</p>
              <button onClick={() => aplaudir(it)}
                className={`mt-2 flex w-full items-center justify-center gap-1 rounded-xl py-1.5 text-xs font-bold transition ${
                  it.aplaudido ? "bg-accent text-accent-foreground" : "bg-muted text-foreground hover:bg-accent/30"
                }`}>
                <Hand className="h-3.5 w-3.5" />
                {it.aplausos}
              </button>
            </div>
          </article>
        ))}
        {(itens ?? []).length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Ainda não há fotos validadas. Seja o primeiro a brilhar!
          </div>
        )}
      </div>
    </div>
  );
}
