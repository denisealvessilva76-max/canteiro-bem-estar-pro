import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Image as ImageIcon, X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/avisos")({
  component: AdminAvisos,
});

const CATS = ['informativo', 'saude', 'lembrete', 'urgente'] as const;

function AdminAvisos() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ titulo: '', conteudo: '', categoria: 'informativo' as typeof CATS[number], imagem_url: '' as string | '' });
  const [enviando, setEnviando] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const { data } = useQuery({
    queryKey: ['admin-avisos'],
    queryFn: async () => (await supabase.from('avisos').select('*').order('created_at', { ascending: false })).data ?? [],
  });

  async function escolherImagem(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande (máx 5MB)'); return; }
    setEnviando(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('avisos-imagens').upload(path, file, { contentType: file.type, upsert: false });
    setEnviando(false);
    if (upErr) { toast.error('Falha ao enviar imagem'); return; }
    const { data: pub } = supabase.storage.from('avisos-imagens').getPublicUrl(path);
    setForm((f) => ({ ...f, imagem_url: pub.publicUrl }));
    toast.success('Imagem anexada');
  }

  async function publicar() {
    if (!form.titulo || !form.conteudo) { toast.error('Preencha título e conteúdo'); return; }
    const payload = { titulo: form.titulo, conteudo: form.conteudo, categoria: form.categoria, imagem_url: form.imagem_url || null };
    await supabase.from('avisos').insert(payload);
    setForm({ titulo: '', conteudo: '', categoria: 'informativo', imagem_url: '' });
    if (fileRef.current) fileRef.current.value = '';
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

            {/* Imagem opcional */}
            <div className="rounded-xl border border-dashed border-border p-3">
              {form.imagem_url ? (
                <div className="relative">
                  <img src={form.imagem_url} alt="Pré-visualização" className="max-h-56 w-full rounded-lg object-contain" />
                  <button onClick={() => setForm({ ...form, imagem_url: '' })}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-2 py-6 text-sm font-semibold text-muted-foreground">
                  {enviando ? <Upload className="h-5 w-5 animate-pulse" /> : <ImageIcon className="h-5 w-5" />}
                  {enviando ? 'Enviando imagem...' : 'Anexar imagem (opcional, máx 5MB)'}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void escolherImagem(f); }} />
                </label>
              )}
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
                <div className="flex gap-3">
                  {(a as { imagem_url: string | null }).imagem_url && (
                    <img src={(a as { imagem_url: string }).imagem_url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                  )}
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground">{a.categoria}</p>
                    <p className="font-semibold">{a.titulo}</p>
                    <p className="text-xs text-muted-foreground">{a.conteudo.slice(0, 80)}</p>
                  </div>
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
