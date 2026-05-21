import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Check, X, ImageOff, MapPin } from "lucide-react";
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

  // Fotos pendentes: check-ins diários COM foto e SEM validação ainda
  const { data: pendentes } = useQuery({
    queryKey: ['admin-fotos-pendentes'],
    queryFn: async () => (await supabase.from('desafio_checkins')
      .select('*, profiles(nome, matricula), desafios(titulo)')
      .not('foto_url', 'is', null).is('validado', null)
      .order('created_at', { ascending: false })).data ?? [],
  });

  async function criar() {
    if (!form.titulo || !form.meta) { toast.error('Preencha título e meta'); return; }
    await supabase.from('desafios').insert(form);
    setForm({ titulo: '', descricao: '', meta: '', duracao_dias: 7, pontos_recompensa: 50 });
    toast.success('Desafio criado');
    void qc.invalidateQueries({ queryKey: ['admin-desafios'] });
  }

  async function validar(id: string, ok: boolean) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('desafio_checkins').update({
      validado: ok,
      validado_em: new Date().toISOString(),
      validado_por: user?.id ?? null,
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
          <h2 className="text-lg font-bold">Validar fotos diárias ({pendentes?.length ?? 0})</h2>
          <p className="mt-1 text-xs text-muted-foreground">Cada check-in diário aparece aqui até ser aprovado ou rejeitado.</p>
          <div className="mt-4 space-y-4">
            {(pendentes ?? []).map((p) => (
              <PendingPhoto
                key={p.id}
                id={p.id}
                fotoPath={(p as { foto_url: string | null }).foto_url ?? ''}
                nome={(p as { profiles: { nome: string } | null }).profiles?.nome ?? '—'}
                matricula={(p as { profiles: { matricula: string } | null }).profiles?.matricula ?? ''}
                desafio={(p as { desafios: { titulo: string } | null }).desafios?.titulo ?? ''}
                data={(p as { data: string }).data}
                gpsLat={(p as { gps_lat: number | null }).gps_lat}
                gpsLng={(p as { gps_lng: number | null }).gps_lng}
                dificuldade={(p as { dificuldade: string | null }).dificuldade}
                onValidar={validar}
              />
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

function PendingPhoto({ id, fotoPath, nome, matricula, desafio, data, gpsLat, gpsLng, dificuldade, onValidar }: {
  id: string; fotoPath: string; nome: string; matricula: string; desafio: string;
  data: string; gpsLat: number | null; gpsLng: number | null; dificuldade: string | null;
  onValidar: (id: string, ok: boolean) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let cancel = false;
    if (!fotoPath) { setErro(true); return; }
    if (/^https?:\/\//.test(fotoPath)) { setUrl(fotoPath); return; }
    supabase.storage.from('desafios-fotos').createSignedUrl(fotoPath, 60 * 60).then(({ data, error }) => {
      if (cancel) return;
      if (error || !data?.signedUrl) setErro(true);
      else setUrl(data.signedUrl);
    });
    return () => { cancel = true; };
  }, [fotoPath]);

  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-sm font-bold">{nome} <span className="text-xs font-normal text-muted-foreground">· mat. {matricula}</span></p>
      <p className="text-xs text-muted-foreground">{desafio} · {new Date(data).toLocaleDateString('pt-BR')}</p>
      {dificuldade && <p className="mt-1 text-[11px] italic text-muted-foreground">"{dificuldade}"</p>}

      <div className="mt-2 overflow-hidden rounded-lg border border-border bg-muted/30">
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="block">
            <img src={url} alt={`Foto de ${nome}`} className="max-h-72 w-full object-contain" loading="lazy" />
          </a>
        ) : erro ? (
          <div className="flex h-32 flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
            <ImageOff className="h-5 w-5" /> Imagem indisponível
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">Carregando foto…</div>
        )}
      </div>

      {gpsLat && gpsLng && (
        <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
          <MapPin className="h-3 w-3" /> {gpsLat.toFixed(4)}, {gpsLng.toFixed(4)}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button onClick={() => onValidar(id, true)} className="flex h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-success text-xs font-bold text-success-foreground">
          <Check className="h-3 w-3" /> Validar
        </button>
        <button onClick={() => onValidar(id, false)} className="flex h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-destructive text-xs font-bold text-destructive-foreground">
          <X className="h-3 w-3" /> Recusar
        </button>
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
