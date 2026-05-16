import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createHash } from "crypto";

// Voz feminina pt-BR calma — Sarah (EXAVITQu4vr4xnSDxMaL) é multilingual e soa natural em pt.
// Alternativas: "FGY2WhTYpPnrIDTdsKH5" (Laura), "XrExE9yKIg1WjnnlVkGX" (Matilda).
const VOZ_PADRAO = "EXAVITQu4vr4xnSDxMaL";

const Input = z.object({
  texto: z.string().min(1).max(2000),
  voiceId: z.string().min(1).max(64).optional(),
  // chave de cache opcional — quando ausente, usa hash(texto+voz)
  cacheKey: z.string().min(1).max(128).optional(),
});

function bucketPath(text: string, voiceId: string, cacheKey?: string) {
  // Sempre derivar um nome ASCII-safe (cacheKey pode conter acentos/emoji/→ etc.)
  const base = cacheKey ? `${cacheKey}|${voiceId}` : `${voiceId}|${text}`;
  const k = createHash("sha1").update(base).digest("hex");
  return `${voiceId}/${k}.mp3`;
}

export const obterNarracao = createServerFn({ method: "POST" })
  .inputValidator((input) => Input.parse(input))
  .handler(async ({ data }) => {
    const voiceId = data.voiceId ?? VOZ_PADRAO;
    const path = bucketPath(data.texto, voiceId, data.cacheKey);
    const SUPABASE_URL = process.env.SUPABASE_URL!;
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/narracoes/${path}`;

    // Verifica cache: faz HEAD na URL pública.
    try {
      const head = await fetch(publicUrl, { method: "HEAD" });
      if (head.ok) return { url: publicUrl, cached: true };
    } catch { /* segue para gerar */ }

    const rawKey = process.env.ELEVENLABS_API_KEY ?? "";
    // Remove espaços, quebras de linha e qualquer caractere fora do ASCII imprimível
    // (a chave às vezes é colada com setas/aspas tipográficas que quebram o header HTTP)
    const key = rawKey.replace(/[^\x21-\x7E]/g, "");
    if (!key) {
      return { url: null, cached: false, error: "ELEVENLABS_API_KEY não configurada" };
    }
    if (key.length < 20) {
      return { url: null, cached: false, error: "ELEVENLABS_API_KEY parece inválida" };
    }

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: data.texto,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.78,
            style: 0.25,
            use_speaker_boost: true,
            speed: 0.92,
          },
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      console.error("ElevenLabs TTS falhou", res.status, body);
      return { url: null, cached: false, error: `ElevenLabs ${res.status}` };
    }

    const arr = new Uint8Array(await res.arrayBuffer());
    const { error: upErr } = await supabaseAdmin
      .storage
      .from("narracoes")
      .upload(path, arr, { contentType: "audio/mpeg", upsert: true });

    if (upErr) {
      console.error("Upload narração falhou", upErr);
      return { url: null, cached: false, error: upErr.message };
    }

    return { url: publicUrl, cached: false };
  });
