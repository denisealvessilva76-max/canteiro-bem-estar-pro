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
  titulo: string;
  nome: string;
  avatar_url: string | null;
  aplausos: number;
  aplaudido: boolean;
  url_pub: string | null;
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
        .select("id, data, foto_url, desafio_id, user_id, created_at")
        .eq("validado", true)
        .not("foto_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(60);
      const lista = checks ?? [];
      const userIds = [...new Set(lista.map((c) => c.user_id))];
      const desIds = [...new Set(lista.map((c) => c.desafio_id))];
      const ids = lista.map((c) => c.id);
      const [{ data: profs }, { data: deses }, { data: aps }, urls] = await Promise.all([
        userIds.length > 0
          ? supabase.from("profiles").select("id, nome, avatar_url").in("id", userIds)
          : Promise.resolve({ data: [] as { id: string; nome: string; avatar_url: string | null }[] }),
        desIds.length > 0
          ? supabase.from("desafios").select("id, titulo").in("id", desIds)
          : Promise.resolve({ data: [] as { id: string; titulo: string }[] }),
        ids.length > 0
          ? supabase.from("mural_aplausos").select("desafio_checkin_id, user_id").in("desafio_checkin_id", ids)
          : Promise.resolve({ data: [] as { desafio_checkin_id: string; user_id: string }[] }),
        Promise.all(lista.map(async (c) => {
          if (!c.foto_url) return null;
          const { data } = await supabase.storage.from("desafios-fotos").createSignedUrl(c.foto_url, 60 * 60);
          return data?.signedUrl ?? null;
        })),
      ]);
      const pMap = new Map((profs ?? []).map((p) => [p.id, p]));
      const dMap = new Map((deses ?? []).map((d) => [d.id, d]));
      const apsList = aps ?? [];
      return lista.map((c, i) => {
        const meus = apsList.filter((a) => a.desafio_checkin_id === c.id);
        const prof = pMap.get(c.user_id);
        return {
          id: c.id, data: c.data, foto_url: c.foto_url, desafio_id: c.desafio_id, user_id: c.user_id,
          titulo: dMap.get(c.desafio_id)?.titulo ?? "Desafio",
          nome: prof?.nome ?? "Colega",
          avatar_url: prof?.avatar_url ?? null,
          aplausos: meus.length,
          aplaudido: meus.some((a) => a.user_id === user?.id),
          url_pub: urls[i],
        };
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
      <p className="text-sm text-muted-foreground">Fotos validadas. Aplauda quem está mandando bem!</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(itens ?? []).map((it) => (
          <article key={it.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            {it.url_pub ? (
              <img src={it.url_pub} alt={it.titulo} className="aspect-square w-full object-cover" loading="lazy" />
            ) : <div className="aspect-square w-full bg-muted" />}
            <div className="p-2">
              <p className="truncate text-xs font-bold">{it.nome.split(" ")[0]}</p>
              <p className="truncate text-[10px] text-muted-foreground">{it.titulo}</p>
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
