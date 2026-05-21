import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Brain, Phone, MessageCircle, HeartPulse, ExternalLink, Volume2 } from "lucide-react";
import { useNarracaoSequencial, type Trecho } from "@/components/NarracaoSequencial";
import { pararTodosAudios } from "@/components/AudioNarracao";
import {
  WHATSAPP_PSICOLOGA,
  WHATSAPP_ASSISTENTE_SOCIAL,
  WHATSAPP_SAUDE_OCUPACIONAL,
  SOS_TELEFONE,
  SOS_CHAT_URL,
  whatsappLink,
} from "@/lib/contatos";

export const Route = createFileRoute("/app/mental")({
  component: Mental,
});

const FASES = [
  { nome: 'Inspire', dur: 4, scale: 1.55 },
  { nome: 'Segure',  dur: 7, scale: 1.55 },
  { nome: 'Solte',   dur: 8, scale: 0.9  },
];

// Trechos narrados — cada fala dura aproximadamente o tempo da fase.
// Cacheados pelo ElevenLabs no bucket "narracoes" (1ª execução gera; depois é instantâneo).
const TRECHOS: Trecho[] = [
  { cacheKey: 'mental-478-intro',
    texto: 'Vamos iniciar a respiração guiada. Tente ficar o mais relaxado possível. Solte os ombros e feche os olhos se quiser.' },
  { cacheKey: 'mental-478-inspire',
    texto: 'Inspire pelo nariz. Um, dois, três, quatro.' },
  { cacheKey: 'mental-478-segure',
    texto: 'Segure o ar. Um, dois, três, quatro, cinco, seis, sete.' },
  { cacheKey: 'mental-478-solte',
    texto: 'Solte pela boca, devagar. Um, dois, três, quatro, cinco, seis, sete, oito.' },
  { cacheKey: 'mental-478-final',
    texto: 'Muito bem. Você conseguiu. Continue respirando no seu ritmo.' },
];

function Mental() {
  const [running, setRunning] = useState(false);
  const [fase, setFase] = useState(0);
  const [tempo, setTempo] = useState(FASES[0].dur);
  const [ciclos, setCiclos] = useState(0);

  const trechos = useMemo(() => TRECHOS, []);
  const { play, stop, pronto } = useNarracaoSequencial(trechos);

  // Contagem regressiva da fase
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTempo((t) => {
        if (t > 1) return t - 1;
        const proxima = (fase + 1) % FASES.length;
        if (proxima === 0) setCiclos((c) => c + 1);
        setFase(proxima);
        return FASES[proxima].dur;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, fase]);

  // Sincroniza a narração com cada nova fase
  useEffect(() => {
    if (!running) return;
    // Índices em TRECHOS: 1 inspire, 2 segure, 3 solte
    play(fase + 1);
  }, [running, fase, ciclos, play]);

  function start() {
    setFase(0);
    setTempo(FASES[0].dur);
    setCiclos(0);
    play(0); // intro
    // dá ~3.5s para a intro antes de começar o ciclo
    setTimeout(() => {
      setRunning(true);
      play(1); // inspire
    }, 3800);
  }

  function stopAll() {
    setRunning(false);
    stop();
    pararTodosAudios();
    play(4); // mensagem final
  }

  useEffect(() => () => { stop(); pararTodosAudios(); }, [stop]);

  return (
    <div className="px-5 pb-8 pt-6">
      <Link to="/app/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Início
      </Link>
      <h1 className="mt-3 flex items-center gap-2 text-2xl font-extrabold">
        <Brain className="h-7 w-7 text-info" /> Saúde Mental
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Você não está sozinho. Tudo aqui é confidencial. 🤝
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3">
        <a href={`tel:${SOS_TELEFONE}`} className="flex h-16 items-center justify-center gap-2 rounded-2xl bg-destructive text-base font-bold text-destructive-foreground shadow-elevated">
          <Phone className="h-5 w-5" /> SOS · Ligar 188 (CVV)
        </a>
        <a href={SOS_CHAT_URL} target="_blank" rel="noopener" className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-destructive bg-card text-base font-bold text-destructive">
          <MessageCircle className="h-5 w-5" /> Chat anônimo CVV <ExternalLink className="h-4 w-4" />
        </a>

        <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Equipe da obra</div>

        <a href={whatsappLink(WHATSAPP_PSICOLOGA, 'Olá, sou trabalhador do canteiro e gostaria de conversar com a psicóloga.')} target="_blank" rel="noopener" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-success text-base font-bold text-success-foreground shadow-soft">
          <MessageCircle className="h-5 w-5" /> Psicóloga (WhatsApp)
        </a>
        <a href={whatsappLink(WHATSAPP_ASSISTENTE_SOCIAL, 'Olá, sou trabalhador do canteiro e preciso de apoio da assistente social.')} target="_blank" rel="noopener" className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-success bg-card text-base font-bold text-success">
          <MessageCircle className="h-5 w-5" /> Assistente Social (WhatsApp)
        </a>
        <a href={whatsappLink(WHATSAPP_SAUDE_OCUPACIONAL, 'Olá, sou trabalhador do canteiro e preciso falar com a Saúde Ocupacional.')} target="_blank" rel="noopener" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-info text-base font-bold text-info-foreground shadow-soft">
          <HeartPulse className="h-5 w-5" /> Saúde Ocupacional (WhatsApp)
        </a>
      </div>

      <div className="mt-7 rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h2 className="text-base font-bold">Respiração guiada 4-7-8</h2>
        <p className="text-xs text-muted-foreground">
          A voz vai te acompanhar a cada etapa. Sincronizada com a bolinha.
        </p>

        <div className="mt-6 flex flex-col items-center">
          <motion.div
            animate={{ scale: running ? FASES[fase].scale : 1 }}
            transition={{ duration: tempo, ease: 'easeInOut' }}
            className="flex h-44 w-44 items-center justify-center rounded-full bg-gradient-water text-card shadow-elevated"
          >
            <div className="text-center">
              <div className="text-sm font-medium opacity-90">{running ? FASES[fase].nome : 'Pronto?'}</div>
              <div className="text-5xl font-extrabold tabular-nums">{running ? tempo : '4·7·8'}</div>
            </div>
          </motion.div>
          <p className="mt-4 text-xs text-muted-foreground">{ciclos} ciclos completos</p>
          <button
            onClick={() => running ? stopAll() : start()}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary font-bold text-primary-foreground"
          >
            <Volume2 className="h-4 w-4" />
            {running ? 'Parar' : 'Começar respiração guiada'}
          </button>
          <p className="mt-2 text-[11px] text-muted-foreground text-center">
            {pronto ? 'Áudio carregado. Coloque o volume em um nível confortável.' : 'A voz pode levar alguns segundos. Você pode começar sem áudio.'}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-info/10 p-4 text-xs text-info-foreground">
        Procure ajuda se: tristeza por mais de 2 semanas, perda de interesse, pensamentos de se machucar.
        Você não precisa enfrentar isso sozinho.
      </div>
    </div>
  );
}
