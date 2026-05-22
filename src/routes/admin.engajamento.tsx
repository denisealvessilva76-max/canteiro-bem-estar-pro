import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Send, Activity, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/admin/engajamento')({ component: AdminEngajamento });

function AdminEngajamento() {
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tipo, setTipo] = useState('emergencia');
  const [horas, setHoras] = useState(2);

  // Heatmap por hora (últimos 7d) — usa hidratacao_logs + checkin_diario
  const { data: heatmap } = useQuery({
    queryKey: ['heatmap-uso'],
    queryFn: async () => {
      const seteDias = new Date(Date.now() - 7 * 86400000).toISOString();
      const [hidr, ck] = await Promise.all([
        supabase.from('hidratacao_logs').select('created_at').gte('created_at', seteDias),
        supabase.from('checkin_diario').select('created_at').gte('created_at', seteDias),
      ]);
      const buckets = Array.from({ length: 24 }, () => 0);
      [...(hidr.data ?? []), ...(ck.data ?? [])].forEach((r) => {
        const h = new Date(r.created_at).getHours();
        buckets[h] += 1;
      });
      const max = Math.max(...buckets, 1);
      return buckets.map((v, i) => ({ hora: i, valor: v, pct: v / max }));
    },
  });

  const { data: contratos } = useQuery({
    queryKey: ['admin-contratos'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('contrato, empreiteira, pontos_acumulados, ofensiva_dias');
      const map = new Map<string, { contrato: string; empreiteira: string; total: number; pts: number; ofensiva: number }>();
      (data ?? []).forEach((p) => {
        const k = `${p.empreiteira ?? '—'} · ${p.contrato ?? '—'}`;
        const cur = map.get(k) ?? { contrato: p.contrato ?? '—', empreiteira: p.empreiteira ?? '—', total: 0, pts: 0, ofensiva: 0 };
        cur.total += 1;
        cur.pts += p.pontos_acumulados ?? 0;
        cur.ofensiva += p.ofensiva_dias ?? 0;
        map.set(k, cur);
      });
      return Array.from(map.values());
    },
  });

  async function dispararAlerta() {
    if (!titulo || !mensagem) {
      toast.error('Preencha título e mensagem');
      return;
    }
    const expira = horas > 0 ? new Date(Date.now() + horas * 3600_000).toISOString() : null;
    const { error } = await supabase.from('alertas_vermelhos').insert({ titulo, mensagem, tipo, expira_em: expira });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Alerta enviado a todos os trabalhadores');
    setTitulo(''); setMensagem('');
  }

  function exportarContratos() {
    if (!contratos) return;
    const linhas = [
      ['empreiteira', 'contrato', 'funcionarios', 'pontos_totais', 'ofensiva_total'].join(','),
      ...contratos.map((c) => [c.empreiteira, c.contrato, c.total, c.pts, c.ofensiva].join(',')),
    ].join('\n');
    const blob = new Blob([linhas], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `adesao-contratos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">Engajamento & Comando</h1>
        <p className="text-sm text-muted-foreground">Heatmap, alertas vermelhos e exportação por contrato.</p>
      </header>

      {/* Alerta vermelho */}
      <section className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-5">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-destructive">
          <AlertTriangle className="h-5 w-5" /> Modo alerta vermelho
        </h2>
        <p className="text-xs text-muted-foreground">Push prioritário para todos: chuva forte, evacuação, emergências.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título (ex.: EVACUAÇÃO ÁREA 3)" className="h-11 rounded-xl border-2 border-input bg-card px-3" />
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="h-11 rounded-xl border-2 border-input bg-card px-3">
            <option value="emergencia">Emergência</option>
            <option value="clima">Clima severo</option>
            <option value="evacuacao">Evacuação</option>
          </select>
        </div>
        <textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={3} placeholder="Mensagem clara e direta" className="mt-2 w-full rounded-xl border-2 border-input bg-card p-3 text-sm" />
        <div className="mt-2 flex items-center gap-3">
          <label className="text-xs text-muted-foreground">Expira em:</label>
          <input type="number" min={0} max={48} value={horas} onChange={(e) => setHoras(parseInt(e.target.value) || 0)} className="h-9 w-20 rounded-lg border-2 border-input bg-card px-2" />
          <span className="text-xs">horas (0 = sem expiração)</span>
        </div>
        <button onClick={() => void dispararAlerta()} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-destructive text-sm font-bold text-destructive-foreground sm:w-auto sm:px-6">
          <Send className="h-4 w-4" /> Disparar alerta
        </button>
      </section>

      {/* Heatmap horário */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Activity className="h-5 w-5 text-primary" /> Heatmap de uso (últimos 7 dias)
        </h2>
        <p className="text-xs text-muted-foreground">Quando o pessoal mais usa o app, por hora do dia.</p>
        <div className="mt-3 grid grid-cols-12 gap-1">
          {heatmap?.map((h) => (
            <div key={h.hora} className="text-center">
              <div className="rounded-md bg-primary" style={{ height: `${Math.max(6, h.pct * 64)}px`, opacity: Math.max(0.15, h.pct) }} title={`${h.valor} interações`} />
              <p className="mt-1 text-[9px] text-muted-foreground">{h.hora}h</p>
            </div>
          ))}
        </div>
      </section>

      {/* Export contratos */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Adesão por contrato / empreiteira</h2>
          <button onClick={exportarContratos} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="py-2">Empreiteira</th>
                <th>Contrato</th>
                <th>Funcionários</th>
                <th>Pontos</th>
                <th>Ofensiva</th>
              </tr>
            </thead>
            <tbody>
              {contratos?.map((c, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 font-medium">{c.empreiteira}</td>
                  <td>{c.contrato}</td>
                  <td>{c.total}</td>
                  <td>{c.pts}</td>
                  <td>{c.ofensiva}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
