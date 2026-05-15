import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Users, AlertTriangle, Trophy, Bell, Gift, LogOut, HardHat, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/funcionarios', icon: Users, label: 'Funcionários' },
  { to: '/admin/alertas', icon: AlertTriangle, label: 'Alertas' },
  { to: '/admin/desafios', icon: Trophy, label: 'Desafios' },
  { to: '/admin/avisos', icon: Bell, label: 'Avisos' },
  { to: '/admin/recompensas', icon: Gift, label: 'Recompensas' },
  { to: '/admin/contas', icon: ShieldCheck, label: 'Contas' },
];

function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: '/admin-login' });
    if (!loading && user && !isAdmin) void navigate({ to: '/app/home' });
  }, [user, isAdmin, loading, navigate]);

  if (loading || !user || !isAdmin) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex items-center gap-2 border-b border-border px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
            <HardHat className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold leading-tight">Canteiro</p>
            <p className="text-xs text-muted-foreground">Saúde Ocupacional</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ to, icon: Icon, label }) => {
            const active = loc.pathname === to;
            return (
              <Link key={to} to={to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                }`}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
        </nav>
        <button onClick={() => { void signOut().then(() => navigate({ to: '/' })); }}
          className="m-3 flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>
      <main className="flex-1 overflow-x-auto p-6"><Outlet /></main>
    </div>
  );
}
