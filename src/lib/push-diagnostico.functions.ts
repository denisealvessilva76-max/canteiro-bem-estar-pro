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
