import { useCallback, useEffect, useState } from "react";
import { speak, stopSpeaking, isTtsSupported } from "@/lib/tts";

export type Trecho = { texto: string; cacheKey: string };

/**
 * Hook de narração sequencial usando a voz nativa do navegador.
 * `play(index)` fala o trecho desejado; `stop()` interrompe.
 */
export function useNarracaoSequencial(trechos: Trecho[]) {
  const [pronto, setPronto] = useState(false);

  useEffect(() => { setPronto(isTtsSupported()); }, []);

  const stop = useCallback(() => { stopSpeaking(); }, []);

  const play = useCallback((index: number) => {
    const t = trechos[index];
    if (!t) return;
    void speak(t.texto);
  }, [trechos]);

  useEffect(() => () => { stopSpeaking(); }, []);

  return { play, stop, pronto };
}
