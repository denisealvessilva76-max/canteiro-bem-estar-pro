import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/recompensas")({
  component: AdminRecompensas,
});

function AdminRecompensas() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ titulo: '', descricao: '', custo_pontos: 100 });

  const { data: items } = useQuery({
    queryKey: ['admin-recompensas'],
    queryFn: async () => (await supabase.from('recompensas').select('*').order('custo_pontos')).data ?? [],
  });
  const { data: resgates } = useQuery({
    queryKey: ['admin-resgates'],
    queryFn: async () => (await supabase.from('resgates')
      .select('*, profiles(nome, matricula), recompensas(titulo)')
      .order('created_at', { ascending: false }).limit(50)).data ?? [],
  });

  async function criar() {
    if (!form.titulo) return;
    await supabase.from('recompensas').insert(form);
    setForm({ titulo: '', descricao: '', custo_pontos: 100 });
    toast.success('Recompensa adicionada');
    void qc.invalidateQueries({ queryKey: ['admin-recompensas'] });
  }

  async function atualizarStatus(id: string, status: string) {
    await supabase.from('resgates').update({ status }).eq('id', id);
    void qc.invalidateQueries({ queryKey: ['admin-resgates'] });
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Recompensas</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Nova recompensa</h2>
          <div className="mt-4 space-y-3">
            <input placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:border-primary" />
            <input placeholder="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:border-primary" />
            <input type="number" placeholder="Custo em pontos" value={form.custo_pontos}
              onChange={(e) => setForm({ ...form, custo_pontos: +e.target.value })}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:border-primary" />
            <button onClick={criar} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground">
              <Plus className="h-4 w-4" /> Adicionar
            </button>
          </div>

          <h3 className="mt-6 text-base font-bold">Catálogo</h3>
          <ul className="mt-3 space-y-2">
            {(items ?? []).map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                <span className="font-semibold">{r.titulo}</span>
                <span className="text-accent">{r.custo_pontos} pts</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Resgates pendentes</h2>
          <ul className="mt-4 space-y-2">
            {(resgates ?? []).map((r) => (
              <li key={r.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{(r as { profiles: { nome: string } | null }).profiles?.nome}</p>
                  <span className="text-xs text-muted-foreground">{r.status}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {(r as { recompensas: { titulo: string } | null }).recompensas?.titulo} · {r.pontos_gastos} pts
                </p>
                {r.status === 'solicitado' && (
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => atualizarStatus(r.id, 'entregue')}
                      className="flex-1 rounded-lg bg-success py-1 text-xs font-bold text-success-foreground">Entregue</button>
                    <button onClick={() => atualizarStatus(r.id, 'cancelado')}
                      className="flex-1 rounded-lg bg-destructive py-1 text-xs font-bold text-destructive-foreground">Cancelar</button>
                  </div>
                )}
              </li>
            ))}
            {resgates?.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Nenhum resgate</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
