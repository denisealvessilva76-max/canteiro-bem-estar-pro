import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bell, CheckCircle2, XCircle, AlertCircle, Loader2, Send, RefreshCw, Smartphone, Server, Cloud,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { registrarSW, pedirPermissao, inscreverPush } from "@/lib/notificacoes";
import { VAPID_PUBLIC_KEY } from "@/lib/vapid";
import { verificarInscricoesUsuario, salvarDiagnosticoPush, listarDiagnosticosUsuario } from "@/lib/push-diagnostico.functions";
import { enviarPushTeste } from "@/lib/push.functions";

export const Route = createFileRoute("/app/diagnostico-push")({
  component: DiagnosticoPush,
});

type Status = "idle" | "ok" | "warn" | "fail" | "loading";

function StatusIcon({ s }: { s: Status }) {
  if (s === "ok") return <CheckCircle2 className="h-5 w-5 text-success" />;
  if (s === "fail") return <XCircle className="h-5 w-5 text-destructive" />;
  if (s === "warn") return <AlertCircle className="h-5 w-5 text-warning" />;
  if (s === "loading") return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  return <div className="h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground/40" />;
}

function DiagnosticoPush() {
  const { user } = useAuth();
  const verificar = useServerFn(verificarInscricoesUsuario);
  const enviar = useServerFn(enviarPushTeste);

  const [suporte, setSuporte] = useState<Status>("idle");
  const [permissao, setPermissao] = useState<Status>("idle");
  const [permTexto, setPermTexto] = useState<string>("");
  const [sw, setSw] = useState<Status>("idle");
  const [swTexto, setSwTexto] = useState<string>("");
  const [subscription, setSubscription] = useState<Status>("idle");
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [backend, setBackend] = useState<Status>("idle");
  const [backendInfo, setBackendInfo] = useState<{ total: number; esteDispositivo: unknown } | null>(null);
  const [entrega, setEntrega] = useState<Status>("idle");
  const [loadingAcao, setLoadingAcao] = useState<string | null>(null);
  const [recebida, setRecebida] = useState<boolean>(false);

  const checarSuporte = useCallback(() => {
    if (typeof window === "undefined") return;
    const ok = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    setSuporte(ok ? "ok" : "fail");
  }, []);

  const checarPermissao = useCallback(() => {
    if (typeof Notification === "undefined") { setPermissao("fail"); setPermTexto("sem suporte"); return; }
    const p = Notification.permission;
    setPermTexto(p);
    setPermissao(p === "granted" ? "ok" : p === "denied" ? "fail" : "warn");
  }, []);

  const checarSW = useCallback(async () => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      setSw("fail"); setSwTexto("sem serviceWorker"); return;
    }
    const reg = await navigator.serviceWorker.getRegistration("/");
    if (reg && reg.active) { setSw("ok"); setSwTexto(`ativo (${reg.active.scriptURL.split("/").pop()})`); }
    else if (reg) { setSw("warn"); setSwTexto("registrado, ainda instalando"); }
    else { setSw("warn"); setSwTexto("não registrado"); }
  }, []);

  const checarSubscription = useCallback(async () => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) { setSubscription("fail"); return; }
    const reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) { setSubscription("warn"); setEndpoint(null); return; }
    const sub = await reg.pushManager.getSubscription();
    if (sub) { setSubscription("ok"); setEndpoint(sub.endpoint); }
    else { setSubscription("warn"); setEndpoint(null); }
  }, []);

  const checarBackend = useCallback(async (ep: string | null) => {
    setBackend("loading");
    try {
      const r = await verificar({ data: { endpoint: ep ?? undefined } });
      setBackendInfo({ total: r.total, esteDispositivo: r.esteDispositivo });
      if (ep && r.esteDispositivo) setBackend("ok");
      else if (r.total > 0) setBackend("warn");
      else setBackend("fail");
    } catch (e) {
      setBackend("fail");
      toast.error((e as Error).message);
    }
  }, [verificar]);

  // Re-roda checagens
  const recarregar = useCallback(async () => {
    checarSuporte();
    checarPermissao();
    await checarSW();
    await checarSubscription();
  }, [checarSuporte, checarPermissao, checarSW, checarSubscription]);

  useEffect(() => { void recarregar(); }, [recarregar]);
  useEffect(() => { void checarBackend(endpoint); }, [endpoint, checarBackend]);

  // Listener pra detectar a chegada da notificação de teste
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "push-recebido-diagnostico") {
        setRecebida(true);
        setEntrega("ok");
        toast.success("Notificação recebida ✅");
      }
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, []);

  // ---- Persistência do diagnóstico no backend ----
  const salvar = useServerFn(salvarDiagnosticoPush);
  const listar = useServerFn(listarDiagnosticosUsuario);
  const [historico, setHistorico] = useState<Array<{
    id: string; created_at: string; suporte: string; permissao: string; service_worker: string;
    inscricao_local: string; backend_gravado: string; entrega: string; user_agent: string | null;
  }>>([]);
  const [ultimoSalvo, setUltimoSalvo] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregarHistorico = useCallback(async () => {
    try {
      const r = await listar({ data: { limit: 10 } });
      setHistorico(r.registros);
    } catch (e) { console.warn("histórico falhou", e); }
  }, [listar]);

  useEffect(() => { void carregarHistorico(); }, [carregarHistorico]);

  const persistir = useCallback(async (motivo: string) => {
    if (!user) return;
    setSalvando(true);
    try {
      await salvar({ data: {
        suporte, permissao, service_worker: sw, inscricao_local: subscription,
        backend_gravado: backend, entrega,
        endpoint, user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        detalhes: { motivo, permTexto, swTexto, backendInfo, recebida },
      }});
      setUltimoSalvo(new Date().toISOString());
      await carregarHistorico();
    } catch (e) {
      console.warn("salvar diag falhou", e);
    } finally { setSalvando(false); }
  }, [user, salvar, suporte, permissao, sw, subscription, backend, entrega, endpoint, permTexto, swTexto, backendInfo, recebida, carregarHistorico]);

  // Snapshot inicial assim que todas as checagens automáticas rodam (estados saem de "idle"/"loading")
  useEffect(() => {
    const prontos = [suporte, permissao, sw, subscription, backend].every((s) => s !== "idle" && s !== "loading");
    if (prontos && !ultimoSalvo) void persistir("snapshot-inicial");
  }, [suporte, permissao, sw, subscription, backend, ultimoSalvo, persistir]);

  // Salva também quando entrega muda para estado final
  useEffect(() => {
    if (entrega === "ok" || entrega === "fail" || entrega === "warn") void persistir(`entrega:${entrega}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entrega]);



  async function acaoPermissao() {
    setLoadingAcao("perm");
    try {
      await registrarSW();
      const p = await pedirPermissao();
      setPermTexto(p);
      setPermissao(p === "granted" ? "ok" : p === "denied" ? "fail" : "warn");
      await checarSW();
    } finally { setLoadingAcao(null); }
  }

  async function acaoInscrever() {
    if (!user) return;
    setLoadingAcao("sub");
    try {
      await registrarSW();
      const r = await inscreverPush(user.id, VAPID_PUBLIC_KEY);
      if (!r.ok) toast.error(`Falha: ${r.reason}`);
      else toast.success("Inscrito no servidor de push.");
      await checarSubscription();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setLoadingAcao(null); }
  }

  async function acaoEnviar() {
    setLoadingAcao("enviar");
    setRecebida(false);
    setEntrega("loading");
    try {
      const r = await enviar({
        data: { scope: "me", titulo: "Diagnóstico ✅", mensagem: "Push de teste chegou no aparelho.", url: "/app/diagnostico-push" },
      });
      if (r.enviados === 0) { setEntrega("fail"); toast.error("Nenhum envio (sem inscrição neste usuário?)"); }
      else {
        toast.info(`Enviados: ${r.enviados} • Falhas: ${r.falhas}. Aguardando chegar…`);
        // Se em 15s não chegou, marca aviso
        setTimeout(() => setEntrega((s) => (s === "loading" ? "warn" : s)), 15000);
      }
    } catch (e) {
      setEntrega("fail");
      toast.error((e as Error).message);
    } finally { setLoadingAcao(null); }
  }

  return (
    <div className="space-y-4 p-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">Diagnóstico de Notificações</h1>
            <p className="text-xs text-muted-foreground">Valida cada etapa do envio de push.</p>
          </div>
        </div>
        <button onClick={() => void recarregar()} className="inline-flex items-center gap-1 rounded-xl border border-border bg-background px-2 py-1.5 text-xs font-bold">
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </button>
      </header>

      <Step icon={<Smartphone className="h-4 w-4" />} status={suporte}
        title="1. Suporte do navegador"
        desc={suporte === "ok" ? "Notification, ServiceWorker e PushManager disponíveis." :
              suporte === "fail" ? "Seu navegador não suporta Web Push. Tente Chrome/Edge/Firefox atualizado." : "Verificando…"}
      />

      <Step icon={<Bell className="h-4 w-4" />} status={permissao}
        title="2. Permissão de notificação"
        desc={`Estado: ${permTexto || "—"}`}
        action={permissao !== "ok" && permissao !== "fail" ? (
          <button onClick={() => void acaoPermissao()} disabled={loadingAcao === "perm"}
            className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50">
            {loadingAcao === "perm" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Solicitar permissão"}
          </button>
        ) : permissao === "fail" ? (
          <span className="text-xs text-destructive">Habilite manualmente nas configurações do navegador.</span>
        ) : null}
      />

      <Step icon={<RefreshCw className="h-4 w-4" />} status={sw}
        title="3. Service Worker"
        desc={swTexto || "—"}
        action={sw !== "ok" ? (
          <button onClick={() => { void registrarSW().then(() => checarSW()); }}
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold">
            Registrar SW
          </button>
        ) : null}
      />

      <Step icon={<Cloud className="h-4 w-4" />} status={subscription}
        title="4. Inscrição no dispositivo"
        desc={endpoint ? `endpoint: ${endpoint.slice(0, 50)}…` : "Sem subscription local. Clique abaixo para inscrever."}
        action={subscription !== "ok" ? (
          <button onClick={() => void acaoInscrever()} disabled={loadingAcao === "sub" || permissao !== "ok"}
            className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50">
            {loadingAcao === "sub" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Inscrever agora"}
          </button>
        ) : null}
      />

      <Step icon={<Server className="h-4 w-4" />} status={backend}
        title="5. Gravado no backend"
        desc={backendInfo
          ? `${backendInfo.total} inscrição(ões) salvas pra você. ${backendInfo.esteDispositivo ? "Este aparelho está incluso." : "Este aparelho NÃO está no backend."}`
          : "Verificando…"}
        action={(
          <button onClick={() => void checarBackend(endpoint)} disabled={backend === "loading"}
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold">
            {backend === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Reverificar"}
          </button>
        )}
      />

      <Step icon={<Send className="h-4 w-4" />} status={entrega}
        title="6. Entrega ponta-a-ponta"
        desc={recebida ? "✅ Notificação recebida pelo Service Worker." :
              entrega === "loading" ? "Aguardando push chegar (até 15s)…" :
              entrega === "warn" ? "Envio feito, mas não confirmamos chegada. Veja se uma notificação apareceu." :
              entrega === "fail" ? "Falhou. Cheque etapas 2–5." :
              "Pressione abaixo pra enviar um push de teste pra este usuário."}
        action={(
          <button onClick={() => void acaoEnviar()} disabled={loadingAcao === "enviar" || subscription !== "ok"}
            className="rounded-xl bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground disabled:opacity-50">
            {loadingAcao === "enviar" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Enviar teste"}
          </button>
        )}
      />

      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-3 text-[11px] text-muted-foreground">
        Dica: em iOS, o push só funciona se o app estiver instalado na tela inicial (PWA). Em desktop/Android funciona com a aba aberta ou app instalado.
      </div>
    </div>
  );
}

function Step({ icon, status, title, desc, action }: {
  icon: React.ReactNode; status: Status; title: string; desc: string; action?: React.ReactNode;
}) {
  return (
    <section className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3">
      <div className="mt-0.5"><StatusIcon s={status} /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-muted-foreground">{icon}</div>
          <h3 className="text-sm font-bold">{title}</h3>
        </div>
        <p className="mt-1 break-words text-xs text-muted-foreground">{desc}</p>
        {action && <div className="mt-2 flex flex-wrap gap-2">{action}</div>}
      </div>
    </section>
  );
}
