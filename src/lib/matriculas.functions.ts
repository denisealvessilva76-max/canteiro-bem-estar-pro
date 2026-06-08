import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RowSchema = z.object({
  matricula: z.string().min(1).max(32),
  nome: z.string().max(255).optional().nullable(),
  turno: z.enum(["diurno", "noturno"]).optional().nullable(),
  cargo: z.string().max(120).optional().nullable(),
  telefone: z.string().max(40).optional().nullable(),
});

export const importarMatriculas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { linhas: unknown[] }) =>
    z.object({ linhas: z.array(RowSchema).min(1).max(5000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roleRow } = await supabase.from("user_roles")
      .select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) throw new Error("Acesso negado");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = data.linhas.map((r) => ({
      matricula: r.matricula.trim(),
      nome: r.nome?.trim() || null,
      turno: r.turno ?? "diurno",
      cargo: r.cargo?.trim() || null,
      telefone: r.telefone?.trim() || null,
      criado_por: userId,
    }));
    const { error, count } = await supabaseAdmin
      .from("matriculas_autorizadas")
      .upsert(payload, { onConflict: "matricula", count: "exact" });
    if (error) throw new Error(error.message);
    return { ok: true, total: count ?? payload.length };
  });
