import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Retorna o estado das inscrições push do usuário autenticado no backend.
 * Usado pela página de diagnóstico para confirmar que a inscrição realmente
 * foi gravada (não basta o navegador ter um pushManager.getSubscription local).
 */
export const verificarInscricoesUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { endpoint?: string }) => ({
    endpoint: typeof data?.endpoint === "string" ? data.endpoint.slice(0, 1024) : undefined,
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, user_agent, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const total = rows?.length ?? 0;
    const esteDispositivo = data.endpoint
      ? (rows ?? []).find((r) => r.endpoint === data.endpoint) ?? null
      : null;
    return {
      ok: true,
      total,
      esteDispositivo,
      todos: (rows ?? []).map((r) => ({
        id: r.id,
        user_agent: r.user_agent,
        created_at: r.created_at,
        endpointPreview: r.endpoint.slice(0, 60) + "…",
      })),
    };
  });

const STATUS_VALIDOS = new Set(["idle", "ok", "warn", "fail", "loading"]);
function normalizarStatus(v: unknown): string {
  return typeof v === "string" && STATUS_VALIDOS.has(v) ? v : "idle";
}

export type DiagnosticoStatus = "idle" | "ok" | "warn" | "fail" | "loading";

/**
 * Persiste uma execução do diagnóstico de push para o usuário autenticado.
 */
export const salvarDiagnosticoPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    suporte: string;
    permissao: string;
    service_worker: string;
    inscricao_local: string;
    backend_gravado: string;
    entrega: string;
    endpoint?: string | null;
    user_agent?: string | null;
    detalhes?: Record<string, unknown>;
  }) => ({
    suporte: normalizarStatus(data?.suporte),
    permissao: normalizarStatus(data?.permissao),
    service_worker: normalizarStatus(data?.service_worker),
    inscricao_local: normalizarStatus(data?.inscricao_local),
    backend_gravado: normalizarStatus(data?.backend_gravado),
    entrega: normalizarStatus(data?.entrega),
    endpoint: typeof data?.endpoint === "string" ? data.endpoint.slice(0, 1024) : null,
    user_agent: typeof data?.user_agent === "string" ? data.user_agent.slice(0, 512) : null,
    detalhes: data?.detalhes && typeof data.detalhes === "object" ? data.detalhes : {},
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = { ...data, detalhes: data.detalhes as unknown as Record<string, never>, user_id: userId };
    const { data: row, error } = await supabase
      .from("push_diagnosticos")
      .insert(payload)
      .select("id, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id, created_at: row.created_at };
  });

/**
 * Lê o histórico recente do diagnóstico do usuário autenticado.
 */
export const listarDiagnosticosUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { limit?: number }) => ({
    limit: Math.min(Math.max(Number(data?.limit) || 20, 1), 100),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("push_diagnosticos")
      .select("id, created_at, suporte, permissao, service_worker, inscricao_local, backend_gravado, entrega, endpoint, user_agent")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return { ok: true, registros: rows ?? [] };
  });

