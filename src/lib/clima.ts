// Hook de clima da obra (S11D — Canaã dos Carajás)
import { useQuery } from "@tanstack/react-query";

export const OBRA = { nome: "S11D · Canaã dos Carajás (PA)", lat: -6.4119, lon: -50.3461 };

export type ClimaAtual = {
  temperatura: number;
  umidade: number;
  uv: number;
  vento: number;
};

async function fetchClima(): Promise<ClimaAtual> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${OBRA.lat}&longitude=${OBRA.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index&timezone=America%2FBelem`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("clima fetch falhou");
  const j = await r.json();
  if (!j?.current) throw new Error("clima payload inválido");
  return {
    temperatura: j.current.temperature_2m,
    umidade: j.current.relative_humidity_2m,
    uv: j.current.uv_index,
    vento: j.current.wind_speed_10m,
  };
}

export function useClimaObra() {
  return useQuery({
    queryKey: ["clima-obra"],
    queryFn: fetchClima,
    refetchInterval: 15 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// Classificação para reações automáticas da UI
export type NivelCalor = "ameno" | "quente" | "extremo";

export function nivelCalor(temp: number | undefined): NivelCalor {
  if (typeof temp !== "number") return "ameno";
  if (temp >= 33) return "extremo";
  if (temp >= 30) return "quente";
  return "ameno";
}

// Boost de hidratação a aplicar conforme o clima
export function boostHidratacaoMl(temp: number | undefined): number {
  const n = nivelCalor(temp);
  if (n === "extremo") return 500;
  if (n === "quente") return 250;
  return 0;
}
