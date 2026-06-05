import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { BugReportButton } from "@/components/BugReportButton";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { Loader2 } from "lucide-react";
import { registrarSW, ativarLembretes, lerCfg } from "@/lib/notificacoes";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/login" });
    if (!loading && user && isAdmin) void navigate({ to: "/admin/dashboard" });
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    if (!user) return;
    void registrarSW().then(() => {
      const cfg = lerCfg();
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        void ativarLembretes(cfg);
      }
    });
    // Re-agenda lembretes quando o app volta ao foco (SW pode ter perdido timers)
    const onVis = () => {
      if (document.visibilityState === 'visible' && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        void ativarLembretes(lerCfg(), { force: true });
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <OfflineIndicator />
      <div className="mx-auto max-w-md">
        <Outlet />
      </div>
      <BugReportButton />
      <BottomNav />
    </div>
  );
}
