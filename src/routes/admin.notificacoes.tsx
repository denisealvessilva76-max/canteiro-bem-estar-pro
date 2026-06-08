import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Bell, Send, Smartphone, Users as UsersIcon, Loader2, CheckCircle2 } from "lucide-react";
import { enviarPushTeste } from "@/lib/push.functions";
import { pedirPermissao, registrarSW, inscreverPush } from "@/lib/notificacoes";
import { VAPID_PUBLIC_KEY } from "@/lib/vapid";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/admin/notificacoes")({
  component: AdminNotificacoes,
});

function AdminNotificacoes() {
  const { user } = useAuth();
  const enviar = useServerFn(enviarPushTeste);
  const [titulo, setTitulo] = useState("Teste do Canteiro 🦺");
  const [mensagem, setMensagem] = useState("Se você está vendo isso, o push funcionou!");
  const [url, setUrl] = useState("/app/home");
  const [loading, setLoading] = useState<"local" | "me" | "all" | null>(null);
  const [inscrito, setInscrito] = useState(false);

  async function ativarPushNeste() {
    if (!user) return;
    setLoading("local");
    try {
      await registrarSW();
      const p = await pedirPermissao();
      if (p !== "granted") {
        toast.error("Permissão negada — habilite nas configurações do navegador.");
        return;
      }
      const r = await inscreverPush(user.id, VAPID_PUBLIC_KEY);
      if (r.ok) {
        setInscrito(true);
        toast.success("Dispositivo inscrito para receber push!");
      } else {
        toast.error(typeof r.reason === 'string' ? `Falha ao inscrever dispositivo: ${r.reason}` : "Falha ao inscrever dispositivo.");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  function dispararLocal() {
    if (typeof Notification === "undefined") {
      toast.error("Navegador sem suporte a notificações.");
      return;
    }
    if (Notification.permission !== "granted") {
      toast.error("Conceda permissão primeiro (botão acima).");
      return;
    }
    new Notification(titulo, { body: mensagem, icon: "/icon-192.png" });
    toast.success("Notificação local disparada!");
  }

  async function enviarPush(scope: "me" | "all") {
    setLoading(scope);
    try {
      const r = await enviar({ data: { scope, titulo, mensagem, url } });
      if (r.enviados === 0 && r.falhas === 0) {
        toast.info(r.mensagem || "Nenhum dispositivo inscrito.");
      } else {
        toast.success(`Enviados: ${r.enviados} • Falhas: ${r.falhas}${r.expirados ? ` • Limpos: ${r.expirados}` : ""}`);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">Notificações de teste</h1>
          <p className="text-sm text-muted-foreground">Dispare notificações manuais para validar a entrega no celular.</p>
        </div>
      </header>

      {/* Conteúdo da notificação */}
      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold">Conteúdo</h2>
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground">Título</label>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground">Mensagem</label>
          <textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={2}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground">URL ao clicar</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
        </div>
      </section>

      {/* Modo A — local */}
      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold">Modo A — teste local neste aparelho</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Abra esta página no celular onde quer testar, ative permissão e dispare. Não exige push server.
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void ativarPushNeste()} disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
            {loading === "local" ? <Loader2 className="h-4 w-4 animate-spin" /> : inscrito ? <CheckCircle2 className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            {inscrito ? "Inscrito" : "Ativar push neste aparelho"}
          </button>
          <button onClick={dispararLocal} disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold">
            <Send className="h-4 w-4" /> Disparar notificação local
          </button>
        </div>
      </section>

      {/* Modo B — push server */}
      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold">Modo B — Web Push (cross-device)</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Envia via servidor para os dispositivos inscritos. Chega mesmo com app fechado (se PWA instalado).
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void enviarPush("me")} disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-info px-3 py-2 text-sm font-bold text-info-foreground disabled:opacity-50">
            {loading === "me" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar para mim
          </button>
          <button onClick={() => void enviarPush("all")} disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-bold text-accent-foreground disabled:opacity-50">
            {loading === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar para todos
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Dica: para receber no celular, abra o app, aceite permissão e clique em "Ativar push neste aparelho" acima (ou no banner da home).
        </p>
      </section>
    </div>
  );
}
