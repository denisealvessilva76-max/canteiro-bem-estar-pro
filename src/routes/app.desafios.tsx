import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Trophy, Camera, Check, Clock, CalendarCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/canteiro";
import { capturarMeta } from "@/lib/camera";

export const Route = createFileRoute("/app/desafios")({
  component: Desafios,
});

function Desafios() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: desafios } = useQuery({
    queryKey: ['desafios'],
    queryFn: async () => (await supabase.from('desafios').select('*').eq('ativo', true)).data ?? [],
  });

  const { data: meus } = useQuery({
    queryKey: ['meus-desafios', user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await supabase.from('progresso_desafios').select('*').eq('user_id', user!.id)).data ?? [],
  });

  const { data: checkins } = useQuery({
    queryKey: ['meus-desafio-checkins', user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await supabase.from('desafio_checkins').select('*').eq('user_id', user!.id)).data ?? [],
  });

  async function aceitar(desafioId: string) {
    if (!user) return;
    await supabase.from('progresso_desafios').insert({ user_id: user.id, desafio_id: desafioId });
    toast.success('Desafio aceito! Boa sorte 💪');
    void qc.invalidateQueries({ queryKey: ['meus-desafios'] });
  }

  return (
    <div className="px-5 pb-8 pt-6">
      <Link to="/app/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Início
      </Link>
      <h1 className="mt-3 flex items-center gap-2 text-2xl font-extrabold">
        <Trophy className="h-7 w-7 text-accent" /> Desafios
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Aceite, faça check-in todo dia com foto e ganhe pontos extras.
      </p>

      <div className="mt-6 space-y-3">
        {(desafios ?? []).map((d) => {
          const meu = meus?.find((m) => m.desafio_id === d.id);
          const status = meu?.status ?? 'disponivel';
          const checksDoDesafio = (checkins ?? []).filter((c) => c.desafio_id === d.id);
          return (
            <DesafioCard
              key={d.id}
              desafio={d}
              meu={meu}
              status={status}
              checks={checksDoDesafio}
              onAceitar={() => aceitar(d.id)}
              onChange={() => {
                void qc.invalidateQueries({ queryKey: ['meus-desafios'] });
                void qc.invalidateQueries({ queryKey: ['meus-desafio-checkins'] });
              }}
            />
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

type DesafioRow = { id: string; titulo: string; descricao: string | null; meta: string; duracao_dias: number; pontos_recompensa: number };
type ProgressoRow = { id: string; desafio_id: string; status: string; iniciado_em: string };
type CheckinRow = { id: string; desafio_id: string; progresso_id: string; data: string; foto_url: string | null; dificuldade: string | null; validado: boolean | null; motivo_recusa?: string | null };

function DesafioCard({ desafio: d, meu, status, checks, onAceitar, onChange }: {
  desafio: DesafioRow;
  meu: ProgressoRow | undefined;
  status: string;
  checks: CheckinRow[];
  onAceitar: () => void;
  onChange: () => void;
}) {
  const { user } = useAuth();
  const today = todayISO();
  const checkHoje = checks.find((c) => c.data === today);
  const [dificuldade, setDificuldade] = useState(checkHoje?.dificuldade ?? '');
  const [uploading, setUploading] = useState(false);

  async function fazerCheckin(file: File) {
    if (!user || !meu) return;
    setUploading(true);
    const meta = await capturarMeta();
    const path = `${user.id}/${meu.id}/${today}-${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage.from('desafios-fotos').upload(path, file);
    if (upErr) { toast.error('Erro no upload'); setUploading(false); return; }

    if (checkHoje) {
      await supabase.from('desafio_checkins').update({
        foto_url: path, dificuldade: dificuldade || null,
        gps_lat: meta.gps_lat, gps_lng: meta.gps_lng, gps_capturado_em: meta.gps_capturado_em,
      }).eq('id', checkHoje.id);
    } else {
      await supabase.from('desafio_checkins').insert({
        user_id: user.id, desafio_id: d.id, progresso_id: meu.id, data: today,
        foto_url: path, dificuldade: dificuldade || null,
        gps_lat: meta.gps_lat, gps_lng: meta.gps_lng, gps_capturado_em: meta.gps_capturado_em,
      });
    }
    // se atingiu duração: marca concluído
    const totalDias = checks.filter((c) => c.data !== today).length + 1;
    if (totalDias >= d.duracao_dias) {
      await supabase.from('progresso_desafios').update({ status: 'concluido', concluido_em: new Date().toISOString() }).eq('id', meu.id);
    }
    setUploading(false);
    toast.success('Check-in do dia registrado! 📸');
    onChange();
  }

  async function salvarDificuldade() {
    if (!checkHoje) { toast.error('Faça check-in com a foto primeiro'); return; }
    await supabase.from('desafio_checkins').update({ dificuldade: dificuldade || null }).eq('id', checkHoje.id);
    toast.success('Observação salva');
    onChange();
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
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
        <button onClick={onAceitar} className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-primary font-bold text-primary-foreground">
          Aceitar desafio
        </button>
      )}

      {status === 'em_andamento' && meu && (
        <div className="mt-4 space-y-3">
          <p className="flex items-center gap-1 text-xs text-info">
            <Clock className="h-3 w-3" /> Em andamento desde {new Date(meu.iniciado_em).toLocaleDateString('pt-BR')}
          </p>

          {/* Calendário simples */}
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: d.duracao_dias }).map((_, i) => {
              const c = checks[i];
              return (
                <div
                  key={i}
                  className={`flex h-7 w-7 items-center justify-center rounded-md border text-[10px] font-bold ${
                    c ? (c.validado === false ? 'border-destructive bg-destructive/10 text-destructive' :
                         c.validado ? 'border-success bg-success/15 text-success' :
                         'border-accent bg-accent/15 text-accent') : 'border-border text-muted-foreground'
                  }`}
                  title={c ? `Dia ${i+1}: ${c.data}` : `Dia ${i+1}`}
                >
                  {c ? '✓' : i + 1}
                </div>
              );
            })}
          </div>

          {checkHoje?.foto_url ? (
            <div className="rounded-xl bg-success/10 p-3 text-center text-xs font-bold text-success">
              <CalendarCheck className="mr-1 inline h-3 w-3" /> Check-in de hoje feito ({checks.length}/{d.duracao_dias} dias)
              <div className="mt-1 text-[10px] font-normal text-success/80">
                {checkHoje.validado === null ? 'Aguardando validação da foto pelo admin.' :
                 checkHoje.validado ? '✅ Foto validada!' : '❌ Foto rejeitada — refaça amanhã.'}
              </div>
              {checkHoje.validado === false && checkHoje.motivo_recusa && (
                <div className="mt-2 rounded-lg bg-destructive/10 p-2 text-left text-[11px] font-normal text-destructive">
                  <strong>Motivo da recusa:</strong> {checkHoje.motivo_recusa}
                </div>
              )}
              <div className="mt-1 text-[10px] font-normal text-muted-foreground">
                Volte amanhã para o próximo check-in.
              </div>
            </div>
          ) : (
            <label className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-accent bg-accent-soft font-bold text-accent">
              <Camera className="h-5 w-5" />
              {uploading ? 'Enviando…' : 'Check-in de hoje (foto)'}
              <input
                type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => e.target.files?.[0] && fazerCheckin(e.target.files[0])}
                disabled={uploading}
              />
            </label>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground">Teve alguma dificuldade hoje? (opcional)</label>
            <textarea
              value={dificuldade}
              onChange={(e) => setDificuldade(e.target.value)}
              rows={2}
              placeholder="Ex: doeu o joelho ao agachar, faltou tempo no almoço…"
              className="mt-1 w-full rounded-xl border border-input bg-background p-2 text-xs outline-none focus:border-primary"
            />
            {checkHoje && (
              <button onClick={salvarDificuldade} className="mt-1 text-xs font-bold text-primary">Salvar observação</button>
            )}
          </div>
        </div>
      )}

      {status === 'concluido' && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-success/10 p-3 text-sm font-bold text-success">
          <Check className="h-5 w-5" /> Desafio concluído! Aguarde validação para ganhar pontos.
        </div>
      )}
    </div>
  );
}
