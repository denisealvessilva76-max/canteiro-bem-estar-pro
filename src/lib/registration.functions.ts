import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  codigo: z.string().min(1).max(64),
});

// Valida o código da empresa no servidor. O código real fica em
// process.env.COMPANY_REGISTRATION_CODE (com fallback para o valor histórico
// para não quebrar cadastros enquanto a secret não é configurada).
export const validarCodigoEmpresa = createServerFn({ method: "POST" })
  .inputValidator((input) => Input.parse(input))
  .handler(async ({ data }) => {
    const expected = (process.env.COMPANY_REGISTRATION_CODE ?? "00345").trim();
    const ok = data.codigo.trim() === expected;
    if (!ok) {
      return { ok: false as const };
    }
    return { ok: true as const };
  });
