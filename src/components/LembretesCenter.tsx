import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Droplets, Activity, Target, HeartHandshake, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/canteiro";

type Lembrete = {
  id: string;
  icone: React.ElementType;
  emoji: string;
  titulo: string;
  mensagem: string;
  to: string;
  cta: string;
  tone: "water" | "primary" | "accent" | "info";
  urgente?: boolean;
};

const TONES: Record<Lembrete["tone"], { bg: string; ring: string; btn: string; iconBg: string; iconText: string }> = {
  water:   { bg: "bg-water/5",     ring: "ring-water/30",     btn: "bg-water text-white",            iconBg: "bg-water/15",     iconText: "text-water" },
  primary: { bg: "bg-primary/5",   ring: "ring-primary/30",   btn: "bg-primary text-primary-foreground", iconBg: "bg-primary/15",   iconText: "text-primary" },
  accent:  { bg: "bg-accent/10",   ring: "ring-accent/30",    btn: "bg-accent text-accent-foreground", iconBg: "bg-accent/20",    iconText: "text-accent" },
  info:    { bg: "bg-info/5",      ring: "ring-info/30",      btn: "bg-info text-info-foreground",     iconBg: "bg-info/15",      iconText: "text-info" },
};

function dismissedKey(userId: string) {
  return `lembretes-dismissed-${userId}-${todayISO()}`;
}
function readDismissed(userId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(dismissedKey(userId)) ?? "[]")); }
  catch { return new Set(); }
}
function writeDismissed(userId: string, set: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(dismissedKey(userId), JSON.stringify([...set]));
}

export function LembretesCenter() {
  const { user, profile } = useAuth();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (user) setDismissed(readDismissed(user.id));
  }, [user]);

  // Atualiza a cada 60s para recalcular janelas de tempo (água a cada 2h, etc.)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hoje = todayISO();

  const { data } = useQuery({
    queryKey: ["lembretes", user?.id, hoje],
    enabled: !!user?.id,
    refetchInterval: 60_000,
    queryFn: async () => {
      const [{ data: ck }, { data: hid }, { data: alg }, { data: progs }] = await Promise.all([
        supabase.from("checkin_diario").select("id").eq("user_id", user!.id).eq("data", hoje).maybeSingle(),
        supabase.from("hidratacao_logs").select("ml_consumidos, created_at").eq("user_id", user!.id).eq("data", hoje).order("created_at", { ascending: false }),
        supabase.from("alongamento_logs").select("id").eq("user_id", user!.id).eq("data", hoje).maybeSingle(),
        supabase.from("progresso_desafios").select("desafio_id, status, desafios(titulo)").eq("user_id", user!.id).eq("status", "em_andamento"),
      ]);
      return {
        fezCheckin: !!ck,
        ultimaAgua: hid?.[0]?.created_at ? new Date(hid[0].created_at) : null,
        totalAguaMl: (hid ?? []).reduce((s, r) => s + (r.ml_consumidos ?? 0), 0),
        fezAlongamento: !!alg,
        desafiosAtivos: (progs ?? []) as Array<{ desafio_id: string; desafios: { titulo: string } | null }>,
      };
    },
  });

  const lembretes = useMemo<Lembrete[]>(() => {
    if (!data) return [];
    const list: Lembrete[] = [];
    const hora = now.getHours();
    const dentroDoExpediente = hora >= 6 && hora <= 20;

    // 1) Check-in diário
    if (!data.fezCheckin && dentroDoExpediente) {
      list.push({
        id: "checkin",
        icone: HeartHandshake,
        emoji: "👋",
        titulo: `Bom dia${profile?.nome ? `, ${profile.nome.split(" ")[0]}` : ""}!`,
        mensagem: "Faça seu check-in de hoje e ganhe +10 pontos.",
        to: "/app/home",
        cta: "Fazer check-in",
        tone: "accent",
        urgente: true,
      });
    }

    // 2) Hidratação — a cada 2h
    if (dentroDoExpediente) {
      const agora = now.getTime();
      const horasDesdeUltima = data.ultimaAgua
        ? (agora - data.ultimaAgua.getTime()) / 3_600_000
        : 99;
      if (horasDesdeUltima >= 2) {
        const msg = data.ultimaAgua
          ? `Já fazem ${Math.floor(horasDesdeUltima)}h desde sua última água. Hora de hidratar!`
          : "Você ainda não registrou água hoje. Beba um copo agora!";
        list.push({
          id: `agua-${Math.floor(agora / (2 * 3_600_000))}`, // muda a cada 2h pra reaparecer
          icone: Droplets,
          emoji: "💧",
          titulo: "Hora da água!",
          mensagem: msg,
          to: "/app/hidratacao",
          cta: "Registrar copo",
          tone: "water",
        });
      }
    }

    // 3) Alongamento do dia
    if (!data.fezAlongamento && hora >= 8 && hora <= 17) {
      list.push({
        id: "alongamento",
        icone: Activity,
        emoji: "🧘",
        titulo: "Alongamento do dia",
        mensagem: "5 minutinhos previnem 80% das dores. Bora?",
        to: "/app/ergonomia",
        cta: "Começar alongamento",
        tone: "primary",
      });
    }

    // 4) Desafios ativos
    for (const p of data.desafiosAtivos) {
      list.push({
        id: `desafio-${p.desafio_id}`,
        icone: Target,
        emoji: "🎯",
        titulo: "Desafio em andamento",
        mensagem: p.desafios?.titulo ? `Continue: ${p.desafios.titulo}` : "Continue seu desafio ativo.",
        to: "/app/desafios",
        cta: "Ver desafio",
        tone: "info",
      });
    }

    return list.filter((l) => !dismissed.has(l.id));
  }, [data, now, profile, dismissed]);

  function dispensar(id: string) {
    if (!user) return;
    const novo = new Set(dismissed);
    novo.add(id);
    setDismissed(novo);
    writeDismissed(user.id, novo);
  }

  if (!lembretes.length) return null;

  return (
    <div className="mt-4 space-y-2">
      <AnimatePresence initial={false}>
        {lembretes.map((l) => {
          const t = TONES[l.tone];
          const Icon = l.icone;
          return (
            <motion.div
              key={l.id}
              layout
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className={`relative overflow-hidden rounded-2xl border border-border ${t.bg} p-3 shadow-soft ring-1 ${t.ring}`}
            >
              {l.urgente && (
                <motion.div
                  className="absolute inset-0 -z-0"
                  animate={{ opacity: [0.0, 0.15, 0.0] }}
                  transition={{ duration: 2.2, repeat: Infinity }}
                  style={{ background: "radial-gradient(60% 60% at 0% 0%, currentColor, transparent)" }}
                />
              )}
              <div className="relative flex items-start gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.iconBg} ${t.iconText}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none">{l.emoji}</span>
                    <p className="truncate text-sm font-bold text-foreground">{l.titulo}</p>
                  </div>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{l.mensagem}</p>
                  <Link
                    to={l.to}
                    className={`mt-2 inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold ${t.btn} active:scale-95`}
                  >
                    {l.cta}
                  </Link>
                </div>
                <button
                  onClick={() => dispensar(l.id)}
                  aria-label="Dispensar lembrete"
                  className="rounded-full p-1 text-muted-foreground/70 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
