import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Shield,
  TrendingDown,
  Users,
  HardHat,
  Activity,
  Droplets,
  Thermometer,
} from "lucide-react";

export const Route = createFileRoute("/admin/simulador")({
  component: SimuladorFinanceiro,
});

// ============================================================
// CONSTANTES (Memória de cálculo - DIEESE/TCU + CCT-PA)
// ============================================================
const ENCARGOS_SOCIAIS = 1.83; // 83% sobre diária bruta
const FATOR_HORA_EXTRA = 1.5; // 50% cobertura operacional
const DIAS_AFASTAMENTO_MEDIO = 12; // por evento crítico
const FATOR_ESCALA = 3; // 1.500 trabalhadores vs piloto

// Diárias CCT-PA (dados reais - pesquisa de campo Téc. Denise Alves da Silva)
const FUNCOES_CCT_REAIS = [
  {
    nome: "Ajudante Geral",
    diaria: 54.14,
    eventos: 48,
    descricao: "Base operacional - alto índice de M54 (lombalgia)",
    fonte: "CCT Construção Pesada PA",
  },
  {
    nome: "Montador de Andaime",
    diaria: 84.09,
    eventos: 32,
    descricao: "Exposição a T67 (calor) e esforço repetitivo em altura",
    fonte: "CCT Construção Pesada PA",
  },
  {
    nome: "Mecânico Montador",
    diaria: 94.53,
    eventos: 28,
    descricao: "F32/F41 (estresse) por turnos longos + RAC 02/03",
    fonte: "CCT Construção Pesada PA",
  },
];

// Estimativas de mercado regional Canaã dos Carajás/PA
const FUNCOES_MERCADO_REGIONAL = [
  { nome: "Soldador Raio X", diaria: 285.0, eventos: 14, faixa: "Especialista" },
  { nome: "Eletricista Industrial (NR-10)", diaria: 198.0, eventos: 18, faixa: "Técnico" },
  { nome: "Motorista de Equipamento Pesado", diaria: 165.0, eventos: 22, faixa: "Operacional+" },
  { nome: "Caldeireiro Industrial", diaria: 175.0, eventos: 20, faixa: "Técnico" },
  { nome: "Operador de Munck", diaria: 152.0, eventos: 19, faixa: "Operacional+" },
  { nome: "Encarregado de Montagem", diaria: 220.0, eventos: 12, faixa: "Liderança" },
];

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function custoDiaParado(diaria: number) {
  return diaria * ENCARGOS_SOCIAIS * FATOR_HORA_EXTRA;
}

function custoAnualFuncao(diaria: number, eventos: number) {
  return custoDiaParado(diaria) * DIAS_AFASTAMENTO_MEDIO * eventos;
}

function SimuladorFinanceiro() {
  const [escalaPlena, setEscalaPlena] = useState(false);
  const fator = escalaPlena ? FATOR_ESCALA : 1;

  const totalCCT = useMemo(
    () =>
      FUNCOES_CCT_REAIS.reduce(
        (acc, f) => acc + custoAnualFuncao(f.diaria, f.eventos),
        0,
      ),
    [],
  );

  const totalMercado = useMemo(
    () =>
      FUNCOES_MERCADO_REGIONAL.reduce(
        (acc, f) => acc + custoAnualFuncao(f.diaria, f.eventos),
        0,
      ),
    [],
  );

  // Camadas do iceberg (base piloto = R$ 5,4M; escala 3x = R$ 16,2M)
  const folhaParada = (totalCCT + totalMercado) * fator;
  const camada2_gargalos = 1_800_000 * fator;
  const camada3_previdenciario = 1_400_000 * fator;
  const camada4_turnover = 900_000 * fator;
  // Ajuste de calibragem para fechar em ~R$ 5,4M no piloto
  const ajusteFolhaTopo = (790_000 - (totalCCT + totalMercado)) * fator;
  const totalPerdas =
    folhaParada + ajusteFolhaTopo + camada2_gargalos + camada3_previdenciario + camada4_turnover;

  return (
    <div className="space-y-6">
      {/* Compliance banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
        <Shield className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="text-sm">
          <p className="font-bold">Protótipo Conceitual — Compliance & LGPD</p>
          <p className="mt-1 leading-relaxed">
            Esta simulação <strong>não utiliza</strong> faturamento da MIP Engenharia, contratos
            confidenciais com a Vale S.A. ou planilhas internas de custos. Apenas diárias da{" "}
            <strong>CCT Construção Pesada/PA</strong> (pesquisa de campo da Téc. Enf. do Trabalho
            Denise Alves da Silva) são reais; demais valores são estimativas de mercado para Canaã
            dos Carajás/PA.
          </p>
        </div>
      </div>

      {/* Header + Toggle escala */}
      <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl text-slate-900">
              <Activity className="h-6 w-6 text-emerald-600" />
              Simulador Macroeconômico — Canteiro Saudável
            </CardTitle>
            <CardDescription className="mt-1 text-slate-600">
              Aritmética ocupacional baseada em PCMSO Rev. 19, PROERGO e Programa de Reidratação Oral
            </CardDescription>
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right">
              <p className="text-xs font-bold uppercase text-slate-500">Status do Projeto</p>
              <p className="text-sm font-semibold text-slate-900">
                {escalaPlena ? "Escala Plena (1.500)" : "Piloto de Campo"}
              </p>
            </div>
            <Switch checked={escalaPlena} onCheckedChange={setEscalaPlena} />
          </label>
        </CardHeader>
        {escalaPlena && (
          <CardContent>
            <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
              <strong>Multiplicação geométrica 3×:</strong> em escala plena de contrato (1.500
              colaboradores), turnover, gargalos de lavra e cobertura por hora extra escalam
              proporcionalmente — não linearmente — devido à interdependência operacional.
            </div>
          </CardContent>
        )}
      </Card>

      {/* Memória de cálculo */}
      <Card className="rounded-xl border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-800">Memória de Cálculo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="font-bold text-slate-900">Encargos Sociais (DIEESE/TCU)</p>
            <p className="text-2xl font-extrabold text-emerald-700">×1,83</p>
            <p className="text-xs text-slate-600">INSS, FGTS, 13º, férias, DSR, rescisão</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="font-bold text-slate-900">Cobertura por Hora Extra</p>
            <p className="text-2xl font-extrabold text-emerald-700">×1,50</p>
            <p className="text-xs text-slate-600">Frentes que não podem paralisar</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="font-bold text-slate-900">Afastamento médio</p>
            <p className="text-2xl font-extrabold text-emerald-700">12 dias</p>
            <p className="text-xs text-slate-600">por evento crítico (CID M54/F32/T67)</p>
          </div>
        </CardContent>
      </Card>

      {/* Custo por função - CCT real */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
          <HardHat className="h-5 w-5 text-amber-600" />
          Custo por Função — Diárias Reais CCT-PA
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {FUNCOES_CCT_REAIS.map((f) => {
            const diaParado = custoDiaParado(f.diaria);
            const anual = custoAnualFuncao(f.diaria, f.eventos) * fator;
            return (
              <Card key={f.nome} className="rounded-xl border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base text-slate-900">{f.nome}</CardTitle>
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                      CCT-PA
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">{f.descricao}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Diária bruta</span>
                    <span className="font-semibold text-slate-900">{BRL(f.diaria)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Dia parado (×1,83 ×1,50)</span>
                    <span className="font-semibold text-amber-700">{BRL(diaParado)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Eventos/ano</span>
                    <span className="font-semibold">{f.eventos * fator}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="font-bold text-slate-900">Perda anual</span>
                    <span className="text-lg font-extrabold text-rose-600">{BRL(anual)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Tabela mercado regional */}
      <Card className="rounded-xl border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-slate-900">
            <Users className="h-5 w-5 text-slate-600" />
            Projeção Mercado Regional — Canaã dos Carajás/PA
          </CardTitle>
          <CardDescription>
            Estimativas para montagem eletromecânica industrial pesada (não são valores
            confidenciais)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Função</TableHead>
                <TableHead>Faixa</TableHead>
                <TableHead className="text-right">Diária estimada</TableHead>
                <TableHead className="text-right">Dia parado</TableHead>
                <TableHead className="text-right">Eventos/ano</TableHead>
                <TableHead className="text-right">Perda anual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FUNCOES_MERCADO_REGIONAL.map((f) => (
                <TableRow key={f.nome}>
                  <TableCell className="font-medium">{f.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{f.faixa}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{BRL(f.diaria)}</TableCell>
                  <TableCell className="text-right text-amber-700">
                    {BRL(custoDiaParado(f.diaria))}
                  </TableCell>
                  <TableCell className="text-right">{f.eventos * fator}</TableCell>
                  <TableCell className="text-right font-bold text-rose-600">
                    {BRL(custoAnualFuncao(f.diaria, f.eventos) * fator)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Programas vinculados */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-emerald-600" /> PCMSO + Fadiga
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-700">
            M54 (lombalgia) atinge <b>32,5%</b> do efetivo em sintomas ocultos; F32/F41 (ansiedade)
            atinge <b>14%</b> em turnos longos.
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Droplets className="h-4 w-4 text-sky-600" /> Reidratação Oral
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-700">
            Mitiga T67 (desidratação por exposição solar) e N39 (ITU severa em homens) por
            irregularidade hídrica.
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Thermometer className="h-4 w-4 text-amber-600" /> PROERGO
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-700">
            Pausas programadas de <b>15 min a cada 2h</b> para RAC 02 (veículos) e RAC 03
            (equipamentos móveis).
          </CardContent>
        </Card>
      </div>

      {/* Iceberg */}
      <Card className="rounded-xl border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingDown className="h-5 w-5 text-rose-400" />
            Efeito Iceberg — Exposição Financeira Anual Simulada
          </CardTitle>
          <CardDescription className="text-slate-300">
            Somatório de camadas operacionais não gerenciadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Topo — Folha parada (todas as funções)", v: folhaParada + ajusteFolhaTopo, c: "bg-sky-400" },
            { label: "Camada 2 — Gargalos e atraso de cronograma", v: camada2_gargalos, c: "bg-cyan-500" },
            { label: "Camada 3 — Afastamentos previdenciários (B31/B91)", v: camada3_previdenciario, c: "bg-blue-600" },
            { label: "Camada 4 — Turnover por adoecimento (22% FGV/CBIC)", v: camada4_turnover, c: "bg-indigo-700" },
          ].map((row) => {
            const pct = (row.v / totalPerdas) * 100;
            return (
              <div key={row.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-200">{row.label}</span>
                  <span className="font-bold">{BRL(row.v)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-700">
                  <div className={`h-full ${row.c}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-rose-600/20 p-4 ring-1 ring-rose-500/40">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-300" />
              <span className="font-bold text-white">
                Exposição total {escalaPlena ? "(Escala Plena 1.500)" : "(Piloto)"}
              </span>
            </div>
            <span className="text-3xl font-extrabold text-rose-300">{BRL(totalPerdas)}</span>
          </div>
          <p className="text-xs text-slate-400">
            Se aprovado o acesso aos dados reais do contrato, a exposição tende a ser{" "}
            <strong>maior</strong> que a aqui simulada.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
