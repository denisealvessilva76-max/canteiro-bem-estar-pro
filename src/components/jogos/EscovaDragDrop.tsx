import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type Zona = { id: string; label: string; emoji: string; precisa: 'escova' | 'fio' | 'enxaguante' };

const ZONAS: Zona[] = [
  { id: 'cima', label: 'Dentes de cima', emoji: '🦷', precisa: 'escova' },
  { id: 'baixo', label: 'Dentes de baixo', emoji: '🦷', precisa: 'escova' },
  { id: 'entre', label: 'Entre os dentes', emoji: '🪥', precisa: 'fio' },
  { id: 'boca', label: 'Boca toda', emoji: '😁', precisa: 'enxaguante' },
];

const FERRAMENTAS = [
  { id: 'escova', label: 'Escova', emoji: '🪥' },
  { id: 'fio', label: 'Fio dental', emoji: '🧵' },
  { id: 'enxaguante', label: 'Enxaguante', emoji: '🧴' },
];

export function EscovaDragDrop({ onDone }: { onDone?: () => void }) {
  const { user, refreshProfile } = useAuth();
  const [feitas, setFeitas] = useState<Set<string>>(new Set());
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function tentarSoltar(zonaId: string) {
    const zona = ZONAS.find((z) => z.id === zonaId);
    if (!zona || !arrastando) return;
    if (zona.precisa === arrastando) {
      setFeitas((p) => new Set([...p, zonaId]));
      toast.success('Boa! ✨');
      if (feitas.size + 1 === ZONAS.length) void finalizar();
    } else {
      toast.error('Ferramenta errada pra essa zona, tenta de novo!');
    }
    setArrastando(null);
  }

  async function finalizar() {
    if (!user || salvando) return;
    setSalvando(true);
    // Concede medalha de odontologia (cria conquista se ainda não existe)
    try {
      await supabase.rpc('conceder_medalha', { _user_id: user.id, _codigo: 'odonto_game' });
    } catch { /* opcional */ }
    toast.success('Fase concluída! +20 pontos 🎉');
    setTimeout(() => { void refreshProfile(); onDone?.(); }, 800);
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground">
        Arraste a ferramenta certa para cada zona da boca. Toque e segure para arrastar.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {ZONAS.map((z) => {
          const ok = feitas.has(z.id);
          return (
            <motion.div
              key={z.id}
              onPointerUp={() => tentarSoltar(z.id)}
              className={`flex h-24 flex-col items-center justify-center rounded-2xl border-2 text-center text-xs font-bold transition ${
                ok ? 'border-success bg-success/10 text-success' : 'border-dashed border-cyan-400 bg-cyan-50 text-cyan-700'
              }`}
            >
              <span className="text-3xl">{z.emoji}</span>
              {z.label}
              {ok && <Check className="mt-1 h-3 w-3" />}
            </motion.div>
          );
        })}
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">Ferramentas</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {FERRAMENTAS.map((f) => (
          <motion.button
            key={f.id}
            drag
            dragSnapToOrigin
            onDragStart={() => setArrastando(f.id)}
            whileTap={{ scale: 1.1 }}
            className={`flex h-20 flex-col items-center justify-center rounded-2xl border-2 bg-card text-xs font-bold ${
              arrastando === f.id ? 'border-cyan-500 shadow-elevated' : 'border-border'
            }`}
          >
            <span className="text-3xl">{f.emoji}</span>
            {f.label}
          </motion.button>
        ))}
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">{feitas.size}/{ZONAS.length} zonas</p>
    </div>
  );
}
