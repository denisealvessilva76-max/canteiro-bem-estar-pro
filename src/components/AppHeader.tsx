import { Flame, Sparkles, ThermometerSun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saudacao } from '@/lib/canteiro';
import { nivelPorPontos, NIVEIS } from '@/lib/gamificacao';
import { useClimaObra, nivelCalor } from '@/lib/clima';

export function AppHeader({ subtitle }: { subtitle?: string }) {
  const { profile } = useAuth();
  const { data: clima } = useClimaObra();
  const hi = saudacao();
  const nome = profile?.nome?.split(' ')[0] ?? '';
  const pts = profile?.pontos_acumulados ?? 0;
  const nivel = nivelPorPontos(pts);
  const info = NIVEIS[nivel];

  const calor = nivelCalor(clima?.temperatura);
  // Gradient reativo ao clima — gestão de risco dinâmica
  const headerBg =
    calor === "extremo"
      ? "bg-gradient-to-br from-orange-600 via-orange-500 to-red-500"
      : calor === "quente"
      ? "bg-gradient-to-br from-amber-500 via-orange-400 to-yellow-500"
      : "bg-gradient-primary";

  return (
    <header className={`${headerBg} px-5 pb-8 pt-10 text-primary-foreground safe-top transition-colors duration-700`}>
      <p className="text-sm/none opacity-85">{hi},</p>
      <div className="mt-1 flex items-center gap-2">
        <h1 className="text-2xl font-bold">{nome || 'trabalhador'} 👷</h1>
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
          {info.emoji} {info.label}
        </span>
      </div>
      {subtitle && <p className="mt-2 text-sm opacity-85">{subtitle}</p>}

      {calor !== "ameno" && clima && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/15 px-3 py-2 backdrop-blur">
          <ThermometerSun className="h-4 w-4 shrink-0" />
          <p className="text-xs font-semibold leading-tight">
            {calor === "extremo" ? "Alerta de calor extremo" : "Calor elevado"}
            {" — "}
            {Math.round(clima.temperatura)}°C agora.
            Sua meta de água aumentou em {calor === "extremo" ? "500" : "250"} ml.
          </p>
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
          <Sparkles className="h-5 w-5" />
          <div>
            <div className="text-xs opacity-80">Pontos</div>
            <div className="text-lg font-bold leading-none">{pts}</div>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-2xl bg-accent/95 px-4 py-3 text-accent-foreground">
          <Flame className="h-5 w-5 fill-current" />
          <div>
            <div className="text-xs opacity-90">Ofensiva</div>
            <div className="text-lg font-bold leading-none">{profile?.ofensiva_dias ?? 0} dias</div>
          </div>
        </div>
      </div>
    </header>
  );
}
