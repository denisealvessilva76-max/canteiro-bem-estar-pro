import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Brain, Phone, MessageCircle, Volume2, VolumeX, HeartPulse, ExternalLink } from "lucide-react";
import { speak, stopSpeaking, startBackgroundMusic, stopBackgroundMusic, isTtsSupported } from "@/lib/tts";
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

// Respiração 4-7-8 com ritmo realmente calmo: cada fase tem o tempo correto
// e a fala acontece UMA vez no início, sem atropelar a contagem.
const FASES = [
  { nome: 'Inspire', dur: 4, scale: 1.55, fala: 'Inspire devagar pelo nariz' },
  { nome: 'Segure',  dur: 7, scale: 1.55, fala: 'Segure o ar com calma' },
  { nome: 'Solte',   dur: 8, scale: 0.9,  fala: 'Solte o ar bem devagar pela boca' },
];

function Mental() {
  const [running, setRunning] = useState(false);
  const [fase, setFase] = useState(0);
  const [tempo, setTempo] = useState(FASES[0].dur);
  const [ciclos, setCiclos] = useState(0);
  const [comAudio, setComAudio] = useState(true);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTempo((t) => {
        if (t > 1) return t - 1;
        const proxima = (fase + 1) % FASES.length;
        if (proxima === 0) setCiclos((c) => c + 1);
        setFase(proxima);
        if (comAudio) speak(FASES[proxima].fala, { calmo: true });
        return FASES[proxima].dur;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, fase, comAudio]);

  function start() {
    setRunning(true); setFase(0); setTempo(FASES[0].dur); setCiclos(0);
    if (comAudio) {
      startBackgroundMusic();
      // pausa breve antes de começar para a voz não atropelar a animação
      setTimeout(() => speak('Vamos respirar juntos. ' + FASES[0].fala, { calmo: true }), 250);
    }
  }
  function stop() {
    setRunning(false);
    stopSpeaking();
    stopBackgroundMusic();
  }

  useEffect(() => () => { stopSpeaking(); stopBackgroundMusic(); }, []);

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

      {/* SOS oficial — CVV */}
      <div className="mt-6 grid grid-cols-1 gap-3">
        <a
          href={`tel:${SOS_TELEFONE}`}
          className="flex h-16 items-center justify-center gap-2 rounded-2xl bg-destructive text-base font-bold text-destructive-foreground shadow-elevated"
        >
          <Phone className="h-5 w-5" /> SOS · Ligar 188 (CVV)
        </a>
        <a
          href={SOS_CHAT_URL}
          target="_blank" rel="noopener"
          className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-destructive bg-card text-base font-bold text-destructive"
        >
          <MessageCircle className="h-5 w-5" /> Chat anônimo CVV <ExternalLink className="h-4 w-4" />
        </a>

        <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Equipe da obra</div>

        <a
          href={whatsappLink(WHATSAPP_PSICOLOGA, 'Olá, sou trabalhador do canteiro e gostaria de conversar com a psicóloga.')}
          target="_blank" rel="noopener"
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-success text-base font-bold text-success-foreground shadow-soft"
        >
          <MessageCircle className="h-5 w-5" /> Psicóloga (WhatsApp)
        </a>
        <a
          href={whatsappLink(WHATSAPP_ASSISTENTE_SOCIAL, 'Olá, sou trabalhador do canteiro e preciso de apoio da assistente social.')}
          target="_blank" rel="noopener"
          className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-success bg-card text-base font-bold text-success"
        >
          <MessageCircle className="h-5 w-5" /> Assistente Social (WhatsApp)
        </a>
        <a
          href={whatsappLink(WHATSAPP_SAUDE_OCUPACIONAL, 'Olá, sou trabalhador do canteiro e preciso falar com a Saúde Ocupacional.')}
          target="_blank" rel="noopener"
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-info text-base font-bold text-info-foreground shadow-soft"
        >
          <HeartPulse className="h-5 w-5" /> Saúde Ocupacional (WhatsApp)
        </a>
      </div>

      {/* Respiração 4-7-8 */}
      <div className="mt-7 rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold">Respiração guiada 4-7-8</h2>
            <p className="text-xs text-muted-foreground">Acalma em momentos de estresse ou ansiedade.</p>
          </div>
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
            onClick={() => running ? stop() : start()}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-primary font-bold text-primary-foreground"
          >
            {running ? 'Parar' : 'Começar com narração'}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-info/10 p-4 text-xs text-info-foreground">
        Procure ajuda se: tristeza por mais de 2 semanas, perda de interesse, pensamentos de se machucar.
        Você não precisa enfrentar isso sozinho.
      </div>
    </div>
  );
}
