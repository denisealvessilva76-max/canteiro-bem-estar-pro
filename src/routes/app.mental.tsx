import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Brain, Phone, MessageCircle, HeartPulse, ExternalLink, Volume2, X } from "lucide-react";
import { useNarracaoSequencial, type Trecho } from "@/components/NarracaoSequencial";
import { pararTodosAudios } from "@/components/AudioNarracao";
import { GameBoundary } from "@/components/GameBoundary";
import { FidgetBubbles } from "@/components/jogos/FidgetBubbles";
import { CardioMental } from "@/components/jogos/CardioMental";
import { PlacarPessoal } from "@/components/PlacarPessoal";
import { useAuth } from "@/contexts/AuthContext";
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

// Narração curta — só anuncia a fase. A bolinha mostra a contagem.
// Texto curto cabe em qualquer duração (4s/7s/8s) e sincroniza com a tela.
const TRECHOS: Trecho[] = [
  { cacheKey: 'mental-478-intro',   texto: 'Vamos começar. Solte os ombros e relaxe.' },
  { cacheKey: 'mental-478-inspire', texto: 'Inspire pelo nariz.' },
  { cacheKey: 'mental-478-segure',  texto: 'Segure o ar.' },
  { cacheKey: 'mental-478-solte',   texto: 'Solte pela boca, devagar.' },
  { cacheKey: 'mental-478-final',   texto: 'Muito bem. Continue respirando no seu ritmo.' },
];

function Mental() {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);
  const [fase, setFase] = useState(0);
  const [tempo, setTempo] = useState(FASES[0].dur);
  const [ciclos, setCiclos] = useState(0);
  const [aba, setAba] = useState<'respiracao' | 'fidget' | 'cardio'>('respiracao');
  const [showApoio, setShowApoio] = useState(false);
  const [apoioShown, setApoioShown] = useState(false);

  useEffect(() => {
    if (apoioShown) return;
    const t = setTimeout(() => { setShowApoio(true); setApoioShown(true); }, 3 * 60 * 1000);
    return () => clearTimeout(t);
  }, [apoioShown]);

  const trechos = useMemo(() => TRECHOS, []);
  const { play, stop, pronto } = useNarracaoSequencial(trechos);

  // Contagem regressiva + narração disparada EXATAMENTE na troca de fase.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTempo((t) => {
        if (t > 1) return t - 1;
        const proxima = (fase + 1) % FASES.length;
        if (proxima === 0) setCiclos((c) => c + 1);
        setFase(proxima);
        play(proxima + 1); // 1=inspire, 2=segure, 3=solte
        return FASES[proxima].dur;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, fase, play]);

  function start() {
    setFase(0);
    setTempo(FASES[0].dur);
    setCiclos(0);
    play(0);
    setTimeout(() => { setRunning(true); play(1); }, 2500);
  }

  function stopAll() {
    setRunning(false);
    stop();
    pararTodosAudios();
    play(4);
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

      <div className="mt-7 grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
        {(['respiracao', 'fidget', 'cardio'] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`rounded-xl py-2 text-xs font-semibold transition ${aba === a ? 'bg-card shadow-soft' : 'text-muted-foreground'}`}
          >
            {a === 'respiracao' ? 'Respiração' : a === 'fidget' ? 'Fidget' : 'Cardio ❤️'}
          </button>
        ))}
      </div>

      {aba === 'respiracao' && (
        <div className="mt-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
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
      )}

      {aba === 'fidget' && (
        <div className="mt-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-base font-bold">Estoure as bolhas 🫧</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Toque para liberar a tensão. Movimentos repetitivos ajudam a reduzir a ansiedade.
          </p>
          <GameBoundary componente="FidgetBubbles" rota="/app/mental">
            <FidgetBubbles />
          </GameBoundary>
        </div>
      )}

      {aba === 'cardio' && (
        <div className="mt-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-base font-bold">Coerência cardíaca ❤️</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Acompanhe o ritmo da bolinha por 60 segundos. Ajuda a regular o batimento e diminuir o estresse.
          </p>
          <PlacarPessoal jogo="mental_cardio" label="Sua melhor coerência" />
          <div className="mt-3">
            <GameBoundary componente="CardioMental" userId={user?.id} rota="/app/mental" onAbort={() => setAba('respiracao')}>
              <CardioMental onDone={() => setAba('respiracao')} />
            </GameBoundary>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl bg-info/10 p-4 text-xs text-info-foreground">
        Procure ajuda se: tristeza por mais de 2 semanas, perda de interesse, pensamentos de se machucar.
        Você não precisa enfrentar isso sozinho.
      </div>

      <AnimatePresence>
        {showApoio && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
            onClick={() => setShowApoio(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-elevated"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-extrabold">Tudo bem por aí? 💙</h3>
                <button onClick={() => setShowApoio(false)} className="text-muted-foreground"><X className="h-5 w-5" /></button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Você já está aqui há alguns minutos. Se quiser conversar com alguém agora, é só tocar abaixo. É confidencial.
              </p>
              <div className="mt-4 grid gap-2">
                <a
                  href={whatsappLink(WHATSAPP_PSICOLOGA, 'Olá, gostaria de conversar com a psicóloga.')}
                  target="_blank" rel="noopener"
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-success font-bold text-success-foreground"
                >
                  <MessageCircle className="h-4 w-4" /> Falar com psicóloga
                </a>
                <a
                  href={`tel:${SOS_TELEFONE}`}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-destructive font-bold text-destructive-foreground"
                >
                  <Phone className="h-4 w-4" /> Ligar CVV 188
                </a>
                <button
                  onClick={() => setShowApoio(false)}
                  className="mt-1 h-10 text-sm font-semibold text-muted-foreground"
                >
                  Estou bem, obrigado
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
