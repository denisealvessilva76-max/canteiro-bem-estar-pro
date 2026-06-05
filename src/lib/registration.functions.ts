import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  codigo: z.string().min(1).max(64),
});

// Normaliza texto removendo espaços, quebras, tabs e caracteres invisíveis
// (zero-width space, non-breaking space, BOM, etc.) — tanto do início/fim
// quanto do meio da string.
function limparCodigo(texto: string): string {
  return texto
    .replace(/[\s\u00A0\u200B-\u200D\uFEFF]+/g, "")
    .toUpperCase();
}

// Valida o código da empresa no servidor. O código real fica em
// process.env.COMPANY_REGISTRATION_CODE (com fallback para o valor histórico
// para não quebrar cadastros enquanto a secret não é configurada).
export const validarCodigoEmpresa = createServerFn({ method: "POST" })
  .inputValidator((input) => Input.parse(input))
  .handler(async ({ data }) => {
    const expected = limparCodigo(
      process.env.COMPANY_REGISTRATION_CODE ?? "00345"
    );
    const ok = limparCodigo(data.codigo) === expected;
    if (!ok) {
      return { ok: false as const };
    }
    return { ok: true as const };
  });
