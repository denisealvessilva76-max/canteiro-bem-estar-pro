import { useEffect, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { speak, stopSpeaking, isTtsSupported } from "@/lib/tts";

type Props = {
  texto: string;
  cacheKey: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  className?: string;
};

/**
 * Narração usando a voz nativa do navegador (Web Speech API).
 * Sem custo, sem rate-limit, funciona offline. Voz feminina pt-BR.
 */
export function AudioNarracao({ texto, autoPlay = false, onEnded, className }: Props) {
  const [tocando, setTocando] = useState(false);
  const suportado = isTtsSupported();

  useEffect(() => {
    if (!autoPlay || !suportado) return;
    setTocando(true);
    speak(texto).catch(() => setTocando(false));
    const id = window.setTimeout(() => { setTocando(false); onEnded?.(); }, Math.max(2500, texto.length * 70));
    return () => { window.clearTimeout(id); stopSpeaking(); setTocando(false); };
  }, [texto, autoPlay, suportado, onEnded]);

  function toggle() {
    if (!suportado) return;
    if (tocando) { stopSpeaking(); setTocando(false); }
    else { setTocando(true); speak(texto).catch(() => setTocando(false)); }
  }

  return (
    <div className={`flex items-center gap-3 rounded-2xl bg-white/15 p-3 backdrop-blur ${className ?? ''}`}>
      <button
        type="button"
        onClick={toggle}
        disabled={!suportado}
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-lg disabled:opacity-50"
        aria-label={tocando ? 'Pausar narração' : 'Tocar narração'}
      >
        {!suportado ? <VolumeX className="h-6 w-6" />
          : tocando ? <Pause className="h-6 w-6" />
          : <Play className="h-6 w-6 translate-x-0.5" />}
      </button>
      <div className="flex-1">
        <p className="flex items-center gap-1 text-xs font-semibold opacity-90">
          <Volume2 className="h-3 w-3" />
          {!suportado ? 'Áudio não suportado neste dispositivo' : tocando ? 'Narrando...' : 'Toque para ouvir'}
        </p>
        <p className="mt-1 text-[10px] opacity-70">Voz do dispositivo · sem internet</p>
      </div>
    </div>
  );
}

export function pararTodosAudios() {
  stopSpeaking();
}
