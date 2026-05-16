import { useQuery } from "@tanstack/react-query";
import { Sun, Droplets, Thermometer, Wind, AlertTriangle, ShieldCheck } from "lucide-react";

// S11D / Canaã dos Carajás - PA
const OBRA = { nome: 'S11D · Canaã dos Carajás (PA)', lat: -6.4119, lon: -50.3461 };

type Wx = {
  temperature_2m: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  uv_index: number;
};

async function fetchWeather(): Promise<Wx> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${OBRA.lat}&longitude=${OBRA.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index&timezone=America%2FBelem`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('weather fetch failed');
  const j = await r.json();
  if (!j?.current) throw new Error('weather payload invalid');
  return j.current as Wx;
}

export function WeatherObras() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['wx', OBRA.lat, OBRA.lon],
    queryFn: fetchWeather,
    refetchInterval: 15 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const t = data?.temperature_2m;
  const h = data?.relative_humidity_2m;
  const uv = data?.uv_index;
  const w = data?.wind_speed_10m;

  const quente = typeof t === 'number' && t >= 32;
  const muitoQuente = typeof t === 'number' && t >= 35;
  const uvAlto = typeof uv === 'number' && uv >= 8;
  const secoAr = typeof h === 'number' && h <= 30;
  const risco = muitoQuente || uvAlto || secoAr;

  const dicas: string[] = [];
  if (muitoQuente) dicas.push('Calor extremo: beba 250 ml de água a cada 20 min e faça pausas à sombra.');
  else if (quente) dicas.push('Hidrate-se a cada 30 min e procure sombra nas pausas.');
  if (uvAlto) dicas.push('UV alto: reaplique protetor solar FPS 50+ a cada 2 horas e use boné/camisa de manga longa.');
  if (secoAr) dicas.push('Ar seco: aumente a ingestão de água e lubrifique os olhos se sentir ardência.');
  if (!risco && data) dicas.push('Condições ok. Mantenha a hidratação regular e use protetor solar.');

  return (
    <div className={`rounded-3xl border p-5 ${risco ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-card'}`}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Sun className="h-4 w-4 text-warning" /> Clima em campo agora
        </h2>
        {risco && <AlertTriangle className="h-5 w-5 text-destructive" />}
      </div>
      <p className="text-xs text-muted-foreground">{OBRA.nome}</p>

      {isLoading && (
        <p className="mt-4 text-sm text-muted-foreground">Carregando clima…</p>
      )}

      {isError && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">Não foi possível obter o clima agora.</p>
          <button onClick={() => refetch()} className="mt-2 text-xs font-bold text-primary">Tentar novamente</button>
        </div>
      )}

      {data && (
        <>
          <div className="mt-3 flex items-end gap-4">
            <p className="text-5xl font-extrabold leading-none">
              {Math.round(t!)}°<span className="text-lg text-muted-foreground">C</span>
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5"><Droplets className="h-3 w-3 text-info" /> Umidade {Math.round(h!)}%</li>
              <li className="flex items-center gap-1.5"><Sun className="h-3 w-3 text-warning" /> UV {uv?.toFixed(1)}</li>
              <li className="flex items-center gap-1.5"><Wind className="h-3 w-3" /> Vento {Math.round(w!)} km/h</li>
              <li className="flex items-center gap-1.5"><Thermometer className="h-3 w-3" /> {muitoQuente ? 'Calor extremo' : quente ? 'Calor' : 'Ameno'}</li>
            </ul>
          </div>

          <ul className="mt-4 space-y-2">
            {dicas.map((d) => (
              <li key={d} className="flex items-start gap-2 rounded-xl bg-background/60 p-2 text-xs">
                <ShieldCheck className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${risco ? 'text-destructive' : 'text-success'}`} />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
