import { createFileRoute } from "@tanstack/react-router";

type TipoLembrete = "agua" | "alongar" | "login" | "escovar" | "checkin";

const MENSAGENS: Record<TipoLembrete, { titulo: string; corpo: string; url: string }> = {
  agua: {
    titulo: "💧 Hora de beber água",
    corpo: "Pause 30s e tome um copo. Sua meta agradece!",
    url: "/app/hidratacao",
  },
  alongar: {
    titulo: "🤸 Hora do alongamento",
    corpo: "3 minutos pra soltar o corpo e voltar mais leve.",
    url: "/app/ergonomia",
  },
  login: {
    titulo: "👷 Bom dia! Abra o Canteiro Saudável",
    corpo: "Faça seu check-in do dia e veja a missão de hoje.",
    url: "/app/home",
  },
  escovar: {
    titulo: "🪥 Escovação",
    corpo: "Hora de cuidar do sorriso.",
    url: "/app/odonto",
  },
  checkin: {
    titulo: "✅ Check-in diário",
    corpo: "Como você está se sentindo hoje?",
    url: "/app/home",
  },
};

export const Route = createFileRoute("/api/public/hooks/lembretes-push")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Validação leve do apikey (defesa em profundidade — rota é pública por padrão)
        const apikey = request.headers.get("apikey") ?? "";
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
        if (expected && apikey !== expected) {
          return new Response(JSON.stringify({ error: "apikey inválida" }), {
            status: 401, headers: { "Content-Type": "application/json" },
          });
        }

        let body: { tipo?: string; turno?: string } = {};
        try { body = (await request.json()) as { tipo?: string; turno?: string }; } catch { /* noop */ }
        const tipo = body.tipo as TipoLembrete;
        const turno = (body.turno ?? "todos") as "diurno" | "noturno" | "todos";
        if (!tipo || !MENSAGENS[tipo]) {
          return new Response(JSON.stringify({ error: "tipo inválido" }), {
            status: 400, headers: { "Content-Type": "application/json" },
          });
        }
        if (!["diurno", "noturno", "todos"].includes(turno)) {
          return new Response(JSON.stringify({ error: "turno inválido" }), {
            status: 400, headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Se turno específico, filtra user_ids pelo profiles.turno antes
        let userIdsFiltro: string[] | null = null;
        if (turno !== "todos") {
          const { data: profs, error: e2 } = await supabaseAdmin
            .from("profiles").select("id").eq("turno", turno);
          if (e2) {
            return new Response(JSON.stringify({ error: e2.message }), {
              status: 500, headers: { "Content-Type": "application/json" },
            });
          }
          userIdsFiltro = (profs ?? []).map((p) => p.id);
          if (userIdsFiltro.length === 0) {
            return Response.json({ ok: true, enviados: 0, falhas: 0, tipo, turno, mensagem: "sem usuários nesse turno" });
          }
        }

        let query = supabaseAdmin
          .from("push_subscriptions")
          .select("id, endpoint, p256dh, auth");
        if (userIdsFiltro) query = query.in("user_id", userIdsFiltro);
        const { data: subs, error } = await query;
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }
        if (!subs || subs.length === 0) {
          return Response.json({ ok: true, enviados: 0, falhas: 0, tipo, turno, mensagem: "sem inscrições" });
        }

        const webpush = (await import("web-push")).default;
        const publicKey = "BEQEmCWfN-CicoAUoZvc5-owfvfGBQTSVPj8b9vj_J1a2GeAW6MIbCCEVBPbnTSiFrJD1ZL2a24AtaQ5KYLpGqU";
        const privateKey = process.env.VAPID_PRIVATE_KEY;
        const subject = process.env.VAPID_SUBJECT || "mailto:admin@canteirosaudavel.app";
        if (!privateKey) {
          return new Response(JSON.stringify({ error: "VAPID_PRIVATE_KEY ausente" }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }
        webpush.setVapidDetails(subject, publicKey, privateKey);

        const m = MENSAGENS[tipo];
        const payload = JSON.stringify({ title: m.titulo, body: m.corpo, url: m.url, tag: `lembrete-${tipo}` });

        let enviados = 0, falhas = 0;
        const expirados: string[] = [];
        await Promise.all(subs.map(async (s) => {
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
          }
        }));

        if (expirados.length > 0) {
          await supabaseAdmin.from("push_subscriptions").delete().in("id", expirados);
        }

        return Response.json({ ok: true, tipo, enviados, falhas, expirados: expirados.length, total: subs.length });
      },
    },
  },
});
