import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Droplets, HeartPulse, Bell, Sparkles, Brain, Activity, X, Heart, Smile } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { WeatherObras } from "@/components/WeatherObras";
import { LembretesCenter } from "@/components/LembretesCenter";
import { PermissaoNotificacoes } from "@/components/PermissaoNotificacoes";
import { HUMORES, todayISO } from "@/lib/canteiro";
import { insertOrQueue } from "@/lib/offline";

export const Route = createFileRoute("/app/home")({
  component: Home,
});

function Home() {
  const { user, profile, refreshProfile } = useAuth();
  const qc = useQueryClient();
  const [showTutorial, setShowTutorial] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [humorSelecionado, setHumorSelecionado] = useState<typeof HUMORES[number] | null>(null);

  useEffect(() => {
    if (profile?.primeiro_acesso) setShowTutorial(true);
  }, [profile?.primeiro_acesso]);

  const { data: hojeCheckin } = useQuery({
    queryKey: ['checkin-hoje', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from('checkin_diario').select('*')
        .eq('user_id', user!.id).eq('data', todayISO()).maybeSingle();
      return data;
    },
  });

  const { data: resumoSemana } = useQuery({
    queryKey: ['resumo-semana', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const ini = new Date(); ini.setDate(ini.getDate() - 7);
      const iniISO = ini.toISOString().slice(0, 10);
      const [{ count: ck }, { data: hidr }] = await Promise.all([
        supabase.from('checkin_diario').select('*', { count: 'exact', head: true })
          .eq('user_id', user!.id).gte('data', iniISO),
        supabase.from('hidratacao_logs').select('ml_consumidos').eq('user_id', user!.id).gte('data', iniISO),
      ]);
      const totalMl = (hidr ?? []).reduce((s, r) => s + r.ml_consumidos, 0);
      return { checkins: ck ?? 0, ml: totalMl };
    },
  });

  async function dismissTutorial() {
    setShowTutorial(false);
    if (user) await supabase.from('profiles').update({ primeiro_acesso: false }).eq('id', user.id);
    await refreshProfile();
  }

  async function enviarCheckin() {
    if (!user || !humorSelecionado) return;
    const ruim = humorSelecionado.score <= 2;
    if (ruim && !motivo.trim()) {
      toast.error('Conte rapidinho o que aconteceu');
      return;
    }
    const res = await insertOrQueue('checkin_diario', {
      user_id: user.id, data: todayISO(),
      humor_icone: humorSelecionado.icone, humor_score: humorSelecionado.score,
      motivo_texto: ruim ? motivo : null,
    });
    if (res.online) toast.success('+10 pontos! Check-in registrado.');
    else toast.success('Salvo offline! Sincroniza quando voltar a internet.');
    setShowCheckin(false); setHumorSelecionado(null); setMotivo('');
    void qc.invalidateQueries({ queryKey: ['checkin-hoje'] });
    setTimeout(() => void refreshProfile(), 800);
  }

  return (
    <>
      <AppHeader />

      <div className="-mt-6 px-4">
        <LembretesCenter />
        <PermissaoNotificacoes />

        <motion.div
          initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="rounded-3xl border border-border bg-card p-5 shadow-elevated"
        >
          {hojeCheckin ? (
            <div className="text-center">
              <div className="text-4xl">{hojeCheckin.humor_icone}</div>
              <p className="mt-2 text-sm text-muted-foreground">Check-in feito hoje, valeu!</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground">Como você está hoje?</p>
              <button
                onClick={() => setShowCheckin(true)}
                className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-warm text-base font-bold text-accent-foreground shadow-warm active:scale-[0.98]"
              >
                Fazer check-in diário
              </button>
            </>
          )}
        </motion.div>

        <h2 className="mt-7 text-base font-bold text-foreground">Ações rápidas</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <ActionCard to="/app/hidratacao" icon={Droplets} title="Hidratação" subtitle="Registre água" tone="water" />
          <ActionCard to="/app/saude" icon={HeartPulse} title="Saúde" subtitle="Pressão e sintomas" tone="danger" />
          <ActionCard to="/app/ergonomia" icon={Activity} title="Ergonomia" subtitle="Alongamentos" tone="primary" />
          <ActionCard to="/app/mental" icon={Brain} title="Saúde Mental" subtitle="Apoio e respiração" tone="accent" />
          <ActionCard to="/app/mulher" icon={Heart} title="Saúde da Mulher" subtitle="Ciclo e cuidados" tone="pink" />
          <ActionCard to="/app/odonto" icon={Smile} title="Odontologia" subtitle="Escovação e dicas" tone="cyan" />
          <ActionCard to="/app/avisos" icon={Bell} title="Avisos" subtitle="Comunicados" tone="info" />
          <ActionCard to="/app/recompensas" icon={Sparkles} title="Recompensas" subtitle="Loja de prêmios" tone="primary" />
        </div>

        <div className="mt-6">
          <WeatherObras />
        </div>

        <h2 className="mt-7 text-base font-bold text-foreground">Sua semana</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Stat label="Check-ins" value={`${resumoSemana?.checkins ?? 0}/7`} icon="✅" />
          <Stat label="Água total" value={`${((resumoSemana?.ml ?? 0) / 1000).toFixed(1)} L`} icon="💧" />
        </div>
      </div>

      <AnimatePresence>
        {showTutorial && <TutorialOverlay onClose={() => void dismissTutorial()} />}
        {showCheckin && (
          <Modal onClose={() => setShowCheckin(false)} title="Como você está?">
            <div className="grid grid-cols-5 gap-2">
              {HUMORES.map((h) => (
                <button
                  key={h.score}
                  onClick={() => setHumorSelecionado(h)}
                  className={`flex flex-col items-center rounded-2xl border-2 p-2 transition ${
                    humorSelecionado?.score === h.score
                      ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  }`}
                >
                  <span className="text-3xl">{h.icone}</span>
                  <span className="mt-1 text-[10px] font-medium">{h.label}</span>
                </button>
              ))}
            </div>
            {humorSelecionado && humorSelecionado.score <= 2 && (
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="O que aconteceu? (a equipe será avisada)"
                rows={3}
                className="mt-4 w-full rounded-2xl border-2 border-input bg-card p-3 text-sm outline-none focus:border-primary"
              />
            )}
            <button
              onClick={enviarCheckin}
              disabled={!humorSelecionado}
              className="mt-4 flex h-13 w-full h-12 items-center justify-center rounded-2xl bg-gradient-primary font-bold text-primary-foreground disabled:opacity-50"
            >
              Confirmar check-in
            </button>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

function ActionCard({ to, icon: Icon, title, subtitle, tone }: {
  to: string; icon: React.ElementType; title: string; subtitle: string;
  tone: 'water' | 'danger' | 'primary' | 'accent' | 'info' | 'pink' | 'cyan';
}) {
  const tones: Record<string, string> = {
    water: 'bg-water/10 text-water',
    danger: 'bg-destructive/10 text-destructive',
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/15 text-accent',
    info: 'bg-info/10 text-info',
    pink: 'bg-pink-100 text-pink-600',
    cyan: 'bg-cyan-100 text-cyan-600',
  };
  return (
    <Link to={to} className="rounded-2xl border border-border bg-card p-4 shadow-soft transition active:scale-[0.97]">
      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-2 text-sm font-bold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </Link>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-2xl">{icon}</div>
      <p className="mt-1 text-2xl font-extrabold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-card p-6 safe-bottom"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function TutorialOverlay({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    { emoji: '👋', t: 'Bem-vindo!', d: 'O Canteiro Saudável cuida da sua saúde no dia a dia da obra.' },
    { emoji: '💧', t: 'Beba água', d: 'Registre cada copo. A meta é calculada pelo seu peso e o calor de Canaã.' },
    { emoji: '❤️', t: 'Cuide da sua saúde', d: 'Registre pressão e sintomas. A equipe é avisada se algo estiver fora.' },
    { emoji: '🏆', t: 'Ganhe pontos', d: 'Acumule pontos e troque por vale-compras e brindes na loja.' },
  ];
  const s = steps[step];
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
    >
      <motion.div
        key={step} initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        className="w-full max-w-sm rounded-3xl bg-card p-7 text-center shadow-elevated"
      >
        <div className="text-6xl">{s.emoji}</div>
        <h3 className="mt-4 text-xl font-extrabold">{s.t}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
        <div className="mt-5 flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted'}`} />
          ))}
        </div>
        <button
          onClick={() => step < steps.length - 1 ? setStep(step + 1) : onClose()}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-primary font-bold text-primary-foreground"
        >
          {step < steps.length - 1 ? 'Próximo' : 'Começar'}
        </button>
      </motion.div>
    </motion.div>
  );
}
