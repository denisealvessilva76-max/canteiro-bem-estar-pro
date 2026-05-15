import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LogOut, IdCard, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/app/perfil")({
  component: Perfil,
});

const AVATARS = ['👷', '👷‍♀️', '🧑‍🔧', '👨‍🏭', '🦺'];

function Perfil() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function logout() {
    await signOut();
    void navigate({ to: '/' });
  }

  if (!profile) return null;

  return (
    <div className="px-5 pb-8 pt-6">
      <Link to="/app/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Início
      </Link>

      <div className="mt-6 rounded-3xl bg-gradient-primary p-6 text-center text-primary-foreground shadow-elevated">
        <div className="text-7xl">{AVATARS[(profile.avatar_id ?? 1) - 1] ?? '👷'}</div>
        <h1 className="mt-3 text-xl font-extrabold">{profile.nome}</h1>
        <p className="text-sm opacity-85">{profile.cargo ?? 'Trabalhador'}</p>
        <div className="mt-4 flex justify-center gap-3 text-xs">
          <div className="flex items-center gap-1"><IdCard className="h-3.5 w-3.5" /> {profile.matricula}</div>
          <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {profile.turno}</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <div className="text-2xl font-extrabold text-primary">{profile.pontos_acumulados}</div>
          <p className="text-xs text-muted-foreground">Pontos</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <div className="text-2xl font-extrabold text-accent">{profile.ofensiva_dias}</div>
          <p className="text-xs text-muted-foreground">Dias seguidos</p>
        </div>
      </div>

      <h2 className="mt-7 text-base font-bold">Mais</h2>
      <div className="mt-3 space-y-2">
        <Link to="/app/ranking" className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <span className="font-medium">🏆 Ranking</span><span className="text-muted-foreground">›</span>
        </Link>
        <Link to="/app/recompensas" className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <span className="font-medium">🎁 Recompensas</span><span className="text-muted-foreground">›</span>
        </Link>
        <Link to="/app/avisos" className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <span className="font-medium">🔔 Avisos</span><span className="text-muted-foreground">›</span>
        </Link>
        <Link to="/app/mental" className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <span className="font-medium">🧠 Saúde Mental</span><span className="text-muted-foreground">›</span>
        </Link>
      </div>

      <button
        onClick={logout}
        className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-destructive bg-card font-bold text-destructive"
      >
        <LogOut className="h-5 w-5" /> Sair
      </button>
    </div>
  );
}
