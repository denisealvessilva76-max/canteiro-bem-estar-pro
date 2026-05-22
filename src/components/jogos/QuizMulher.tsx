import { QuizBase, type Pergunta } from './QuizBase';

const PERGUNTAS: Pergunta[] = [
  { p: 'A partir de que idade fazer o exame preventivo (Papanicolau)?', opcoes: ['Aos 30 anos', 'Após o início da vida sexual', 'Só depois de gravidez', 'Aos 40 anos'], certa: 1, explicacao: 'Recomendado anualmente após o início da vida sexual.' },
  { p: 'Ciclos menstruais regulares duram quantos dias?', opcoes: ['Sempre exatos 28', 'Entre 21 e 35', 'Entre 10 e 15', 'Mais de 40'], certa: 1, explicacao: 'Variação dentro dessa faixa é normal.' },
  { p: 'Autoexame das mamas: quando fazer?', opcoes: ['Diariamente', 'Mensalmente, ~1 semana após a menstruação', 'Só com dor', 'Anualmente'], certa: 1, explicacao: 'A mama fica menos sensível nesse período.' },
  { p: 'TPM intensa que atrapalha o trabalho:', opcoes: ['É normal e basta aguentar', 'Merece avaliação médica/psicológica', 'Só com chá caseiro', 'Tomar analgésico sempre'], certa: 1, explicacao: 'TDPM existe e tem tratamento.' },
  { p: 'Métodos contraceptivos gratuitos pela UBS incluem:', opcoes: ['Apenas preservativo', 'Pílula, injeção, DIU e preservativo', 'Nenhum', 'Só DIU'], certa: 1, explicacao: 'Tudo gratuito na rede pública.' },
  { p: 'Suspeita de gravidez. Próximo passo?', opcoes: ['Esperar 3 meses', 'Procurar UBS para iniciar pré-natal', 'Tomar remédio caseiro', 'Não contar pra ninguém'], certa: 1, explicacao: 'Pré-natal precoce é essencial.' },
];

export function QuizMulher({ onDone }: { onDone?: () => void }) {
  return <QuizBase jogo="mulher_quiz" categoria="mulher" perguntas={PERGUNTAS} cor="pink" medalhaCodigo="mulher_quiz" onDone={onDone} />;
}
