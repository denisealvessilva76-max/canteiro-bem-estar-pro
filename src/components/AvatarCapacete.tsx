import { nivelPorPontos, proximoNivel, NIVEIS } from '@/lib/gamificacao';

type Props = {
  pontos: number;
  nome?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
};

export function AvatarCapacete({ pontos, nome, size = 'md', showProgress = false }: Props) {
  const nivel = nivelPorPontos(pontos);
  const info = NIVEIS[nivel];
  const { proximo, faltam } = proximoNivel(pontos);

  const sizes = {
    sm: { box: 'h-12 w-12', emoji: 'text-2xl', helmet: 'text-3xl' },
    md: { box: 'h-20 w-20', emoji: 'text-4xl', helmet: 'text-5xl' },
    lg: { box: 'h-32 w-32', emoji: 'text-6xl', helmet: 'text-7xl' },
  }[size];

  const inicial = (nome ?? '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${sizes.box} flex items-center justify-center rounded-full bg-gradient-to-br ${info.gradient} shadow-elevated`}>
        <span className="font-extrabold text-white drop-shadow" style={{ fontSize: size === 'lg' ? 48 : size === 'md' ? 28 : 18 }}>
          {inicial}
        </span>
        <div className={`absolute -top-2 ${sizes.helmet}`} title={`Nível ${info.label}`}>
          ⛑️
        </div>
        <div className="absolute -bottom-1 -right-1 rounded-full bg-card px-1.5 py-0.5 text-xs shadow">
          {info.emoji}
        </div>
      </div>
      {showProgress && (
        <div className="w-full text-center">
          <p className="text-xs font-bold" style={{ color: info.cor }}>{info.label}</p>
          {proximo ? (
            <p className="text-[10px] text-muted-foreground">Faltam {faltam} pts → {NIVEIS[proximo].label}</p>
          ) : (
            <p className="text-[10px] text-muted-foreground">Nível máximo!</p>
          )}
        </div>
      )}
    </div>
  );
}
