import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calcMetaHidratacao, todayISO, URINA_NIVEIS } from "@/lib/canteiro";
import { useClimaObra, boostHidratacaoMl, nivelCalor } from "@/lib/clima";
import { insertOrQueue } from "@/lib/offline";
import { podeRegistrar, marcarRegistro, formatFaltam } from "@/lib/rateLimit";

const COOLDOWN_MS = 45 * 60 * 1000;

export const Route = createFileRoute("/app/hidratacao")({
  component: Hidratacao,
});

const VOLUMES = [150, 250, 300, 1000];

function Hidratacao() {
  const { user, profile, refreshProfile } = useAuth();
  const qc = useQueryClient();
  const { data: clima } = useClimaObra();

  const boost = boostHidratacaoMl(clima?.temperatura);
  const meta = calcMetaHidratacao(profile?.peso, profile?.exposicao_sol, true, boost);
  const calor = nivelCalor(clima?.temperatura);

  const { data: logs } = useQuery({
    queryKey: ['hidratacao-hoje', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from('hidratacao_logs').select('*')
        .eq('user_id', user!.id).eq('data', todayISO()).order('created_at');
      return data ?? [];
    },
  });

  const totalMl = (logs ?? []).reduce((s, l) => s + l.ml_consumidos, 0);
  const pct = Math.min(100, (totalMl / meta) * 100);
  const copos = Math.round(totalMl / 250);

  async function adicionar(ml: number) {
    if (!user) return;
    const rl = podeRegistrar(`hidr:${user.id}`, COOLDOWN_MS);
    if (!rl.ok) {
      toast.error(`Aguarde ${formatFaltam(rl.faltamMs)} antes de registrar novamente.`, {
        description: 'O sistema bloqueia registros muito próximos para evitar duplicidades.',
      });
      return;
    }
    const res = await insertOrQueue('hidratacao_logs', {
      user_id: user.id, data: todayISO(), ml_consumidos: ml,
    });
    if (res.error) { toast.error(`Erro ao registrar: ${res.error}`); return; }
    marcarRegistro(`hidr:${user.id}`);
    if (res.online) toast.success(`+${ml}ml registrado`);
    else toast.info('Salvo offline, sincronizará depois');
    void qc.invalidateQueries({ queryKey: ['hidratacao-hoje'] });
    setTimeout(() => void refreshProfile(), 600);
  }

  async function registrarUrina(nivel: number) {
    if (!user) return;
    await supabase.from('hidratacao_logs').insert({
      user_id: user.id, data: todayISO(), ml_consumidos: 0, cor_urina: nivel,
    });
    const item = URINA_NIVEIS[nivel - 1];
    toast.message(item.label, { description: item.msg });
  }

  const atingida = totalMl >= meta;

  return (
    <div className="px-5 pb-8 pt-6">
      <Link to="/app/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Início
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold">💧 Hidratação</h1>
      <p className="text-sm text-muted-foreground">Meta diária: <strong className="text-foreground">{(meta / 1000).toFixed(1)} L</strong></p>
      {calor !== "ameno" && boost > 0 && (
        <div className={`mt-2 rounded-xl border px-3 py-2 text-xs font-semibold ${calor === "extremo" ? "border-orange-500 bg-orange-500/10 text-orange-700" : "border-amber-500 bg-amber-500/10 text-amber-700"}`}>
          🌡️ {calor === "extremo" ? "Calor extremo" : "Calor elevado"} em campo agora — meta aumentada em <strong>+{boost} ml</strong>.
        </div>
      )}

      {/* Garrafa visual */}
      <div className="mt-6 flex items-end justify-center">
        <div className="relative h-64 w-32 overflow-hidden rounded-b-3xl rounded-t-xl border-4 border-primary bg-primary/5">
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gradient-water"
            initial={{ height: 0 }}
            animate={{ height: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-foreground">
              <div className="text-3xl font-extrabold">{(totalMl / 1000).toFixed(1)}L</div>
              <div className="text-xs">{Math.round(pct)}%</div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        {copos} copo{copos !== 1 ? 's' : ''} · faltam {Math.max(0, meta - totalMl)}ml
      </p>

      {atingida && (
        <div className="mt-4 rounded-2xl bg-success/10 p-4 text-center text-sm font-semibold text-success">
          🎉 Parabéns! Você está hidratado adequadamente.
        </div>
      )}

      <h2 className="mt-7 text-base font-bold">Adicionar água</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {VOLUMES.map((ml) => (
          <button
            key={ml}
            onClick={() => adicionar(ml)}
            className="flex h-16 items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-primary-soft text-base font-bold text-primary-deep active:scale-[0.97]"
          >
            <Plus className="h-5 w-5" />
            {ml >= 1000 ? '1 L' : `${ml}ml`}
          </button>
        ))}
      </div>

      <h2 className="mt-7 text-base font-bold">Cor da urina</h2>
      <p className="text-xs text-muted-foreground">Toque na cor que mais se parece com a sua agora.</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {URINA_NIVEIS.map((u) => (
          <button
            key={u.n}
            onClick={() => registrarUrina(u.n)}
            className="flex h-14 flex-col items-center justify-center rounded-xl border-2 border-border text-[10px] font-bold text-foreground/80 active:scale-95"
            style={{ backgroundColor: u.cor }}
          >
            {u.n}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        💡 Urina clara = boa hidratação. Urina escura = beba mais água.
      </p>
    </div>
  );
}
