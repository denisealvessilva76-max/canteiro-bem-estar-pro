import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, FileText, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/conteudo")({ component: AdminConteudo });

function AdminConteudo() {
  const [aba, setAba] = useState<'pilulas' | 'quiz'>('pilulas');

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Conteúdo</h1>
      <p className="mt-1 text-sm text-muted-foreground">Cadastre pílulas do dia e perguntas do quiz da obra.</p>

      <div className="mt-5 flex gap-2 border-b border-border">
        <Tab ativo={aba === 'pilulas'} onClick={() => setAba('pilulas')} icon={FileText} label="Pílulas do dia" />
        <Tab ativo={aba === 'quiz'} onClick={() => setAba('quiz')} icon={HelpCircle} label="Quiz da obra" />
      </div>

      <div className="mt-6">
        {aba === 'pilulas' ? <Pilulas /> : <Quiz />}
      </div>
    </div>
  );
}

function Tab({ ativo, onClick, icon: Icon, label }: { ativo: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-bold border-b-2 -mb-px ${ativo ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function Pilulas() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ titulo: '', descricao: '', categoria: 'saude', tipo: 'texto', media_url: '' });

  const { data } = useQuery({
    queryKey: ['admin-pilulas'],
    queryFn: async () => (await supabase.from('pilulas_dia').select('*').order('data_publicacao', { ascending: false })).data ?? [],
  });

  async function criar() {
    if (!form.titulo) { toast.error('Título é obrigatório'); return; }
    const { error } = await supabase.from('pilulas_dia').insert({
      titulo: form.titulo,
      descricao: form.descricao || null,
      categoria: form.categoria,
      tipo: form.tipo,
      media_url: form.media_url || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Pílula cadastrada');
    setForm({ titulo: '', descricao: '', categoria: 'saude', tipo: 'texto', media_url: '' });
    void qc.invalidateQueries({ queryKey: ['admin-pilulas'] });
  }

  async function excluir(id: string) {
    await supabase.from('pilulas_dia').delete().eq('id', id);
    void qc.invalidateQueries({ queryKey: ['admin-pilulas'] });
  }

  async function toggle(id: string, ativo: boolean) {
    await supabase.from('pilulas_dia').update({ ativo: !ativo }).eq('id', id);
    void qc.invalidateQueries({ queryKey: ['admin-pilulas'] });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold">Nova pílula</h2>
        <div className="mt-4 space-y-3">
          <input placeholder="Título (ex.: Beba água a cada hora)" value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="h-11 w-full rounded-xl border border-input bg-background px-3" />
          <textarea placeholder="Descrição curta (até 30s de leitura)" value={form.descricao} rows={3}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            className="w-full rounded-xl border border-input bg-background p-3" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className="h-11 rounded-xl border border-input bg-background px-3">
              <option value="saude">Saúde</option>
              <option value="seguranca">Segurança</option>
              <option value="mental">Mental</option>
              <option value="hidratacao">Hidratação</option>
              <option value="ergonomia">Ergonomia</option>
            </select>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="h-11 rounded-xl border border-input bg-background px-3">
              <option value="texto">Texto</option>
              <option value="video">Vídeo (URL)</option>
              <option value="audio">Áudio (URL)</option>
            </select>
          </div>
          {form.tipo !== 'texto' && (
            <input placeholder="URL da mídia" value={form.media_url}
              onChange={(e) => setForm({ ...form, media_url: e.target.value })}
              className="h-11 w-full rounded-xl border border-input bg-background px-3" />
          )}
          <button onClick={criar} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground">
            <Plus className="h-4 w-4" /> Publicar pílula
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold">Pílulas cadastradas</h2>
        <ul className="mt-4 space-y-2">
          {(data ?? []).map((p) => (
            <li key={p.id} className="rounded-xl border border-border p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{p.titulo}</p>
                  <p className="text-xs text-muted-foreground">{p.categoria} · {new Date(p.data_publicacao).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggle(p.id, p.ativo)} className="text-xs font-bold text-primary">
                    {p.ativo ? 'Pausar' : 'Ativar'}
                  </button>
                  <button onClick={() => excluir(p.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </li>
          ))}
          {data?.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">Nenhuma pílula ainda</p>}
        </ul>
      </div>
    </div>
  );
}

function Quiz() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    pergunta: '', categoria: 'epi',
    opcoes: ['', '', '', ''], correta: 0,
  });

  const { data } = useQuery({
    queryKey: ['admin-quiz-perguntas'],
    queryFn: async () => (await supabase.from('quiz_obra_perguntas').select('*').order('semana', { ascending: false })).data ?? [],
  });

  async function criar() {
    if (!form.pergunta.trim() || form.opcoes.some((o) => !o.trim())) {
      toast.error('Preencha pergunta e todas as 4 opções'); return;
    }
    const { error } = await supabase.from('quiz_obra_perguntas').insert({
      pergunta: form.pergunta,
      categoria: form.categoria,
      opcoes: form.opcoes,
      correta: form.correta,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Pergunta cadastrada');
    setForm({ pergunta: '', categoria: 'epi', opcoes: ['', '', '', ''], correta: 0 });
    void qc.invalidateQueries({ queryKey: ['admin-quiz-perguntas'] });
  }

  async function excluir(id: string) {
    await supabase.from('quiz_obra_perguntas').delete().eq('id', id);
    void qc.invalidateQueries({ queryKey: ['admin-quiz-perguntas'] });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold">Nova pergunta</h2>
        <div className="mt-4 space-y-3">
          <textarea placeholder="Pergunta" value={form.pergunta} rows={2}
            onChange={(e) => setForm({ ...form, pergunta: e.target.value })}
            className="w-full rounded-xl border border-input bg-background p-3" />
          <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="h-11 w-full rounded-xl border border-input bg-background px-3">
            <option value="epi">EPI</option>
            <option value="ergonomia">Ergonomia</option>
            <option value="primeiros_socorros">Primeiros socorros</option>
            <option value="hidratacao">Hidratação</option>
            <option value="saude_mental">Saúde mental</option>
          </select>
          {form.opcoes.map((op, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" checked={form.correta === i}
                onChange={() => setForm({ ...form, correta: i })}
                className="h-5 w-5 accent-primary" />
              <input placeholder={`Opção ${i + 1}`} value={op}
                onChange={(e) => {
                  const novas = [...form.opcoes]; novas[i] = e.target.value;
                  setForm({ ...form, opcoes: novas });
                }}
                className="h-11 flex-1 rounded-xl border border-input bg-background px-3" />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Marque a opção correta no rádio.</p>
          <button onClick={criar} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground">
            <Plus className="h-4 w-4" /> Cadastrar pergunta
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold">Perguntas cadastradas</h2>
        <ul className="mt-4 space-y-2">
          {(data ?? []).map((p) => (
            <li key={p.id} className="rounded-xl border border-border p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-bold">{p.pergunta}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.categoria} · resposta: {(p.opcoes as string[])[p.correta]}
                  </p>
                </div>
                <button onClick={() => excluir(p.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
          {data?.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">Nenhuma pergunta ainda</p>}
        </ul>
      </div>
    </div>
  );
}
