import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/avisos")({
  component: AdminAvisos,
});

const CATS = ['informativo', 'saude', 'lembrete', 'urgente'] as const;

function AdminAvisos() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ titulo: '', conteudo: '', categoria: 'informativo' as typeof CATS[number] });

  const { data } = useQuery({
    queryKey: ['admin-avisos'],
    queryFn: async () => (await supabase.from('avisos').select('*').order('created_at', { ascending: false })).data ?? [],
  });

  async function publicar() {
    if (!form.titulo || !form.conteudo) { toast.error('Preencha título e conteúdo'); return; }
    await supabase.from('avisos').insert(form);
    setForm({ titulo: '', conteudo: '', categoria: 'informativo' });
    toast.success('Aviso publicado');
    void qc.invalidateQueries({ queryKey: ['admin-avisos'] });
  }

  async function excluir(id: string) {
    await supabase.from('avisos').delete().eq('id', id);
    void qc.invalidateQueries({ queryKey: ['admin-avisos'] });
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Avisos</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Novo aviso</h2>
          <div className="mt-4 space-y-3">
            <input placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:border-primary" />
            <textarea placeholder="Conteúdo" value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} rows={4}
              className="w-full rounded-xl border border-input bg-background p-3 outline-none focus:border-primary" />
            <div className="flex flex-wrap gap-2">
              {CATS.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, categoria: c })}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
                    form.categoria === c ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'
                  }`}>{c}</button>
              ))}
            </div>
            <button onClick={publicar} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground">
              <Plus className="h-4 w-4" /> Publicar
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold">Publicados</h2>
          <ul className="mt-3 space-y-2">
            {(data ?? []).map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-2 rounded-xl border border-border bg-card p-3">
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">{a.categoria}</p>
                  <p className="font-semibold">{a.titulo}</p>
                  <p className="text-xs text-muted-foreground">{a.conteudo.slice(0, 80)}</p>
                </div>
                <button onClick={() => excluir(a.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
