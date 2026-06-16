import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, AlertTriangle, Trophy, Bell, Gift, LogOut, HardHat, Loader2, ShieldCheck, Menu, X, ChevronLeft, MapPin, Bug, FileText, Zap, BookOpen, FileSpreadsheet, UsersRound, Calculator } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/simulador', icon: Calculator, label: 'Simulador Financeiro' },
  { to: '/admin/funcionarios', icon: Users, label: 'Funcionários' },
  { to: '/admin/matriculas', icon: FileSpreadsheet, label: 'Pré-cadastro CSV' },
  { to: '/admin/squads', icon: UsersRound, label: 'Squads' },
  { to: '/admin/alertas', icon: AlertTriangle, label: 'Alertas' },
  { to: '/admin/desafios', icon: Trophy, label: 'Desafios' },
  { to: '/admin/avisos', icon: Bell, label: 'Avisos' },
  { to: '/admin/notificacoes', icon: Bell, label: 'Push (teste)' },
  { to: '/admin/engajamento', icon: Zap, label: 'Engajamento' },
  { to: '/admin/conteudo', icon: BookOpen, label: 'Conteúdo' },
  { to: '/admin/recompensas', icon: Gift, label: 'Recompensas' },
  { to: '/admin/clinicas', icon: MapPin, label: 'Clínicas/UBS' },
  { to: '/admin/relatorios', icon: FileText, label: 'Relatórios' },
  { to: '/admin/bugs', icon: Bug, label: 'Reportes' },
  { to: '/admin/contas', icon: ShieldCheck, label: 'Contas' },
] as const;

function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: '/admin-login' });
    if (!loading && user && !isAdmin) void navigate({ to: '/app/home' });
  }, [user, isAdmin, loading, navigate]);

  // fecha menu ao navegar
  useEffect(() => { setOpen(false); }, [loc.pathname]);

  if (loading || !user || !isAdmin) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const atual = NAV.find((n) => n.to === loc.pathname);

  function NavList({ onClick }: { onClick?: () => void }) {
    return (
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = loc.pathname === to;
          return (
            <Link key={to} to={to} onClick={onClick}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
              }`}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar desktop */}
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
        <NavList />
        <button onClick={() => { void signOut().then(() => navigate({ to: '/' })); }}
          className="m-3 flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>

      <div className="flex w-full flex-1 flex-col">
        {/* Header mobile / tablet */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background">
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
              <HardHat className="h-4 w-4" />
            </div>
            <span className="text-sm font-extrabold">{atual?.label ?? 'Painel'}</span>
          </Link>
          {loc.pathname !== '/admin/dashboard' && (
            <Link to="/admin/dashboard" className="ml-auto flex items-center gap-1 rounded-xl bg-muted px-3 py-2 text-xs font-bold">
              <ChevronLeft className="h-4 w-4" /> Início
            </Link>
          )}
        </header>

        {/* Drawer mobile */}
        {open && (
          <div className="fixed inset-0 z-50 bg-foreground/40 lg:hidden" onClick={() => setOpen(false)}>
            <aside onClick={(e) => e.stopPropagation()} className="flex h-full w-72 flex-col bg-card shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-4 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                    <HardHat className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold leading-tight">Canteiro</p>
                    <p className="text-xs text-muted-foreground">Painel admin</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="h-9 w-9 rounded-full bg-muted">
                  <X className="mx-auto h-4 w-4" />
                </button>
              </div>
              <NavList onClick={() => setOpen(false)} />
              <button onClick={() => { setOpen(false); void signOut().then(() => navigate({ to: '/' })); }}
                className="m-3 flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-destructive">
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </aside>
          </div>
        )}

        <main className="flex-1 overflow-x-auto p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
