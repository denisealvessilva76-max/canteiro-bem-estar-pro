import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/desafios")({
  component: AdminDesafios,
});

function AdminDesafios() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ titulo: '', descricao: '', meta: '', duracao_dias: 7, pontos_recompensa: 50 });

  const { data: desafios } = useQuery({
    queryKey: ['admin-desafios'],
    queryFn: async () => (await supabase.from('desafios').select('*').order('created_at', { ascending: false })).data ?? [],
  });
  const { data: pendentes } = useQuery({
    queryKey: ['admin-fotos-pendentes'],
    queryFn: async () => (await supabase.from('progresso_desafios')
      .select('*, profiles(nome, matricula), desafios(titulo)')
      .not('foto_url', 'is', null).is('foto_validada', null)).data ?? [],
  });

  async function criar() {
    if (!form.titulo || !form.meta) { toast.error('Preencha título e meta'); return; }
    await supabase.from('desafios').insert(form);
    setForm({ titulo: '', descricao: '', meta: '', duracao_dias: 7, pontos_recompensa: 50 });
    toast.success('Desafio criado');
    void qc.invalidateQueries({ queryKey: ['admin-desafios'] });
  }

  async function validar(id: string, ok: boolean) {
    await supabase.from('progresso_desafios').update({
      foto_validada: ok, status: ok ? 'concluido' : 'em_andamento', concluido_em: ok ? new Date().toISOString() : null,
    }).eq('id', id);
    toast.success(ok ? 'Foto validada' : 'Foto recusada');
    void qc.invalidateQueries({ queryKey: ['admin-fotos-pendentes'] });
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Desafios</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Novo desafio</h2>
          <div className="mt-4 space-y-3">
            <Input label="Título" value={form.titulo} onChange={(v) => setForm({ ...form, titulo: v })} />
            <Input label="Descrição" value={form.descricao} onChange={(v) => setForm({ ...form, descricao: v })} />
            <Input label="Meta" value={form.meta} onChange={(v) => setForm({ ...form, meta: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Duração (dias)" type="number" value={String(form.duracao_dias)} onChange={(v) => setForm({ ...form, duracao_dias: +v })} />
              <Input label="Pontos" type="number" value={String(form.pontos_recompensa)} onChange={(v) => setForm({ ...form, pontos_recompensa: +v })} />
            </div>
            <button onClick={criar} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground">
              <Plus className="h-4 w-4" /> Criar
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Validar fotos ({pendentes?.length ?? 0})</h2>
          <div className="mt-4 space-y-3">
            {(pendentes ?? []).map((p) => (
              <div key={p.id} className="rounded-xl border border-border p-3">
                <p className="text-sm font-bold">{(p as { profiles: { nome: string } | null }).profiles?.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {(p as { desafios: { titulo: string } | null }).desafios?.titulo} · 📸 enviada
                </p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => validar(p.id, true)} className="flex h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-success text-xs font-bold text-success-foreground">
                    <Check className="h-3 w-3" /> Validar
                  </button>
                  <button onClick={() => validar(p.id, false)} className="flex h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-destructive text-xs font-bold text-destructive-foreground">
                    <X className="h-3 w-3" /> Recusar
                  </button>
                </div>
              </div>
            ))}
            {pendentes?.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma foto pendente</p>}
          </div>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-bold">Desafios cadastrados</h2>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        {(desafios ?? []).map((d) => (
          <div key={d.id} className="rounded-2xl border border-border bg-card p-4">
            <h3 className="font-bold">{d.titulo}</h3>
            <p className="text-xs text-muted-foreground">{d.meta} · {d.duracao_dias}d · {d.pontos_recompensa}pts</p>
            <button
              onClick={() => supabase.from('desafios').update({ ativo: !d.ativo }).eq('id', d.id).then(() => qc.invalidateQueries({ queryKey: ['admin-desafios'] }))}
              className="mt-2 text-xs font-bold text-primary"
            >{d.ativo ? 'Desativar' : 'Ativar'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
    </label>
  );
}
