import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Activity, Play, Pause, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/canteiro";

export const Route = createFileRoute("/app/ergonomia")({
  component: Ergonomia,
});

const ALONGAMENTOS = [
  { nome: 'Pescoço', tempo: 30, instrucao: 'Incline suavemente a cabeça para cada lado, segure 30s.', emoji: '🙆' },
  { nome: 'Ombros', tempo: 30, instrucao: 'Gire os ombros para trás, devagar.', emoji: '💪' },
  { nome: 'Coluna', tempo: 45, instrucao: 'Em pé, gire o tronco para os lados.', emoji: '🧍' },
  { nome: 'Braços', tempo: 30, instrucao: 'Estenda um braço sobre o peito, troque.', emoji: '🤸' },
  { nome: 'Pernas', tempo: 45, instrucao: 'Apoie a perna em uma plataforma, alongue.', emoji: '🦵' },
  { nome: 'Punhos', tempo: 20, instrucao: 'Gire os punhos lentamente.', emoji: '✋' },
];

const POSTURAS = [
  { titulo: 'Para abaixar', dica: 'Dobre os joelhos, mantenha as costas retas. Nunca dobre só a cintura.', emoji: '🪑' },
  { titulo: 'Carregar peso', dica: 'Cargas próximas ao corpo, abaixe-se com as pernas, nunca puxe.', emoji: '📦' },
  { titulo: 'Sentado', dica: 'Pés apoiados no chão, costas retas no encosto, ombros relaxados.', emoji: '💺' },
  { titulo: 'Em pé', dica: 'Distribua peso entre os dois pés. Alterne a posição a cada 30 min.', emoji: '🧍' },
];

function Ergonomia() {
  const { user, refreshProfile } = useAuth();
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(ALONGAMENTOS[0].tempo);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s > 1) return s - 1;
        // próximo
        if (step < ALONGAMENTOS.length - 1) {
          setStep((p) => p + 1);
          return ALONGAMENTOS[step + 1].tempo;
        } else {
          setRunning(false);
          finalizar();
          return 0;
        }
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, step]);

  async function finalizar() {
    if (!user) return;
    await supabase.from('alongamento_logs').insert({
      user_id: user.id, data: todayISO(), duracao_segundos: ALONGAMENTOS.reduce((s, a) => s + a.tempo, 0),
    });
    // bonifica +15 pontos via update direto
    const { data: prof } = await supabase.from('profiles').select('pontos_acumulados').eq('id', user.id).maybeSingle();
    if (prof) await supabase.from('profiles').update({ pontos_acumulados: prof.pontos_acumulados + 15 }).eq('id', user.id);
    toast.success('Ginástica concluída! +15 pontos');
    setTimeout(() => void refreshProfile(), 600);
  }

  function reset() { setRunning(false); setStep(0); setSeconds(ALONGAMENTOS[0].tempo); }

  const atual = ALONGAMENTOS[step];

  return (
    <div className="px-5 pb-8 pt-6">
      <Link to="/app/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Início
      </Link>
      <h1 className="mt-3 flex items-center gap-2 text-2xl font-extrabold">
        <Activity className="h-7 w-7 text-primary" /> Ergonomia
      </h1>

      <div className="mt-6 rounded-3xl bg-gradient-primary p-6 text-center text-primary-foreground shadow-elevated">
        <p className="text-xs uppercase tracking-wider opacity-80">Ginástica laboral</p>
        <h2 className="mt-1 text-xl font-bold">{atual.nome}</h2>
        <motion.div
          key={step + (running ? 'r' : 's')}
          animate={{ scale: running ? [1, 1.08, 1] : 1 }}
          transition={{ duration: 1.5, repeat: running ? Infinity : 0 }}
          className="mt-4 text-7xl"
        >
          {atual.emoji}
        </motion.div>
        <div className="mt-3 text-5xl font-extrabold tabular-nums">{seconds}s</div>
        <p className="mt-2 text-sm opacity-90">{atual.instrucao}</p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            onClick={() => setRunning((r) => !r)}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-accent font-bold text-accent-foreground shadow-warm"
          >
            {running ? <><Pause className="h-5 w-5" /> Pausar</> : <><Play className="h-5 w-5" /> {step === 0 && seconds === ALONGAMENTOS[0].tempo ? 'Iniciar agora' : 'Continuar'}</>}
          </button>
          <button onClick={reset} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 flex justify-center gap-1">
          {ALONGAMENTOS.map((_, i) => (
            <div key={i} className={`h-1 w-6 rounded-full ${i <= step ? 'bg-accent' : 'bg-white/30'}`} />
          ))}
        </div>
      </div>

      <h2 className="mt-7 text-base font-bold">Posturas corretas</h2>
      <div className="mt-3 space-y-3">
        {POSTURAS.map((p) => (
          <div key={p.titulo} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <span className="text-3xl">{p.emoji}</span>
            <div>
              <p className="text-sm font-bold">{p.titulo}</p>
              <p className="text-xs text-muted-foreground">{p.dica}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 rounded-2xl bg-warning/10 p-3 text-xs text-warning-foreground">
        ⚠️ Sentiu dor durante o exercício? Pare e procure a Medicina do Trabalho.
      </p>
    </div>
  );
}
