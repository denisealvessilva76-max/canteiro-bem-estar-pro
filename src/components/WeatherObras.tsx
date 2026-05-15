import { useQuery } from "@tanstack/react-query";
import { Sun, Droplets, Thermometer, Wind, AlertTriangle } from "lucide-react";

// Coordenadas aproximadas (Carajás / Canaã dos Carajás - PA)
const OBRAS = [
  { nome: 'Canudos / Canaã', lat: -6.4974, lon: -49.8786 },
  { nome: 'Carajás (Mina)', lat: -6.0667, lon: -50.1500 },
  { nome: 'S11D', lat: -6.4119, lon: -50.3461 },
] as const;

type Wx = { temperature_2m: number; relative_humidity_2m: number; wind_speed_10m: number; uv_index: number };

async function fetchWeather(lat: number, lon: number): Promise<Wx> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index&timezone=America/Belem`;
  const r = await fetch(url);
  const j = await r.json();
  return j.current as Wx;
}

export function WeatherObras() {
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 text-base font-bold">
        <Sun className="h-4 w-4 text-warning" /> Clima em campo · agora
      </h2>
      <p className="text-xs text-muted-foreground">Monitorar para ajustar pausas de hidratação e exposição solar</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {OBRAS.map((o) => <ObraCard key={o.nome} obra={o} />)}
      </div>
    </div>
  );
}

function ObraCard({ obra }: { obra: (typeof OBRAS)[number] }) {
  const { data, isLoading } = useQuery({
    queryKey: ['wx', obra.lat, obra.lon],
    queryFn: () => fetchWeather(obra.lat, obra.lon),
    refetchInterval: 15 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
  });

  const t = data?.temperature_2m ?? null;
  const h = data?.relative_humidity_2m ?? null;
  const uv = data?.uv_index ?? null;
  const w = data?.wind_speed_10m ?? null;

  const risco =
    t !== null && (t >= 35 || (uv !== null && uv >= 8) || (h !== null && h <= 30));

  return (
    <div className={`rounded-2xl border p-4 ${risco ? 'border-destructive bg-destructive/5' : 'border-border bg-muted/30'}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">{obra.nome}</p>
        {risco && <AlertTriangle className="h-4 w-4 text-destructive" />}
      </div>
      {isLoading || !data ? (
        <p className="mt-3 text-xs text-muted-foreground">carregando…</p>
      ) : (
        <>
          <p className="mt-2 text-3xl font-extrabold">{Math.round(t!)}°<span className="text-base text-muted-foreground">C</span></p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li className="flex items-center gap-1.5"><Droplets className="h-3 w-3 text-info" /> Umidade {Math.round(h!)}%</li>
            <li className="flex items-center gap-1.5"><Sun className="h-3 w-3 text-warning" /> UV {uv?.toFixed(1)}</li>
            <li className="flex items-center gap-1.5"><Wind className="h-3 w-3" /> Vento {Math.round(w!)} km/h</li>
          </ul>
          {risco && (
            <p className="mt-2 rounded-lg bg-destructive/10 p-2 text-[11px] font-bold text-destructive">
              ⚠️ Reforçar hidratação, pausas e proteção solar
            </p>
          )}
        </>
      )}
    </div>
  );
}
