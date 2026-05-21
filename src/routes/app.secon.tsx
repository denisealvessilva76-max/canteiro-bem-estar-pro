import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Phone, Camera, AlertTriangle, MapPin, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { capturarMeta } from '@/lib/camera';

export const Route = createFileRoute('/app/secon')({
  component: Secon,
});

const TEL = '08002850193';

function Secon() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [enviando, setEnviando] = useState<string | null>(null);

  const { data: chamados } = useQuery({
    queryKey: ['secon', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from('secon_chamados').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const pendentes = (chamados ?? []).filter((c) => c.status === 'pendente');

  async function acionar() {
    if (!user) return;
    const meta = await capturarMeta();
    const { error } = await supabase.from('secon_chamados').insert({
      user_id: user.id,
      telefone_discado: TEL,
      ...meta,
    });
    if (error) { toast.error(error.message); return; }
    void qc.invalidateQueries({ queryKey: ['secon'] });
    // Abre o discador
    window.location.href = `tel:${TEL}`;
  }

  async function enviarComprovante(id: string, file: File) {
    if (!user) return;
    setEnviando(id);
    const meta = await capturarMeta();
    const path = `${user.id}/${id}-${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage.from('desafios-fotos').upload(path, file);
    if (upErr) { toast.error(upErr.message); setEnviando(null); return; }
    const { error } = await supabase.from('secon_chamados').update({
      comprovante_url: path,
      status: 'comprovado',
      comprovado_em: new Date().toISOString(),
      gps_lat: meta.gps_lat,
      gps_lng: meta.gps_lng,
      gps_capturado_em: meta.gps_capturado_em,
    }).eq('id', id);
    setEnviando(null);
    if (error) { toast.error(error.message); return; }
    toast.success('Comprovante enviado!');
    void qc.invalidateQueries({ queryKey: ['secon'] });
  }

  return (
    <div className="px-5 pb-20 pt-5">
      <Link to="/app/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="mt-3 rounded-3xl bg-gradient-to-br from-red-600 to-rose-500 p-5 text-white shadow-elevated">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold"><AlertTriangle className="h-7 w-7" /> Estou no Secon</h1>
        <p className="mt-1 text-sm opacity-90">Acionamento médico fora do canteiro (alojamento/urgência).</p>
      </div>

      <button
        onClick={() => void acionar()}
        className="mt-5 flex h-20 w-full items-center justify-center gap-3 rounded-3xl bg-red-600 text-lg font-extrabold text-white shadow-elevated active:scale-[0.98]"
      >
        <Phone className="h-7 w-7" /> Ligar 0800 285 0193
      </button>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Ao ligar, gravamos sua localização e geramos um pedido de comprovação obrigatória abaixo.
      </p>

      {pendentes.length > 0 && (
        <div className="mt-6 rounded-2xl border-2 border-warning bg-warning/5 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-warning">
            <AlertTriangle className="h-4 w-4" /> {pendentes.length} comprovação{pendentes.length > 1 ? 'ões' : ''} pendente{pendentes.length > 1 ? 's' : ''}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Fotografe o comprovante de atendimento usando a câmera do celular.
          </p>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {(chamados ?? []).map((c) => (
          <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString('pt-BR')}</p>
                <p className="mt-1 text-sm font-bold">
                  Acionamento Secon
                </p>
                {c.gps_lat && c.gps_lng && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {c.gps_lat.toFixed(4)}, {c.gps_lng.toFixed(4)}
                  </p>
                )}
              </div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${c.status === 'comprovado' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
                {c.status === 'comprovado' ? '✅ Comprovado' : '⏳ Pendente'}
              </span>
            </div>
            {c.status === 'pendente' && (
              <label className="mt-3 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-accent bg-accent-soft text-sm font-bold text-accent">
                <Camera className="h-5 w-5" />
                {enviando === c.id ? 'Enviando...' : 'Fotografar comprovante'}
                <input
                  type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={(e) => e.target.files?.[0] && enviarComprovante(c.id, e.target.files[0])}
                  disabled={enviando === c.id}
                />
              </label>
            )}
            {c.status === 'comprovado' && (
              <p className="mt-3 flex items-center gap-1 text-xs font-bold text-success">
                <Check className="h-4 w-4" /> Comprovado em {c.comprovado_em ? new Date(c.comprovado_em).toLocaleString('pt-BR') : '—'}
              </p>
            )}
          </div>
        ))}
        {(chamados ?? []).length === 0 && (
          <p className="text-center text-xs text-muted-foreground">Nenhum acionamento ainda.</p>
        )}
      </div>
    </div>
  );
}
