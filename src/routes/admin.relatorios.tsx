import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, AlertTriangle, TrendingDown, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/relatorios")({
  component: AdminRelatorios,
});

function inicioMes(ref: Date) { return new Date(ref.getFullYear(), ref.getMonth(), 1); }
function fimMes(ref: Date) { return new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59); }
function toISO(d: Date) { return d.toISOString(); }

function AdminRelatorios() {
  const [mesRef, setMesRef] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [ano, mesNum] = mesRef.split('-').map(Number);
  const ini = inicioMes(new Date(ano, mesNum - 1, 1));
  const fim = fimMes(new Date(ano, mesNum - 1, 1));
  const diasNoMes = fim.getDate();

  const { data, isLoading } = useQuery({
    queryKey: ['relatorio-mes', mesRef],
    queryFn: async () => {
      const [{ data: profiles }, { data: hidratacao }, { data: checkins }, { data: alongamentos }, { data: progresso }] = await Promise.all([
        supabase.from('profiles').select('id, nome, matricula, cargo, turno, pontos_acumulados'),
        supabase.from('hidratacao_logs').select('user_id, data, ml_consumidos').gte('created_at', toISO(ini)).lte('created_at', toISO(fim)),
        supabase.from('checkin_diario').select('user_id, data').gte('created_at', toISO(ini)).lte('created_at', toISO(fim)),
        supabase.from('alongamento_logs').select('user_id, data').gte('created_at', toISO(ini)).lte('created_at', toISO(fim)),
        supabase.from('progresso_desafios').select('user_id, status, iniciado_em, concluido_em').gte('iniciado_em', toISO(ini)).lte('iniciado_em', toISO(fim)),
      ]);
      return { profiles: profiles ?? [], hidratacao: hidratacao ?? [], checkins: checkins ?? [], alongamentos: alongamentos ?? [], progresso: progresso ?? [] };
    },
  });

  const linhas = useMemo(() => {
    if (!data) return [];
    return data.profiles.map((p) => {
      const hid = data.hidratacao.filter((h) => h.user_id === p.id);
      const ml = hid.reduce((s, r) => s + (r.ml_consumidos ?? 0), 0);
      const diasHid = new Set(hid.map((h) => h.data)).size;
      const ck = data.checkins.filter((c) => c.user_id === p.id);
      const diasCheckin = new Set(ck.map((c) => c.data)).size;
      const al = data.alongamentos.filter((a) => a.user_id === p.id);
      const diasAlong = new Set(al.map((a) => a.data)).size;
      const desafiosIni = data.progresso.filter((d) => d.user_id === p.id);
      const desafiosOk = desafiosIni.filter((d) => d.status === 'concluido').length;

      const aderenciaCheckin = Math.round((diasCheckin / diasNoMes) * 100);
      const aderenciaHidratacao = Math.round((diasHid / diasNoMes) * 100);
      const aderenciaAlongamento = Math.round((diasAlong / diasNoMes) * 100);
      const indiceGeral = Math.round((aderenciaCheckin + aderenciaHidratacao + aderenciaAlongamento) / 3);

      const alertas: string[] = [];
      if (aderenciaHidratacao < 40) alertas.push('Pouca hidratação');
      if (aderenciaCheckin < 40) alertas.push('Pouco check-in');
      if (aderenciaAlongamento < 30) alertas.push('Pouco alongamento');
      if (desafiosIni.length === 0) alertas.push('Nenhum desafio aceito');

      return {
        id: p.id, nome: p.nome, matricula: p.matricula, cargo: p.cargo ?? '—', turno: p.turno,
        pontos: p.pontos_acumulados, ml, diasHid, diasCheckin, diasAlong,
        desafiosIni: desafiosIni.length, desafiosOk,
        aderenciaCheckin, aderenciaHidratacao, aderenciaAlongamento, indiceGeral,
        alertas,
      };
    }).sort((a, b) => a.indiceGeral - b.indiceGeral); // pior primeiro
  }, [data, diasNoMes]);

  // Agregação por função (cargo)
  const porFuncao = useMemo(() => {
    const map = new Map<string, { qtd: number; somaInd: number; somaHid: number; somaCk: number; somaAl: number }>();
    for (const l of linhas) {
      const k = l.cargo || '—';
      const cur = map.get(k) ?? { qtd: 0, somaInd: 0, somaHid: 0, somaCk: 0, somaAl: 0 };
      cur.qtd += 1; cur.somaInd += l.indiceGeral; cur.somaHid += l.aderenciaHidratacao;
      cur.somaCk += l.aderenciaCheckin; cur.somaAl += l.aderenciaAlongamento;
      map.set(k, cur);
    }
    return Array.from(map.entries())
      .map(([cargo, v]) => ({
        cargo, qtd: v.qtd,
        indice: Math.round(v.somaInd / v.qtd),
        hid: Math.round(v.somaHid / v.qtd),
        ck: Math.round(v.somaCk / v.qtd),
        al: Math.round(v.somaAl / v.qtd),
      }))
      .sort((a, b) => a.indice - b.indice);
  }, [linhas]);

  function exportarCSV() {
    const headers = ['Matrícula', 'Nome', 'Cargo', 'Turno', 'Pontos', 'Check-in (dias)', 'Hidratação (dias)', 'ml total', 'Alongamento (dias)', 'Desafios aceitos', 'Desafios concluídos', '% Check-in', '% Hidratação', '% Alongamento', 'Índice Geral', 'Alertas'];
    const rows = linhas.map((l) => [
      l.matricula, l.nome, l.cargo, l.turno, l.pontos, l.diasCheckin, l.diasHid, l.ml, l.diasAlong, l.desafiosIni, l.desafiosOk,
      l.aderenciaCheckin, l.aderenciaHidratacao, l.aderenciaAlongamento, l.indiceGeral, l.alertas.join('; '),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `canteiro-relatorio-${mesRef}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const totalAlertas = linhas.reduce((s, l) => s + l.alertas.length, 0);
  const focoFuncao = porFuncao[0];

  return (
    <div>
      <h1 className="flex items-center gap-2 text-3xl font-extrabold"><FileText className="h-7 w-7 text-primary" /> Relatório Mensal</h1>
      <p className="mt-1 text-sm text-muted-foreground">Gerado automaticamente com os dados do mês — foco em quem precisa de mais atenção.</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="text-sm">Mês:
          <input type="month" value={mesRef} onChange={(e) => setMesRef(e.target.value)}
            className="ml-2 h-10 rounded-xl border border-input bg-background px-3 text-sm" />
        </label>
        <button onClick={exportarCSV} disabled={!linhas.length} className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50">
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      {isLoading ? <p className="mt-6 text-sm text-muted-foreground">Carregando…</p> : (
        <>
          {/* KPIs */}
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <Kpi icon={Users} label="Trabalhadores" value={linhas.length.toString()} />
            <Kpi icon={TrendingDown} label="Índice médio" value={`${linhas.length ? Math.round(linhas.reduce((s, l) => s + l.indiceGeral, 0) / linhas.length) : 0}%`} />
            <Kpi icon={AlertTriangle} label="Pontos de atenção" value={totalAlertas.toString()} tone="warning" />
            <Kpi icon={FileText} label="Foco da função" value={focoFuncao ? `${focoFuncao.cargo} (${focoFuncao.indice}%)` : '—'} />
          </div>

          {/* Por função */}
          <h2 className="mt-8 text-lg font-bold">Aderência por função</h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs">
                <tr><Th>Cargo / Função</Th><Th>Pessoas</Th><Th>Índice geral</Th><Th>Hidratação</Th><Th>Check-in</Th><Th>Alongamento</Th></tr>
              </thead>
              <tbody>
                {porFuncao.map((f) => (
                  <tr key={f.cargo} className="border-t border-border">
                    <Td><strong>{f.cargo}</strong></Td>
                    <Td>{f.qtd}</Td>
                    <Td><Pct v={f.indice} /></Td>
                    <Td><Pct v={f.hid} /></Td>
                    <Td><Pct v={f.ck} /></Td>
                    <Td><Pct v={f.al} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pessoas que precisam de atenção */}
          <h2 className="mt-8 text-lg font-bold">Trabalhadores com baixa adesão (pior → melhor)</h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs">
                <tr><Th>Matrícula</Th><Th>Nome</Th><Th>Cargo</Th><Th>Índice</Th><Th>Hidratação</Th><Th>Check-in</Th><Th>Alongamento</Th><Th>Desafios</Th><Th>Pontos de atenção</Th></tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.id} className="border-t border-border">
                    <Td>{l.matricula}</Td>
                    <Td><strong>{l.nome}</strong></Td>
                    <Td>{l.cargo}</Td>
                    <Td><Pct v={l.indiceGeral} /></Td>
                    <Td><Pct v={l.aderenciaHidratacao} /></Td>
                    <Td><Pct v={l.aderenciaCheckin} /></Td>
                    <Td><Pct v={l.aderenciaAlongamento} /></Td>
                    <Td>{l.desafiosOk}/{l.desafiosIni}</Td>
                    <Td>
                      {l.alertas.length === 0 ? <span className="text-xs text-success">— ok</span> : (
                        <div className="flex flex-wrap gap-1">
                          {l.alertas.map((a) => <span key={a} className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">{a}</span>)}
                        </div>
                      )}
                    </Td>
                  </tr>
                ))}
                {!linhas.length && <tr><td colSpan={9} className="p-6 text-center text-sm text-muted-foreground">Sem dados para o mês selecionado.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone?: 'warning' }) {
  return (
    <div className={`rounded-2xl border p-4 ${tone === 'warning' ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card'}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4" />{label}</div>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) { return <th className="px-3 py-2 text-left font-semibold">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-3 py-2">{children}</td>; }
function Pct({ v }: { v: number }) {
  const cor = v >= 70 ? 'text-success' : v >= 40 ? 'text-accent' : 'text-destructive';
  return <span className={`font-bold ${cor}`}>{v}%</span>;
}
