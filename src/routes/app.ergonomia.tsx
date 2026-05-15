import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Activity, Play, Pause, RotateCcw, Volume2, VolumeX, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/canteiro";
import { speak, stopSpeaking, startBackgroundMusic, stopBackgroundMusic, isTtsSupported } from "@/lib/tts";
import { VIDEO_GINASTICA_LABORAL } from "@/lib/contatos";

export const Route = createFileRoute("/app/ergonomia")({
  component: Ergonomia,
});

type Exercicio = { nome: string; tempo: number; instrucao: string; emoji: string };
type Categoria = { id: string; titulo: string; descricao: string; emoji: string; exercicios: Exercicio[] };

const CATEGORIAS: Categoria[] = [
  {
    id: 'completa',
    titulo: 'Ginástica laboral completa',
    descricao: 'Sequência de corpo inteiro — 4 a 6 minutos.',
    emoji: '🤸',
    exercicios: [
      { nome: 'Pescoço', tempo: 30, instrucao: 'Incline a cabeça suavemente para o lado direito, segure. Depois para o esquerdo.', emoji: '🙆' },
      { nome: 'Ombros', tempo: 30, instrucao: 'Gire os ombros lentamente para trás. Respire fundo.', emoji: '💪' },
      { nome: 'Coluna', tempo: 45, instrucao: 'Em pé, gire o tronco devagar para os lados. Mantenha o quadril fixo.', emoji: '🧍' },
      { nome: 'Braços', tempo: 30, instrucao: 'Estenda um braço sobre o peito, segure com a outra mão. Troque o lado.', emoji: '🤸' },
      { nome: 'Pernas', tempo: 45, instrucao: 'Apoie a perna em uma plataforma e alongue a parte de trás da coxa.', emoji: '🦵' },
      { nome: 'Punhos', tempo: 20, instrucao: 'Gire os punhos lentamente para um lado e depois para o outro.', emoji: '✋' },
    ],
  },
  {
    id: 'lombar',
    titulo: 'Dor lombar / costas',
    descricao: 'Alívio para a região lombar após carregar peso ou ficar muito tempo curvado.',
    emoji: '🦴',
    exercicios: [
      { nome: 'Inclinação', tempo: 30, instrucao: 'Em pé, mãos na cintura. Incline o tronco para trás devagar, sem forçar.', emoji: '🧍' },
      { nome: 'Joelho ao peito', tempo: 40, instrucao: 'Sentado ou em pé, traga um joelho ao peito por 20s. Troque a perna.', emoji: '🦵' },
      { nome: 'Rotação de tronco', tempo: 40, instrucao: 'Sentado, cruze um pé sobre o joelho oposto, gire o tronco para o lado.', emoji: '🌀' },
      { nome: 'Gato e camelo', tempo: 45, instrucao: 'Apoie nos joelhos e mãos. Arqueie e curve a coluna alternando.', emoji: '🐈' },
      { nome: 'Alongamento lateral', tempo: 30, instrucao: 'Em pé, eleve um braço e incline o tronco para o lado oposto.', emoji: '🙆' },
    ],
  },
  {
    id: 'pescoco',
    titulo: 'Pescoço e ombros',
    descricao: 'Para tensão cervical e dor nos trapézios.',
    emoji: '🙆',
    exercicios: [
      { nome: 'Inclinação lateral', tempo: 30, instrucao: 'Incline a cabeça para o ombro direito. Segure. Depois esquerdo.', emoji: '🙆' },
      { nome: 'Rotação cervical', tempo: 30, instrucao: 'Olhe lentamente para o ombro direito. Volte ao centro. Vá para o esquerdo.', emoji: '🔁' },
      { nome: 'Flexão suave', tempo: 30, instrucao: 'Leve o queixo ao peito devagar. Depois eleve o olhar.', emoji: '⬇️' },
      { nome: 'Elevação de ombros', tempo: 30, instrucao: 'Leve os ombros até as orelhas, segure 5 segundos e relaxe.', emoji: '💪' },
      { nome: 'Círculos de ombro', tempo: 40, instrucao: 'Faça círculos amplos para trás. Em seguida, para frente.', emoji: '🔄' },
    ],
  },
  {
    id: 'pernas',
    titulo: 'Pernas e joelhos',
    descricao: 'Para quem fica muito tempo em pé ou agachado.',
    emoji: '🦵',
    exercicios: [
      { nome: 'Panturrilha', tempo: 40, instrucao: 'Apoie as mãos na parede, perna esticada atrás, calcanhar no chão.', emoji: '🦵' },
      { nome: 'Quadríceps', tempo: 40, instrucao: 'Em pé, segure o pé atrás aproximando o calcanhar do glúteo.', emoji: '🧍' },
      { nome: 'Posterior de coxa', tempo: 40, instrucao: 'Apoie um pé em altura baixa, incline o tronco para frente.', emoji: '⬇️' },
      { nome: 'Agachamento leve', tempo: 30, instrucao: '5 agachamentos parciais, costas retas, joelhos alinhados aos pés.', emoji: '🏋️' },
    ],
  },
  {
    id: 'braco',
    titulo: 'Braços, punhos e mãos',
    descricao: 'Para quem usa ferramentas, faz movimentos repetitivos.',
    emoji: '✋',
    exercicios: [
      { nome: 'Punho para cima', tempo: 30, instrucao: 'Braço esticado, dedos apontando para cima. Puxe os dedos com a outra mão.', emoji: '✋' },
      { nome: 'Punho para baixo', tempo: 30, instrucao: 'Braço esticado, dedos apontando para baixo. Puxe a mão na sua direção.', emoji: '🤚' },
      { nome: 'Abrir e fechar', tempo: 20, instrucao: 'Abra bem os dedos e feche em punho, repita 10 vezes.', emoji: '👋' },
      { nome: 'Tríceps', tempo: 30, instrucao: 'Mão sobre o ombro, cotovelo apontando para cima. Empurre o cotovelo levemente.', emoji: '💪' },
    ],
  },
];

const POSTURAS = [
  { titulo: 'Para abaixar', dica: 'Dobre os joelhos, mantenha as costas retas. Nunca dobre só a cintura.', emoji: '🪑' },
  { titulo: 'Carregar peso', dica: 'Cargas próximas ao corpo, abaixe-se com as pernas, nunca puxe.', emoji: '📦' },
  { titulo: 'Sentado', dica: 'Pés apoiados no chão, costas retas no encosto, ombros relaxados.', emoji: '💺' },
  { titulo: 'Em pé', dica: 'Distribua peso entre os dois pés. Alterne a posição a cada 30 min.', emoji: '🧍' },
];

function Ergonomia() {
  const { user, refreshProfile } = useAuth();
  const [catId, setCatId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [comAudio, setComAudio] = useState(true);

  const categoria = useMemo(() => CATEGORIAS.find((c) => c.id === catId) ?? null, [catId]);

  // inicializa segundos quando troca categoria/step
  useEffect(() => {
    if (categoria) setSeconds(categoria.exercicios[0].tempo);
  }, [categoria]);

  useEffect(() => {
    if (!running || !categoria) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s > 1) {
          // narra metade do tempo (apenas no início de cada exercício é falado por outro effect)
          return s - 1;
        }
        if (step < categoria.exercicios.length - 1) {
          const proximo = step + 1;
          setStep(proximo);
          if (comAudio) speak(categoria.exercicios[proximo].nome + '. ' + categoria.exercicios[proximo].instrucao);
          return categoria.exercicios[proximo].tempo;
        }
        setRunning(false);
        if (comAudio) speak('Parabéns, você concluiu a sequência. Hidrate-se.');
        void finalizar();
        return 0;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, step, categoria, comAudio]);

  useEffect(() => () => { stopSpeaking(); stopBackgroundMusic(); }, []);

  async function finalizar() {
    if (!user || !categoria) return;
    const total = categoria.exercicios.reduce((s, a) => s + a.tempo, 0);
    await supabase.from('alongamento_logs').insert({
      user_id: user.id, data: todayISO(), duracao_segundos: total,
    });
    const { data: prof } = await supabase.from('profiles').select('pontos_acumulados').eq('id', user.id).maybeSingle();
    if (prof) await supabase.from('profiles').update({ pontos_acumulados: prof.pontos_acumulados + 15 }).eq('id', user.id);
    toast.success('Alongamento concluído! +15 pontos');
    setTimeout(() => void refreshProfile(), 500);
  }

  function iniciar() {
    if (!categoria) return;
    setRunning(true); setStep(0); setSeconds(categoria.exercicios[0].tempo);
    if (comAudio) {
      startBackgroundMusic();
      speak('Vamos começar. ' + categoria.exercicios[0].nome + '. ' + categoria.exercicios[0].instrucao);
    }
  }
  function pausar() {
    setRunning(false);
    stopSpeaking();
    stopBackgroundMusic();
  }
  function reset() { pausar(); setStep(0); if (categoria) setSeconds(categoria.exercicios[0].tempo); }

  // Lista de categorias
  if (!categoria) {
    return (
      <div className="px-5 pb-8 pt-6">
        <Link to="/app/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Início
        </Link>
        <h1 className="mt-3 flex items-center gap-2 text-2xl font-extrabold">
          <Activity className="h-7 w-7 text-primary" /> Ergonomia
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha onde você sente desconforto ou faça a ginástica completa.
        </p>

        <a
          href={VIDEO_GINASTICA_LABORAL}
          target="_blank" rel="noopener"
          className="mt-5 flex items-center justify-between rounded-2xl bg-gradient-primary p-4 text-primary-foreground shadow-elevated"
        >
          <div>
            <p className="text-xs uppercase tracking-wider opacity-85">Vídeo guiado</p>
            <p className="text-base font-bold">Ginástica laboral em obra (corpo inteiro)</p>
          </div>
          <ExternalLink className="h-5 w-5" />
        </a>

        <h2 className="mt-7 text-base font-bold">Escolha um foco</h2>
        <div className="mt-3 space-y-3">
          {CATEGORIAS.map((c) => (
            <button
              key={c.id}
              onClick={() => { setCatId(c.id); setRunning(false); setStep(0); }}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary"
            >
              <span className="text-3xl">{c.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-bold">{c.titulo}</p>
                <p className="text-xs text-muted-foreground">{c.descricao}</p>
              </div>
              <span className="text-xs font-bold text-primary">{c.exercicios.length} exerc.</span>
            </button>
          ))}
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

  // Sessão em andamento
  const atual = categoria.exercicios[step];

  return (
    <div className="px-5 pb-8 pt-6">
      <button onClick={() => { pausar(); setCatId(null); }} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar para categorias
      </button>
      <div className="mt-3 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold">
          <span className="text-3xl">{categoria.emoji}</span> {categoria.titulo}
        </h1>
        {isTtsSupported() && (
          <button
            onClick={() => { setComAudio((v) => { if (v) { stopSpeaking(); stopBackgroundMusic(); } return !v; }); }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground"
            aria-label="Alternar narração"
          >
            {comAudio ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        )}
      </div>

      <div className="mt-5 rounded-3xl bg-gradient-primary p-6 text-center text-primary-foreground shadow-elevated">
        <p className="text-xs uppercase tracking-wider opacity-80">
          Exercício {step + 1} de {categoria.exercicios.length}
        </p>
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
            onClick={() => running ? pausar() : iniciar()}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-accent font-bold text-accent-foreground shadow-warm"
          >
            {running ? <><Pause className="h-5 w-5" /> Pausar</> : <><Play className="h-5 w-5" /> {step === 0 && seconds === categoria.exercicios[0].tempo ? 'Iniciar com narração' : 'Continuar'}</>}
          </button>
          <button onClick={reset} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 flex justify-center gap-1">
          {categoria.exercicios.map((_, i) => (
            <div key={i} className={`h-1 w-6 rounded-full ${i <= step ? 'bg-accent' : 'bg-white/30'}`} />
          ))}
        </div>
        <p className="mt-3 text-xs opacity-80">
          🔊 A voz orienta cada passo — você não precisa olhar a tela.
        </p>
      </div>

      <p className="mt-6 rounded-2xl bg-warning/10 p-3 text-xs text-warning-foreground">
        ⚠️ Sentiu dor durante o exercício? Pare e procure a Medicina do Trabalho.
      </p>
    </div>
  );
}
