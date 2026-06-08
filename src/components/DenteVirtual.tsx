import { motion } from "framer-motion";

/**
 * Dente virtual reativo às escovações do dia.
 * - 0 escovações: dente triste e amarelado
 * - 1 escovação: melhorando
 * - 2 escovações: branco
 * - 3 escovações: brilhante com óculos escuros
 */
export function DenteVirtual({ done, total = 3 }: { done: number; total?: number }) {
  const pct = Math.min(1, done / total);
  const cor = pct >= 1 ? "#ffffff" : pct >= 0.66 ? "#f8f4e3" : pct >= 0.33 ? "#f0e6a8" : "#e0c84a";
  const brilho = pct >= 1;
  const triste = done === 0;
  const feliz = pct >= 0.66;
  const oculos = pct >= 1;

  const mensagem =
    done === 0
      ? "Seu dente está triste 😟 Registre a primeira escovação!"
      : done === 1
      ? "Vai melhorando! Faltam mais escovações hoje."
      : done === 2
      ? "Quase lá! Só falta uma escovação."
      : "Sorriso brilhante! Meta do dia batida ✨";

  return (
    <div className="flex flex-col items-center">
      <motion.svg
        viewBox="0 0 100 110"
        className="h-32 w-32 drop-shadow-md"
        animate={brilho ? { rotate: [-3, 3, -3] } : { rotate: 0 }}
        transition={{ duration: 2, repeat: brilho ? Infinity : 0, ease: "easeInOut" }}
      >
        {/* corpo do dente */}
        <motion.path
          d="M50 5 C75 5 90 22 88 50 C86 78 75 105 60 105 C54 105 52 95 50 88 C48 95 46 105 40 105 C25 105 14 78 12 50 C10 22 25 5 50 5 Z"
          fill={cor}
          stroke="#7a6a4a"
          strokeWidth={2}
          animate={{ fill: cor }}
          transition={{ duration: 0.8 }}
        />
        {/* brilho */}
        {brilho && (
          <motion.circle
            cx={32} cy={28} r={6}
            fill="#fff" opacity={0.85}
            animate={{ opacity: [0.4, 0.95, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        {/* olhos */}
        {oculos ? (
          <>
            <rect x={28} y={38} width={18} height={10} rx={3} fill="#111" />
            <rect x={54} y={38} width={18} height={10} rx={3} fill="#111" />
            <rect x={46} y={42} width={8} height={2} fill="#111" />
          </>
        ) : (
          <>
            <circle cx={37} cy={45} r={3.2} fill="#333" />
            <circle cx={63} cy={45} r={3.2} fill="#333" />
          </>
        )}
        {/* boca */}
        {triste ? (
          <path d="M38 72 Q50 64 62 72" stroke="#7a3030" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        ) : feliz ? (
          <path d="M36 66 Q50 80 64 66" stroke="#2d6b2d" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        ) : (
          <path d="M40 70 L60 70" stroke="#444" strokeWidth={2.5} strokeLinecap="round" />
        )}
      </motion.svg>
      <p className={`mt-2 text-center text-xs font-bold ${brilho ? "text-cyan-700" : "text-muted-foreground"}`}>
        {mensagem}
      </p>
    </div>
  );
}
