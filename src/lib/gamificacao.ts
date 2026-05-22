// Avatar evolutivo (capacete) e frases motivacionais por cargo

export type Nivel = 'bronze' | 'prata' | 'ouro' | 'diamante';

export const NIVEIS: Record<Nivel, { min: number; cor: string; emoji: string; label: string; gradient: string }> = {
  bronze: { min: 0, cor: '#cd7f32', emoji: '🥉', label: 'Bronze', gradient: 'from-amber-700 to-amber-500' },
  prata: { min: 200, cor: '#c0c0c0', emoji: '🥈', label: 'Prata', gradient: 'from-slate-400 to-slate-200' },
  ouro: { min: 600, cor: '#ffd700', emoji: '🥇', label: 'Ouro', gradient: 'from-yellow-500 to-amber-300' },
  diamante: { min: 1500, cor: '#7dd3fc', emoji: '💎', label: 'Diamante', gradient: 'from-cyan-400 to-sky-200' },
};

export function nivelPorPontos(pontos: number): Nivel {
  if (pontos >= NIVEIS.diamante.min) return 'diamante';
  if (pontos >= NIVEIS.ouro.min) return 'ouro';
  if (pontos >= NIVEIS.prata.min) return 'prata';
  return 'bronze';
}

export function proximoNivel(pontos: number): { proximo: Nivel | null; faltam: number } {
  const atual = nivelPorPontos(pontos);
  const ordem: Nivel[] = ['bronze', 'prata', 'ouro', 'diamante'];
  const idx = ordem.indexOf(atual);
  if (idx === ordem.length - 1) return { proximo: null, faltam: 0 };
  const prox = ordem[idx + 1];
  return { proximo: prox, faltam: NIVEIS[prox].min - pontos };
}

// Frases motivacionais por cargo (fallback genérico se cargo desconhecido)
const FRASES_GENERICAS = [
  'Bom dia de obra! Hidratação em dia, EPI no corpo.',
  'Cada copo de água é um tijolo a mais na sua saúde.',
  'Sua família te espera inteiro em casa. Cuide-se.',
  'O canteiro é forte porque você é forte.',
];

const FRASES_POR_CARGO: Record<string, string[]> = {
  pedreiro: [
    'Coluna firme, joelho dobrado: levanta peso com técnica.',
    'Massa boa não vale dor nas costas. Alongue antes de assentar.',
  ],
  eletricista: [
    'Antes do fio: confira o EPI e a chave geral.',
    'Choque não avisa. Luva isolante salva vida.',
  ],
  soldador: [
    'Máscara abaixada, pulmão protegido. Sem fumaça no rosto.',
    'Hidrate o dobro: o arco voltaico desidrata rápido.',
  ],
  carpinteiro: [
    'Serra ligada, atenção redobrada. Óculos sempre.',
    'Madeira boa, postura melhor ainda.',
  ],
  armador: [
    'Vergalhão pesa. Pede ajuda, não compete com a coluna.',
    'Luva de raspa é amiga dos seus dedos.',
  ],
  pintor: [
    'Andaime nivelado, cinto travado. Sem atalho.',
    'Vapor de tinta cansa. Pausa, água, ar livre.',
  ],
  encarregado: [
    'Time saudável produz mais. Cobre EPI com firmeza.',
    'Seu exemplo no canteiro vale por mil avisos.',
  ],
  servente: [
    'Pegou peso? Dobra o joelho, mantém a coluna reta.',
    'Hidratação é seu motor. Não pula o copo.',
  ],
};

export function fraseDoDia(cargo: string | null | undefined): string {
  const lista = (cargo && FRASES_POR_CARGO[cargo.toLowerCase()]) || FRASES_GENERICAS;
  const dia = new Date().getDate();
  return lista[dia % lista.length];
}

export function semanaAtualISO(): string {
  const d = new Date();
  const dia = d.getDay(); // 0 dom .. 6 sab
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function isSextaFeira(): boolean {
  return new Date().getDay() === 5;
}
