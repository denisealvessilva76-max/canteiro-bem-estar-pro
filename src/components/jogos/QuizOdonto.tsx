import { QuizBase, type Pergunta } from './QuizBase';

const PERGUNTAS: Pergunta[] = [
  { p: 'Quantas vezes por dia o ideal é escovar os dentes?', opcoes: ['1 vez', '2 vezes', '3 vezes', 'Só de manhã'], certa: 2, explicacao: 'Após cada refeição principal e antes de dormir.' },
  { p: 'Qual é a função do fio dental?', opcoes: ['Clarear os dentes', 'Remover restos entre os dentes', 'Substituir a escova', 'Massagear a gengiva'], certa: 1, explicacao: 'Só a escova não alcança o espaço entre os dentes.' },
  { p: 'Quanto tempo deve durar uma escovação?', opcoes: ['30 segundos', '1 minuto', '2 a 3 minutos', '10 minutos'], certa: 2, explicacao: 'Tempo suficiente para limpar todos os dentes.' },
  { p: 'Sangrou ao escovar. O que fazer?', opcoes: ['Parar de escovar a área', 'Escovar com mais força', 'Continuar escovando suavemente e procurar dentista', 'Ignorar'], certa: 2, explicacao: 'Sangramento costuma ser sinal de gengivite — não pare de escovar, mas avalie.' },
  { p: 'A cárie é causada por:', opcoes: ['Só açúcar', 'Bactérias que se alimentam de açúcar/restos', 'Falta de vitamina', 'Beber água gelada'], certa: 1, explicacao: 'Por isso a escovação remove a placa bacteriana.' },
  { p: 'Quando trocar a escova de dentes?', opcoes: ['A cada 3 meses ou cerdas tortas', '1 vez por ano', 'Só quando quebrar', 'A cada semana'], certa: 0, explicacao: 'Cerdas desgastadas não limpam bem.' },
];

export function QuizOdonto({ onDone }: { onDone?: () => void }) {
  return <QuizBase jogo="odonto_quiz" categoria="odontologia" perguntas={PERGUNTAS} cor="cyan" medalhaCodigo="odonto_quiz" onDone={onDone} />;
}
