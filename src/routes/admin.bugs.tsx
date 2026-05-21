import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/bugs")({
  component: AdminBugs,
});

function AdminBugs() {
  const qc = useQueryClient();
  const { data: lista } = useQuery({
    queryKey: ['admin-bugs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('reportes_bug')
        .select('id, descricao, rota, status, created_at, user_agent, user_id')
        .order('created_at', { ascending: false });
      if (!data) return [];
      const ids = Array.from(new Set(data.map((r) => r.user_id)));
      const { data: profs } = await supabase.from('profiles').select('id, nome, matricula').in('id', ids);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      return data.map((r) => ({ ...r, profile: map.get(r.user_id) }));
    },
    refetchInterval: 15000,
  });

  async function marcar(id: string, status: string) {
    await supabase.from('reportes_bug').update({ status, resolvido_em: status === 'resolvido' ? new Date().toISOString() : null }).eq('id', id);
    void qc.invalidateQueries({ queryKey: ['admin-bugs'] });
  }

  async function excluir(id: string) {
    if (!confirm('Excluir reporte?')) return;
    const { error } = await supabase.from('reportes_bug').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    void qc.invalidateQueries({ queryKey: ['admin-bugs'] });
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Reportes de bug</h1>
      <p className="text-sm text-muted-foreground">Problemas reportados pelos trabalhadores.</p>
      <ul className="mt-4 space-y-2">
        {(lista ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum reporte ainda.</p>}
        {(lista ?? []).map((r) => (
          <li key={r.id} className={`rounded-2xl border p-3 ${r.status === 'resolvido' ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString('pt-BR')} · {r.profile?.nome ?? 'Usuário'} (mat. {r.profile?.matricula ?? '—'})</p>
                <p className="mt-1 text-sm">{r.descricao}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">Rota: {r.rota} · Status: <strong>{r.status}</strong></p>
              </div>
              <div className="flex flex-col gap-1">
                {r.status !== 'resolvido' && (
                  <button onClick={() => void marcar(r.id, 'resolvido')} className="rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground"><Check className="h-3 w-3" /></button>
                )}
                <button onClick={() => void excluir(r.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
