import { Flame, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saudacao } from '@/lib/canteiro';
import { nivelPorPontos, NIVEIS } from '@/lib/gamificacao';

export function AppHeader({ subtitle }: { subtitle?: string }) {
  const { profile } = useAuth();
  const hi = saudacao();
  const nome = profile?.nome?.split(' ')[0] ?? '';
  const pts = profile?.pontos_acumulados ?? 0;
  const nivel = nivelPorPontos(pts);
  const info = NIVEIS[nivel];
  return (
    <header className="bg-gradient-primary px-5 pb-8 pt-10 text-primary-foreground safe-top">
      <p className="text-sm/none opacity-85">{hi},</p>
      <div className="mt-1 flex items-center gap-2">
        <h1 className="text-2xl font-bold">{nome || 'trabalhador'} 👷</h1>
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
          {info.emoji} {info.label}
        </span>
      </div>
      {subtitle && <p className="mt-2 text-sm opacity-85">{subtitle}</p>}
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
