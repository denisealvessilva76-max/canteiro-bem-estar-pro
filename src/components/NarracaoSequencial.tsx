import { useEffect, useRef, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { obterNarracao } from "@/lib/narracao.functions";

export type Trecho = { texto: string; cacheKey: string };

/**
 * Hook que pré-carrega vários trechos de narração via ElevenLabs (cacheados em Storage)
 * e expõe `play(index)` / `stop()` para tocar cada trecho sob demanda — sincronizando
 * a fala com a etapa atual de uma animação ou contagem regressiva.
 */
export function useNarracaoSequencial(trechos: Trecho[]) {
  const fn = useServerFn(obterNarracao);
  const [urls, setUrls] = useState<(string | null)[]>(() => trechos.map(() => null));
  const [pronto, setPronto] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancel = false;
    setPronto(false);
    setUrls(trechos.map(() => null));
    Promise.all(
      trechos.map((t) =>
        fn({ data: { texto: t.texto, cacheKey: t.cacheKey } })
          .then((r) => r?.url ?? null)
          .catch(() => null),
      ),
    ).then((r) => {
      if (cancel) return;
      setUrls(r);
      setPronto(true);
    });
    return () => { cancel = true; };
    // Stringify para detectar mudanças reais na lista
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(trechos), fn]);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (a) { try { a.pause(); a.currentTime = 0; } catch { /* noop */ } }
  }, []);

  const play = useCallback((index: number) => {
    const url = urls[index];
    if (!url) return;
    let a = audioRef.current;
    if (!a) {
      a = new Audio();
      audioRef.current = a;
    }
    try { a.pause(); } catch { /* noop */ }
    a.src = url;
    a.currentTime = 0;
    a.play().catch(() => { /* autoplay bloqueado — segue silencioso */ });
  }, [urls]);

  useEffect(() => () => { stop(); audioRef.current = null; }, [stop]);

  return { play, stop, pronto };
}
