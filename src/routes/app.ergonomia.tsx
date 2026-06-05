import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Activity, Play, Pause, RotateCcw, ExternalLink, MoveHorizontal, MoveVertical, RotateCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/canteiro";
import { VIDEO_GINASTICA_LABORAL } from "@/lib/contatos";
import { AudioNarracao, pararTodosAudios } from "@/components/AudioNarracao";
import imgCompleta from "@/assets/ergo-completa.jpg";
import imgPescoco from "@/assets/ergo-pescoco.jpg";
import imgOmbros from "@/assets/ergo-ombros.jpg";
import imgLombar from "@/assets/ergo-lombar.jpg";
import imgBracos from "@/assets/ergo-bracos.jpg";
import imgPernas from "@/assets/ergo-pernas.jpg";
import imgPunhos from "@/assets/ergo-punhos.jpg";

type Direcao = 'horizontal' | 'vertical' | 'circular';

export const Route = createFileRoute("/app/ergonomia")({
  component: Ergonomia,
});

type Exercicio = { nome: string; tempo: number; instrucao: string; imagem: string; cacheKey: string; direcao?: Direcao; movimento?: string };
type Categoria = { id: string; titulo: string; descricao: string; imagem: string; exercicios: Exercicio[] };


const CATEGORIAS: Categoria[] = [
  {
    id: 'completa',
    titulo: 'Ginástica laboral completa',
    descricao: 'Sequência de corpo inteiro — 4 a 6 minutos.',
    imagem: imgCompleta,
    exercicios: [
      { nome: 'Pescoço', tempo: 30, imagem: imgPescoco, cacheKey: 'pescoco-incl',
        instrucao: 'Incline a cabeça suavemente para o lado direito e segure. Depois, para o lado esquerdo. Respire fundo.' },
      { nome: 'Ombros', tempo: 30, imagem: imgOmbros, cacheKey: 'ombros-rot',
        instrucao: 'Gire os ombros lentamente para trás, fazendo círculos amplos. Mantenha os braços relaxados.' },
      { nome: 'Coluna', tempo: 45, imagem: imgLombar, cacheKey: 'coluna-rot',
        instrucao: 'Em pé, gire o tronco devagar para os lados. Mantenha o quadril fixo e os pés firmes no chão.' },
      { nome: 'Braços', tempo: 30, imagem: imgBracos, cacheKey: 'bracos-peito',
        instrucao: 'Estenda um braço sobre o peito e segure com a outra mão. Sinta o alongamento. Troque o lado.' },
      { nome: 'Pernas', tempo: 45, imagem: imgPernas, cacheKey: 'pernas-post',
        instrucao: 'Apoie a perna esticada em uma plataforma baixa. Incline o tronco lentamente para frente.' },
      { nome: 'Punhos', tempo: 20, imagem: imgPunhos, cacheKey: 'punhos-rot',
        instrucao: 'Gire os punhos lentamente para um lado e depois para o outro. Solte as mãos.' },
    ],
  },
  {
    id: 'lombar',
    titulo: 'Dor lombar / costas',
    descricao: 'Alívio para a região lombar após carregar peso ou ficar muito tempo curvado.',
    imagem: imgLombar,
    exercicios: [
      { nome: 'Inclinação para trás', tempo: 30, imagem: imgLombar, cacheKey: 'lombar-incl-tras',
        instrucao: 'Em pé, com as mãos na cintura, incline o tronco para trás devagar, sem forçar.' },
      { nome: 'Joelho ao peito', tempo: 40, imagem: imgPernas, cacheKey: 'lombar-joelho',
        instrucao: 'Sentado ou em pé, traga um joelho ao peito e segure por vinte segundos. Troque a perna.' },
      { nome: 'Rotação de tronco', tempo: 40, imagem: imgLombar, cacheKey: 'lombar-rot-tronco',
        instrucao: 'Sentado, cruze um pé sobre o joelho oposto e gire o tronco lentamente para o lado.' },
      { nome: 'Alongamento lateral', tempo: 30, imagem: imgBracos, cacheKey: 'lombar-lateral',
        instrucao: 'Em pé, eleve um braço e incline o tronco para o lado oposto. Respire profundamente.' },
    ],
  },
  {
    id: 'pescoco',
    titulo: 'Pescoço e ombros',
    descricao: 'Para tensão cervical e dor nos trapézios.',
    imagem: imgPescoco,
    exercicios: [
      { nome: 'Inclinação lateral', tempo: 30, imagem: imgPescoco, cacheKey: 'pesc-incl-lat',
        instrucao: 'Incline a cabeça para o ombro direito e segure. Depois para o lado esquerdo.' },
      { nome: 'Rotação cervical', tempo: 30, imagem: imgPescoco, cacheKey: 'pesc-rot-cerv',
        instrucao: 'Olhe lentamente para o ombro direito, volte ao centro e olhe para o esquerdo.' },
      { nome: 'Flexão suave', tempo: 30, imagem: imgPescoco, cacheKey: 'pesc-flex',
        instrucao: 'Leve o queixo ao peito devagar. Em seguida, eleve o olhar para o teto.' },
      { nome: 'Elevação de ombros', tempo: 30, imagem: imgOmbros, cacheKey: 'omb-elev',
        instrucao: 'Leve os ombros até as orelhas, segure por cinco segundos e relaxe completamente.' },
      { nome: 'Círculos de ombro', tempo: 40, imagem: imgOmbros, cacheKey: 'omb-circ',
        instrucao: 'Faça círculos amplos com os ombros para trás. Em seguida, para frente.' },
    ],
  },
  {
    id: 'pernas',
    titulo: 'Pernas e joelhos',
    descricao: 'Para quem fica muito tempo em pé ou agachado.',
    imagem: imgPernas,
    exercicios: [
      { nome: 'Panturrilha', tempo: 40, imagem: imgPernas, cacheKey: 'pernas-pantu',
        instrucao: 'Apoie as mãos na parede. Estique uma perna atrás com o calcanhar firme no chão.' },
      { nome: 'Quadríceps', tempo: 40, imagem: imgPernas, cacheKey: 'pernas-quad',
        instrucao: 'Em pé, segure o pé atrás aproximando o calcanhar do glúteo. Mantenha o equilíbrio.' },
      { nome: 'Posterior de coxa', tempo: 40, imagem: imgPernas, cacheKey: 'pernas-poster',
        instrucao: 'Apoie um pé em altura baixa e incline o tronco para frente, mantendo a coluna reta.' },
      { nome: 'Agachamento leve', tempo: 30, imagem: imgPernas, cacheKey: 'pernas-agach',
        instrucao: 'Faça cinco agachamentos parciais. Mantenha as costas retas e os joelhos alinhados aos pés.' },
    ],
  },
  {
    id: 'braco',
    titulo: 'Braços, punhos e mãos',
    descricao: 'Para quem usa ferramentas, faz movimentos repetitivos.',
    imagem: imgPunhos,
    exercicios: [
      { nome: 'Punho para cima', tempo: 30, imagem: imgPunhos, cacheKey: 'punho-cima',
        instrucao: 'Braço esticado com os dedos apontando para cima. Puxe os dedos suavemente com a outra mão.' },
      { nome: 'Punho para baixo', tempo: 30, imagem: imgPunhos, cacheKey: 'punho-baixo',
        instrucao: 'Braço esticado com os dedos apontando para baixo. Puxe a mão delicadamente na sua direção.' },
      { nome: 'Abrir e fechar', tempo: 20, imagem: imgPunhos, cacheKey: 'punho-abrir',
        instrucao: 'Abra bem os dedos e feche em punho. Repita dez vezes, com calma.' },
      { nome: 'Tríceps', tempo: 30, imagem: imgBracos, cacheKey: 'bracos-triceps',
        instrucao: 'Coloque a mão sobre o ombro com o cotovelo apontando para cima. Empurre o cotovelo levemente.' },
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

  const categoria = useMemo(() => CATEGORIAS.find((c) => c.id === catId) ?? null, [catId]);

  useEffect(() => {
    if (categoria) setSeconds(categoria.exercicios[0].tempo);
  }, [categoria]);

  useEffect(() => {
    if (!running || !categoria) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s > 1) return s - 1;
        if (step < categoria.exercicios.length - 1) {
          setStep(step + 1);
          return categoria.exercicios[step + 1].tempo;
        }
        setRunning(false);
        void finalizar();
        return 0;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, step, categoria]);

  useEffect(() => () => { pararTodosAudios(); }, []);

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
  }
  function pausar() { setRunning(false); pararTodosAudios(); }
  function reset() { pausar(); setStep(0); if (categoria) setSeconds(categoria.exercicios[0].tempo); }

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
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition hover:border-primary"
            >
              <img src={c.imagem} alt={c.titulo} loading="lazy" width={64} height={64}
                className="h-16 w-16 shrink-0 rounded-xl object-cover" />
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

  const atual = categoria.exercicios[step];

  return (
    <div className="px-5 pb-8 pt-6">
      <button onClick={() => { pausar(); setCatId(null); }} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar para categorias
      </button>
      <h1 className="mt-3 text-2xl font-extrabold">{categoria.titulo}</h1>

      <div className="mt-5 overflow-hidden rounded-3xl bg-gradient-primary text-primary-foreground shadow-elevated">
        <div className="relative bg-white">
          <motion.img
            key={atual.cacheKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, scale: running ? [1, 1.03, 1] : 1 }}
            transition={{ opacity: { duration: 0.3 }, scale: { duration: 2, repeat: running ? Infinity : 0 } }}
            src={atual.imagem}
            alt={`Posição: ${atual.nome}`}
            width={768}
            height={768}
            loading="lazy"
            className="mx-auto h-64 w-full object-contain"
          />
          <div className="absolute left-3 top-3 rounded-full bg-primary/90 px-3 py-1 text-xs font-bold text-primary-foreground">
            {step + 1} / {categoria.exercicios.length}
          </div>
        </div>

        <div className="p-5 text-center">
          <h2 className="text-xl font-bold">{atual.nome}</h2>
          <div className="mt-1 text-5xl font-extrabold tabular-nums">{seconds}s</div>
          <p className="mt-2 text-sm opacity-95">{atual.instrucao}</p>

          <div className="mt-4">
            <AudioNarracao
              texto={
                `Exercício ${step + 1} de ${categoria.exercicios.length}: ${atual.nome}. ` +
                `${atual.instrucao} ` +
                `Mantenha a posição por ${atual.tempo} segundos, respirando fundo e devagar. ` +
                (step === categoria.exercicios.length - 1
                  ? 'Este é o último. Muito bem, você está quase lá.'
                  : 'Quando o tempo acabar, vamos para o próximo.')
              }
              cacheKey={`ergo-v2-${categoria.id}-${atual.cacheKey}`}
              autoPlay={running}
            />
          </div>

          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={() => running ? pausar() : iniciar()}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-accent font-bold text-accent-foreground shadow-warm"
            >
              {running ? <><Pause className="h-5 w-5" /> Pausar</> : <><Play className="h-5 w-5" /> Iniciar sequência</>}
            </button>
            <button onClick={reset} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20" aria-label="Reiniciar">
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 flex justify-center gap-1">
            {categoria.exercicios.map((_, i) => (
              <div key={i} className={`h-1 w-6 rounded-full ${i <= step ? 'bg-accent' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 rounded-2xl bg-warning/10 p-3 text-xs text-warning-foreground">
        ⚠️ Sentiu dor durante o exercício? Pare e procure a Medicina do Trabalho.
      </p>
    </div>
  );
}
