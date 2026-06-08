import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/squads")({
  component: Squads,
});

function Squads() {
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("#3B82F6");

  const { data: squads } = useQuery({
    queryKey: ["admin-squads"],
    queryFn: async () => (await supabase.from("squads").select("*").order("nome")).data ?? [],
  });

  const { data: profs } = useQuery({
    queryKey: ["admin-squads-profs"],
    queryFn: async () => (await supabase.from("profiles")
      .select("id, nome, matricula, squad_id, pontos_acumulados").order("nome")).data ?? [],
  });

  async function criar() {
    if (!nome.trim()) return;
    const { error } = await supabase.from("squads").insert({ nome: nome.trim(), cor });
    if (error) { toast.error(error.message); return; }
    setNome(""); toast.success("Squad criada");
    void qc.invalidateQueries({ queryKey: ["admin-squads"] });
  }

  async function remover(id: string) {
    if (!confirm("Excluir squad?")) return;
    const { error } = await supabase.from("squads").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    void qc.invalidateQueries({ queryKey: ["admin-squads"] });
    void qc.invalidateQueries({ queryKey: ["admin-squads-profs"] });
  }

  async function atribuir(userId: string, squadId: string | null) {
    const { error } = await supabase.from("profiles").update({ squad_id: squadId }).eq("id", userId);
    if (error) { toast.error(error.message); return; }
    void qc.invalidateQueries({ queryKey: ["admin-squads-profs"] });
  }

  return (
    <div>
      <h1 className="flex items-center gap-2 text-3xl font-extrabold"><Users className="h-7 w-7" /> Squads</h1>
      <p className="text-sm text-muted-foreground">Equipes internas. Ranking calculado pela média de pontos por integrante.</p>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-bold text-muted-foreground">Nome da squad</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Pintores Bloco A"
            className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground">Cor</label>
          <input type="color" value={cor} onChange={(e) => setCor(e.target.value)}
            className="mt-1 h-10 w-16 rounded-xl border border-input bg-background" />
        </div>
        <button onClick={criar} className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">
          <Plus className="h-4 w-4" /> Criar
        </button>
      </div>

      <h2 className="mt-8 text-lg font-bold">Squads ({squads?.length ?? 0})</h2>
      <ul className="mt-3 space-y-2">
        {(squads ?? []).map((s) => (
          <li key={s.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <span className="h-6 w-6 rounded-full" style={{ background: s.cor }} />
            <span className="flex-1 font-bold">{s.nome}</span>
            <button onClick={() => remover(s.id)} className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
        {(squads ?? []).length === 0 && (
          <li className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhuma squad cadastrada</li>
        )}
      </ul>

      <h2 className="mt-8 text-lg font-bold">Atribuir trabalhadores</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs font-bold uppercase text-muted-foreground">
            <tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Matrícula</th>
              <th className="px-4 py-3">Pontos</th><th className="px-4 py-3">Squad</th></tr>
          </thead>
          <tbody>
            {(profs ?? []).map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 font-semibold">{p.nome}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.matricula}</td>
                <td className="px-4 py-3 font-bold text-primary">{p.pontos_acumulados}</td>
                <td className="px-4 py-3">
                  <select
                    value={p.squad_id ?? ""}
                    onChange={(e) => atribuir(p.id, e.target.value || null)}
                    className="h-9 rounded-lg border border-input bg-background px-2 text-xs"
                  >
                    <option value="">— sem squad —</option>
                    {(squads ?? []).map((s) => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
