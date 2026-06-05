import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Scope = "me" | "all";

export const enviarPushTeste = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { scope: Scope; titulo?: string; mensagem?: string; url?: string }) => {
    if (!data || (data.scope !== "me" && data.scope !== "all")) {
      throw new Error("scope inválido");
    }
    return {
      scope: data.scope,
      titulo: (data.titulo ?? "Canteiro Saudável").slice(0, 120),
      mensagem: (data.mensagem ?? "Notificação de teste do painel admin ✅").slice(0, 300),
      url: (data.url ?? "/app/home").slice(0, 200),
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verifica admin via RLS-aware client (is_admin usa auth.uid())
    const { data: isAdm, error: admErr } = await supabase.rpc("is_admin");
    if (admErr) throw new Error("Falha ao verificar permissão");
    if (!isAdm && data.scope === "all") {
      throw new Error("Acesso negado: apenas admin pode enviar para todos");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Carrega inscrições alvo
    const query = supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth, user_id");
    const { data: subs, error: subsErr } = data.scope === "me"
      ? await query.eq("user_id", userId)
      : await query;
    if (subsErr) throw new Error("Falha ao carregar inscrições");

    if (!subs || subs.length === 0) {
      return { ok: true, enviados: 0, falhas: 0, mensagem: "Nenhuma inscrição encontrada" };
    }

    // Configura web-push
    const webpush = (await import("web-push")).default;
    const publicKey = "BEQEmCWfN-CicoAUoZvc5-owfvfGBQTSVPj8b9vj_J1a2GeAW6MIbCCEVBPbnTSiFrJD1ZL2a24AtaQ5KYLpGqU";
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:admin@canteirosaudavel.app";
    if (!privateKey) throw new Error("VAPID_PRIVATE_KEY ausente");
    webpush.setVapidDetails(subject, publicKey, privateKey);

    const payload = JSON.stringify({
      title: data.titulo,
      body: data.mensagem,
      url: data.url,
    });

    let enviados = 0;
    let falhas = 0;
    const expirados: string[] = [];

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
          enviados++;
        } catch (e: unknown) {
          falhas++;
          const code = (e as { statusCode?: number })?.statusCode;
          if (code === 404 || code === 410) expirados.push(s.id);
          console.error("push falhou", code, (e as Error)?.message);
        }
      }),
    );

    // Limpa inscrições mortas
    if (expirados.length > 0) {
      await supabaseAdmin.from("push_subscriptions").delete().in("id", expirados);
    }

    return { ok: true, enviados, falhas, total: subs.length, expirados: expirados.length };
  });
