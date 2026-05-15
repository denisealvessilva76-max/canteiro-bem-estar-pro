import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Trophy, Camera, Check, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/desafios")({
  component: Desafios,
});

function Desafios() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const { data: desafios } = useQuery({
    queryKey: ['desafios'],
    queryFn: async () => {
      const { data } = await supabase.from('desafios').select('*').eq('ativo', true);
      return data ?? [];
    },
  });

  const { data: meus } = useQuery({
    queryKey: ['meus-desafios', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from('progresso_desafios').select('*').eq('user_id', user!.id);
      return data ?? [];
    },
  });

  async function aceitar(desafioId: string) {
    if (!user) return;
    await supabase.from('progresso_desafios').insert({ user_id: user.id, desafio_id: desafioId });
    toast.success('Desafio aceito! Boa sorte 💪');
    void qc.invalidateQueries({ queryKey: ['meus-desafios'] });
  }

  async function uploadFoto(progressoId: string, file: File) {
    if (!user) return;
    setUploadingFor(progressoId);
    const path = `${user.id}/${progressoId}-${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage.from('desafios-fotos').upload(path, file);
    if (upErr) { toast.error('Erro no upload'); setUploadingFor(null); return; }
    await supabase.from('progresso_desafios').update({ foto_url: path }).eq('id', progressoId);
    toast.success('Foto enviada! Aguarde validação');
    void qc.invalidateQueries({ queryKey: ['meus-desafios'] });
    setUploadingFor(null);
  }

  return (
    <div className="px-5 pb-8 pt-6">
      <Link to="/app/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Início
      </Link>
      <h1 className="mt-3 flex items-center gap-2 text-2xl font-extrabold">
        <Trophy className="h-7 w-7 text-accent" /> Desafios
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Aceite, complete, ganhe pontos extras.</p>

      <div className="mt-6 space-y-3">
        {(desafios ?? []).map((d) => {
          const meu = meus?.find((m) => m.desafio_id === d.id);
          const status = meu?.status ?? 'disponivel';
          return (
            <div key={d.id} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-bold">{d.titulo}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{d.descricao}</p>
                </div>
                <span className="rounded-full bg-accent/15 px-2 py-1 text-xs font-bold text-accent">+{d.pontos_recompensa}</span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>🎯 {d.meta}</span>
                <span>· {d.duracao_dias} dias</span>
              </div>

              {status === 'disponivel' && (
                <button
                  onClick={() => aceitar(d.id)}
                  className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-primary font-bold text-primary-foreground"
                >
                  Aceitar desafio
                </button>
              )}
              {status === 'em_andamento' && meu && (
                <div className="mt-4 space-y-2">
                  <p className="flex items-center gap-1 text-xs text-info">
                    <Clock className="h-3 w-3" /> Em andamento desde {new Date(meu.iniciado_em).toLocaleDateString('pt-BR')}
                  </p>
                  <label className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-accent bg-accent-soft font-bold text-accent">
                    <Camera className="h-5 w-5" />
                    {meu.foto_url ? 'Trocar foto' : 'Enviar foto comprovação'}
                    <input
                      type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={(e) => e.target.files?.[0] && uploadFoto(meu.id, e.target.files[0])}
                      disabled={uploadingFor === meu.id}
                    />
                  </label>
                  {meu.foto_url && (
                    <p className="text-center text-xs text-muted-foreground">
                      {meu.foto_validada === null ? '📸 Aguardando validação' : meu.foto_validada ? '✅ Validada' : '❌ Recusada'}
                    </p>
                  )}
                </div>
              )}
              {status === 'concluido' && (
                <div className="mt-4 flex items-center gap-2 rounded-2xl bg-success/10 p-3 text-sm font-bold text-success">
                  <Check className="h-5 w-5" /> Concluído!
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link to="/app/ranking" className="rounded-2xl border border-border bg-card p-4 text-center">
          <div className="text-2xl">🏆</div>
          <p className="mt-1 text-sm font-bold">Ranking</p>
        </Link>
        <Link to="/app/recompensas" className="rounded-2xl border border-border bg-card p-4 text-center">
          <div className="text-2xl">🎁</div>
          <p className="mt-1 text-sm font-bold">Recompensas</p>
        </Link>
      </div>
    </div>
  );
}
