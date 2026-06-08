// Helpers do Canteiro Saudável (cálculos, formatação, classificação)

export function matriculaToEmail(matricula: string): string {
  return `mat-${matricula.trim().toLowerCase()}@canteiro.local`;
}

export function calcMetaHidratacao(
  peso: number | null | undefined,
  exposicaoSol: boolean | null | undefined,
  calorIntenso = true,
  climaBoostMl = 0,
): number {
  const p = peso && peso > 0 ? peso : 70;
  const base = Math.round(p * 35);
  const sol = exposicaoSol ? 500 : 0;
  const calor = calorIntenso ? 500 : 0;
  return base + sol + calor + Math.max(0, climaBoostMl);
}

export function classificaPressao(sistolica: number, diastolica: number) {
  if (sistolica >= 140 || diastolica >= 90) return 'alta' as const;
  if (sistolica >= 120 || diastolica >= 80) return 'alerta' as const;
  if (sistolica < 90 || diastolica < 60) return 'baixa' as const;
  return 'normal' as const;
}

export const URINA_NIVEIS = [
  { n: 1, cor: '#FFFCE6', label: 'Excelente', msg: 'Hidratação excelente, continue assim!', danger: false },
  { n: 2, cor: '#FEF6B6', label: 'Bem hidratado', msg: 'Bom nível de hidratação.', danger: false },
  { n: 3, cor: '#FCEC7B', label: 'Hidratação normal', msg: 'Nível adequado.', danger: false },
  { n: 4, cor: '#F3D639', label: 'Leve desidratação', msg: 'Beba mais água nas próximas horas.', danger: false },
  { n: 5, cor: '#E0B520', label: 'Desidratação moderada', msg: 'Aumente o consumo de água agora.', danger: true },
  { n: 6, cor: '#B8861A', label: 'Desidratação severa', msg: 'Beba água imediatamente.', danger: true },
  { n: 7, cor: '#7E5614', label: 'Desidratação crítica', msg: 'Procure ajuda médica.', danger: true },
  { n: 8, cor: '#4A300A', label: 'Crítico', msg: 'Procure ajuda médica imediatamente.', danger: true },
];

export function saudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('pt-BR');
}

export function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export const HUMORES = [
  { icone: '😄', label: 'Ótimo', score: 5 },
  { icone: '🙂', label: 'Bem', score: 4 },
  { icone: '😐', label: 'Neutro', score: 3 },
  { icone: '😟', label: 'Ruim', score: 2 },
  { icone: '😣', label: 'Muito ruim', score: 1 },
];

export const SINTOMAS_PADRAO = [
  { id: 'dor_costas', label: 'Dor nas costas', icone: '🦴' },
  { id: 'dor_ombros', label: 'Dor nos ombros', icone: '💪' },
  { id: 'dor_cabeca', label: 'Dor de cabeça', icone: '🤕' },
  { id: 'tontura', label: 'Tontura', icone: '😵' },
  { id: 'cansaco', label: 'Cansaço excessivo', icone: '😴' },
];
