import { useEffect, useRef, useState } from "react";
import { Play, Pause, Loader2, AlertCircle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { obterNarracao } from "@/lib/narracao.functions";

type Props = {
  texto: string;
  cacheKey: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  className?: string;
};

export function AudioNarracao({ texto, cacheKey, autoPlay = false, onEnded, className }: Props) {
  const fn = useServerFn(obterNarracao);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tocando, setTocando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancel = false;
    setLoading(true); setErro(null); setUrl(null);
    fn({ data: { texto, cacheKey } })
      .then((r) => {
        if (cancel) return;
        if (r?.url) setUrl(r.url);
        else setErro(r?.error ?? "Falha ao carregar áudio");
      })
      .catch((e) => { if (!cancel) setErro(String(e?.message ?? e)); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [texto, cacheKey, fn]);

  useEffect(() => {
    if (autoPlay && url && ref.current) {
      ref.current.play().then(() => setTocando(true)).catch(() => { /* ignora autoplay block */ });
    }
  }, [url, autoPlay]);

  function toggle() {
    const a = ref.current; if (!a) return;
    if (tocando) { a.pause(); setTocando(false); }
    else { a.play().then(() => setTocando(true)).catch(() => {}); }
  }

  const pct = duracao > 0 ? (progresso / duracao) * 100 : 0;

  return (
    <div className={`flex items-center gap-3 rounded-2xl bg-white/15 p-3 backdrop-blur ${className ?? ''}`}>
      <button
        type="button"
        onClick={toggle}
        disabled={loading || !!erro || !url}
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-lg disabled:opacity-50"
        aria-label={tocando ? 'Pausar narração' : 'Tocar narração'}
      >
        {loading ? <Loader2 className="h-6 w-6 animate-spin" />
          : erro ? <AlertCircle className="h-6 w-6 text-destructive" />
          : tocando ? <Pause className="h-6 w-6" />
          : <Play className="h-6 w-6 translate-x-0.5" />}
      </button>
      <div className="flex-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/25">
          <div className="h-full bg-white transition-[width] duration-200" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-[11px] opacity-80">
          {loading ? 'Carregando voz...' : erro ? 'Áudio indisponível' : tocando ? 'Reproduzindo' : 'Toque para ouvir'}
        </p>
      </div>
      {url && (
        <audio
          ref={ref}
          src={url}
          preload="auto"
          onTimeUpdate={(e) => setProgresso(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuracao(e.currentTarget.duration)}
          onEnded={() => { setTocando(false); setProgresso(0); onEnded?.(); }}
        />
      )}
    </div>
  );
}

export function pararTodosAudios() {
  document.querySelectorAll('audio').forEach((a) => { try { a.pause(); a.currentTime = 0; } catch { /* noop */ } });
}
