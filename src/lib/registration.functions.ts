import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  codigo: z.string().min(1).max(64),
  matricula: z.string().min(1).max(32),
});

// Normaliza texto removendo espaços, quebras, tabs e caracteres invisíveis
function limparCodigo(texto: string): string {
  return texto
    .replace(/[\s\u00A0\u200B-\u200D\uFEFF]+/g, "")
    .toUpperCase();
}

// Valida o código da empresa E se a matrícula está pré-autorizada,
// tudo no servidor. A tabela `matriculas_autorizadas` não é mais legível
// publicamente, então o lookup precisa rodar com service role.
export const validarCodigoEmpresa = createServerFn({ method: "POST" })
  .inputValidator((input) => Input.parse(input))
  .handler(async ({ data }) => {
    const expectedRaw = process.env.COMPANY_REGISTRATION_CODE;
    if (!expectedRaw || !expectedRaw.trim()) {
      console.error("COMPANY_REGISTRATION_CODE não configurado");
      throw new Error("Cadastro indisponível no momento. Procure o RH.");
    }
    const expected = limparCodigo(expectedRaw);
    if (limparCodigo(data.codigo) !== expected) {
      return { ok: false as const, motivo: "codigo" as const };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const matricula = data.matricula.trim();
    const { data: row, error } = await supabaseAdmin
      .from("matriculas_autorizadas")
      .select("matricula")
      .eq("matricula", matricula)
      .maybeSingle();
    if (error) {
      console.error("Falha ao consultar matriculas_autorizadas", error.message);
      throw new Error("Não foi possível validar a matrícula. Tente novamente.");
    }
    if (!row) {
      return { ok: false as const, motivo: "matricula" as const };
    }
    return { ok: true as const };
  });
