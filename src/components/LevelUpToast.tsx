import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { nivelPorPontos, NIVEIS, type Nivel } from "@/lib/gamificacao";

const STORAGE_KEY = "canteiro:last-nivel";

/**
 * Detecta quando o usuário sobe de nível (bronze→prata→ouro→diamante)
 * e mostra uma animação celebratória. Persiste o último nível em localStorage
 * para evitar disparar de novo após reload.
 */
export function LevelUpToast() {
  const { profile } = useAuth();
  const [novoNivel, setNovoNivel] = useState<Nivel | null>(null);
  const lastSeen = useRef<Nivel | null>(null);

  useEffect(() => {
    if (!profile) return;
    const atual = nivelPorPontos(profile.pontos_acumulados);
    const armazenado = (typeof window !== "undefined"
      ? (localStorage.getItem(STORAGE_KEY) as Nivel | null)
      : null) ?? lastSeen.current;

    if (armazenado && armazenado !== atual) {
      const ordem: Nivel[] = ["bronze", "prata", "ouro", "diamante"];
      if (ordem.indexOf(atual) > ordem.indexOf(armazenado)) {
        setNovoNivel(atual);
        setTimeout(() => setNovoNivel(null), 4500);
      }
    }
    lastSeen.current = atual;
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, atual);
  }, [profile?.pontos_acumulados]);

  return (
    <AnimatePresence>
      {novoNivel && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: -40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="fixed inset-x-4 top-20 z-[120] mx-auto max-w-sm rounded-3xl bg-gradient-to-br p-1 shadow-elevated"
          style={{ backgroundImage: `linear-gradient(135deg, ${NIVEIS[novoNivel].cor}, #fff8)` }}
        >
          <div className="rounded-[22px] bg-card p-5 text-center">
            <motion.div
              initial={{ rotate: -15, scale: 0.7 }}
              animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: 1 }}
              transition={{ duration: 1.2 }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-5xl shadow-xl"
              style={{ background: `radial-gradient(circle, ${NIVEIS[novoNivel].cor} 0%, transparent 70%)` }}
            >
              {NIVEIS[novoNivel].emoji}
            </motion.div>
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Subiu de nível!
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-foreground">
              Você é {NIVEIS[novoNivel].label}!
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cuidado de ouro com a saúde. Continue assim! <Trophy className="ml-1 inline h-4 w-4 text-warning" />
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
