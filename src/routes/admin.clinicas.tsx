import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/clinicas")({
  component: AdminClinicas,
});

const TIPOS = ['ubs', 'mulher', 'odonto', 'clinica'] as const;

function AdminClinicas() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ nome: '', tipo: 'ubs', endereco: '', telefone: '', cidade: 'Canaã dos Carajás', observacoes: '' });

  const { data: lista } = useQuery({
    queryKey: ['admin-clinicas'],
    queryFn: async () => {
      const { data } = await supabase.from('ubs_clinicas').select('*').order('tipo').order('nome');
      return data ?? [];
    },
  });

  async function salvar() {
    if (!form.nome.trim()) { toast.error('Nome obrigatório'); return; }
    const { error } = await supabase.from('ubs_clinicas').insert({ ...form, ativo: true });
    if (error) { toast.error(error.message); return; }
    toast.success('Clínica adicionada');
    setForm({ nome: '', tipo: 'ubs', endereco: '', telefone: '', cidade: 'Canaã dos Carajás', observacoes: '' });
    void qc.invalidateQueries({ queryKey: ['admin-clinicas'] });
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta clínica?')) return;
    const { error } = await supabase.from('ubs_clinicas').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    void qc.invalidateQueries({ queryKey: ['admin-clinicas'] });
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from('ubs_clinicas').update({ ativo: !ativo }).eq('id', id);
    void qc.invalidateQueries({ queryKey: ['admin-clinicas'] });
  }

  return (
    <div className="px-5 pb-8 pt-5">
      <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold">Clínicas e UBS</h1>
      <p className="text-sm text-muted-foreground">Cadastre locais de atendimento (gratuitos ou pelo plano).</p>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-bold">Nova clínica</p>
        <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome"
          className="mt-2 w-full rounded-xl border border-input bg-background p-2 text-sm" />
        <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          className="mt-2 w-full rounded-xl border border-input bg-background p-2 text-sm">
          {TIPOS.map((t) => <option key={t} value={t}>{t === 'ubs' ? 'UBS' : t === 'mulher' ? 'Saúde da Mulher' : t === 'odonto' ? 'Odontologia' : 'Clínica geral'}</option>)}
        </select>
        <input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Endereço"
          className="mt-2 w-full rounded-xl border border-input bg-background p-2 text-sm" />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} placeholder="Cidade"
            className="rounded-xl border border-input bg-background p-2 text-sm" />
          <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="Telefone"
            className="rounded-xl border border-input bg-background p-2 text-sm" />
        </div>
        <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Observações (horários, especialidades...)" rows={2}
          className="mt-2 w-full rounded-xl border border-input bg-background p-2 text-sm" />
        <button onClick={() => void salvar()} className="mt-3 flex h-11 w-full items-center justify-center gap-1 rounded-2xl bg-gradient-primary font-bold text-primary-foreground">
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>

      <h2 className="mt-6 text-sm font-bold">Cadastradas ({lista?.length ?? 0})</h2>
      <ul className="mt-2 space-y-2">
        {(lista ?? []).map((c) => (
          <li key={c.id} className="rounded-2xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-bold">{c.nome} <span className="text-xs font-normal text-muted-foreground">· {c.tipo}</span></p>
                {c.endereco && <p className="text-xs text-muted-foreground">{c.endereco}</p>}
                {c.telefone && <p className="text-xs text-muted-foreground">📞 {c.telefone}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => void toggleAtivo(c.id, c.ativo)} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${c.ativo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {c.ativo ? 'Ativo' : 'Inativo'}
                </button>
                <button onClick={() => void excluir(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
