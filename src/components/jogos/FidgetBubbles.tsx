import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

// Tela sensorial: bolhas estouráveis. Foco em redirecionar atenção, sem pontos.
type Bolha = { id: number; x: number; y: number; cor: string };

const CORES = ['#9bd6ff', '#cdb4ff', '#ffb4d6', '#b4ffce', '#ffd6a5'];

export function FidgetBubbles() {
  const [seed, setSeed] = useState(0);
  const bolhas = useMemo<Bolha[]>(() => {
    const arr: Bolha[] = [];
    for (let i = 0; i < 18; i++) {
      arr.push({
        id: seed * 100 + i,
        x: Math.random() * 80 + 5,
        y: Math.random() * 80 + 5,
        cor: CORES[i % CORES.length],
      });
    }
    return arr;
  }, [seed]);

  const [estouradas, setEstouradas] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (estouradas.size >= bolhas.length) {
      const t = setTimeout(() => { setSeed((s) => s + 1); setEstouradas(new Set()); }, 600);
      return () => clearTimeout(t);
    }
  }, [estouradas, bolhas.length]);

  return (
    <div className="relative mt-3 h-72 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 to-pink-50">
      {bolhas.map((b) => {
        const off = estouradas.has(b.id);
        return (
          <motion.button
            key={b.id}
            onPointerDown={() => setEstouradas((p) => new Set([...p, b.id]))}
            initial={{ scale: 0 }}
            animate={{ scale: off ? 0 : 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            className="absolute h-12 w-12 rounded-full shadow-soft"
            style={{ left: `${b.x}%`, top: `${b.y}%`, backgroundColor: b.cor }}
          />
        );
      })}
      <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[10px] text-muted-foreground">
        Toque pra estourar. Respire fundo enquanto faz.
      </p>
    </div>
  );
}
