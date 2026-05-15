import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { HardHat, Droplets, HeartPulse, Sparkles, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      void navigate({ to: isAdmin ? "/admin/dashboard" : "/app/home" });
    }
  }, [user, isAdmin, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="mx-auto max-w-md px-6 py-12 safe-top">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-primary shadow-elevated">
            <HardHat className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-extrabold text-foreground">
            Canteiro <span className="text-primary">Saudável</span>
          </h1>
          <p className="mt-3 max-w-xs text-balance text-base text-muted-foreground">
            Cuide da sua saúde no canteiro de obras. Acumule pontos e troque por prêmios.
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-2 gap-3">
          {[
            { icon: Droplets, t: 'Hidratação', c: 'bg-water/10 text-water' },
            { icon: HeartPulse, t: 'Saúde', c: 'bg-destructive/10 text-destructive' },
            { icon: Trophy, t: 'Desafios', c: 'bg-accent/15 text-accent' },
            { icon: Sparkles, t: 'Recompensas', c: 'bg-primary/10 text-primary' },
          ].map(({ icon: Ic, t, c }) => (
            <div key={t} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className={`mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl ${c}`}>
                <Ic className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">{t}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3">
          <Link
            to="/login"
            className="flex h-14 items-center justify-center rounded-2xl bg-gradient-primary text-base font-bold text-primary-foreground shadow-elevated transition-transform active:scale-[0.98]"
          >
            Entrar com matrícula
          </Link>
          <Link
            to="/cadastro"
            className="flex h-14 items-center justify-center rounded-2xl border-2 border-primary bg-card text-base font-bold text-primary"
          >
            Primeiro acesso
          </Link>
          <Link
            to="/admin-login"
            className="mt-2 text-center text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
          >
            Acesso da equipe de saúde
          </Link>
        </div>
      </div>
    </div>
  );
}
