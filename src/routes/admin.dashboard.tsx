import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Activity, Droplets, AlertTriangle, X, Phone, Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend, ComposedChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/canteiro";


export const Route = createFileRoute("/admin/dashboard")({
  component: Dashboard,
});

type Drill = null | 'ativos' | 'checkins' | 'hidratacao' | 'alertas';

function Dashboard() {
  const [feed, setFeed] = useState<{ tipo: string; texto: string; ts: string; icone: string }[]>([]);
  const [drill, setDrill] = useState<Drill>(null);
  const today = todayISO();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats', today],
    queryFn: async () => {
      const [{ data: profs }, { data: cks }, { data: hidr }, { data: alertas }, { data: along }, { data: progDes }] = await Promise.all([
        supabase.from('profiles').select('id, nome, matricula, turno, telefone, pontos_acumulados'),
        supabase.from('checkin_diario').select('user_id, humor_score, humor_icone, motivo_texto, created_at').eq('data', today),
        supabase.from('hidratacao_logs').select('user_id, ml_consumidos').eq('data', today),
        supabase.from('alertas').select('id, user_id, tipo, mensagem, nivel_urgencia, created_at, resolvido').eq('resolvido', false).order('created_at', { ascending: false }),
        supabase.from('alongamento_logs').select('user_id').eq('data', today),
        supabase.from('progresso_desafios').select('user_id, status, foto_url, foto_validada').not('foto_url', 'is', null).is('foto_validada', null),
      ]);
      const profMap = new Map((profs ?? []).map((p) => [p.id, p]));
      const totalMl = (hidr ?? []).reduce((s, h) => s + h.ml_consumidos, 0);
      const media = profs?.length ? Math.round(totalMl / profs.length) : 0;
      return {
        profs: profs ?? [],
        cks: cks ?? [],
        hidr: hidr ?? [],
        alertas: (alertas ?? []).map((a) => ({ ...a, profile: profMap.get(a.user_id) })),
        along: along ?? [],
        progDes: progDes ?? [],
        mediaMl: media,
      };
    },
    refetchInterval: 30000,
  });

  // Histórico 7 dias
  const { data: serie } = useQuery({
    queryKey: ['admin-serie-7d'],
    queryFn: async () => {
      const dates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().slice(0, 10);
      });
      const desde = dates[0];
      const [{ data: cks }, { data: hidr }, { data: alertas }] = await Promise.all([
        supabase.from('checkin_diario').select('data, humor_score').gte('data', desde),
        supabase.from('hidratacao_logs').select('data, ml_consumidos').gte('data', desde),
        supabase.from('alertas').select('created_at').gte('created_at', desde),
      ]);
      return dates.map((d) => {
        const ck = (cks ?? []).filter((x) => x.data === d);
        const hi = (hidr ?? []).filter((x) => x.data === d);
        const al = (alertas ?? []).filter((x) => x.created_at.slice(0, 10) === d);
        const humor = ck.length ? +(ck.reduce((s, x) => s + x.humor_score, 0) / ck.length).toFixed(1) : 0;
        const ml = hi.reduce((s, x) => s + x.ml_consumidos, 0);
        return {
          dia: d.slice(8, 10) + '/' + d.slice(5, 7),
          checkins: ck.length,
          hidratacao: Math.round(ml / 1000),
          alertas: al.length,
          humor,
        };
      });
    },
    refetchInterval: 60000,
  });

  // Distribuição humor hoje
  const distHumor = useMemo(() => {
    const buckets = new Map<string, number>();
    (stats?.cks ?? []).forEach((c) => buckets.set(c.humor_icone, (buckets.get(c.humor_icone) ?? 0) + 1));
    return Array.from(buckets.entries()).map(([icone, qtd]) => ({ icone, qtd }));
  }, [stats]);

  useEffect(() => {
    const ch = supabase.channel('admin-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alertas' }, (p) => {
        const a = p.new as { tipo: string; mensagem: string; created_at: string };
        setFeed((f) => [{ icone: '🚨', tipo: 'Alerta', texto: a.mensagem, ts: a.created_at }, ...f].slice(0, 30));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'checkin_diario' }, (p) => {
        const c = p.new as { humor_icone: string; created_at: string };
        setFeed((f) => [{ icone: c.humor_icone, tipo: 'Check-in', texto: 'Trabalhador fez check-in', ts: c.created_at }, ...f].slice(0, 30));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hidratacao_logs' }, (p) => {
        const h = p.new as { ml_consumidos: number; created_at: string };
        setFeed((f) => [{ icone: '💧', tipo: 'Hidratação', texto: `+${h.ml_consumidos}ml registrados`, ts: h.created_at }, ...f].slice(0, 30));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alongamento_logs' }, (p) => {
        const c = p.new as { created_at: string };
        setFeed((f) => [{ icone: '🤸', tipo: 'Alongamento', texto: 'Trabalhador concluiu ginástica', ts: c.created_at }, ...f].slice(0, 30));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'saude_logs' }, (p) => {
        const s = p.new as { pressao_sistolica: number | null; pressao_diastolica: number | null; created_at: string };
        if (s.pressao_sistolica) {
          setFeed((f) => [{ icone: '❤️', tipo: 'Pressão', texto: `${s.pressao_sistolica}/${s.pressao_diastolica} mmHg`, ts: s.created_at }, ...f].slice(0, 30));
        }
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, []);

  const COLORS = ['oklch(0.65 0.18 145)', 'oklch(0.72 0.19 55)', 'oklch(0.65 0.13 230)', 'oklch(0.78 0.16 80)', 'oklch(0.60 0.22 25)'];

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '12px',
    fontSize: 12,
    boxShadow: '0 8px 24px -12px rgba(0,0,0,0.2)',
  } as const;

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Visão geral</h1>
      <p className="text-sm text-muted-foreground">Indicadores em tempo real do canteiro · {new Date().toLocaleDateString('pt-BR')}</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KCard onClick={() => setDrill('ativos')} icon={Users} label="Trabalhadores ativos" value={stats?.profs.length ?? '—'} tone="primary" />
        <KCard onClick={() => setDrill('checkins')} icon={Activity} label="Check-ins hoje" value={stats?.cks.length ?? '—'} tone="info" />
        <KCard onClick={() => setDrill('hidratacao')} icon={Droplets} label="Hidratação média" value={stats ? `${(stats.mediaMl / 1000).toFixed(1)}L` : '—'} tone="water" />
        <KCard onClick={() => setDrill('alertas')} icon={AlertTriangle} label="Alertas abertos" value={stats?.alertas.length ?? '—'} tone="danger" />
      </div>


      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft transition hover:shadow-elevated">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Atividade (7 dias)</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">CHECK-INS × ALERTAS</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={serie ?? []} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gCheckins" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.65 0.18 145)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="oklch(0.65 0.18 145)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="dia" fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'oklch(0.65 0.18 145 / 0.08)' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="checkins" stroke="oklch(0.65 0.18 145)" strokeWidth={2.5} fill="url(#gCheckins)" name="Check-ins" />
              <Bar dataKey="alertas" fill="oklch(0.60 0.22 25)" radius={[6, 6, 0, 0]} barSize={18} name="Alertas" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft transition hover:shadow-elevated">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Hidratação total/dia</h2>
            <span className="rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-bold text-info">LITROS</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={serie ?? []} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gWater" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.75 0.15 230)" stopOpacity={1} />
                  <stop offset="100%" stopColor="oklch(0.55 0.18 240)" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="dia" fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'oklch(0.65 0.13 230 / 0.08)' }} />
              <Bar dataKey="hidratacao" fill="url(#gWater)" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft transition hover:shadow-elevated">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Humor médio (7 dias)</h2>
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">0 — 5</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={serie ?? []} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gHumor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.72 0.19 55)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="oklch(0.72 0.19 55)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="dia" fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[0, 5]} fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="humor" stroke="oklch(0.72 0.19 55)" strokeWidth={2.5} fill="url(#gHumor)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft transition hover:shadow-elevated">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Distribuição de humor hoje</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{stats?.cks.length ?? 0} check-ins</span>
          </div>
          {distHumor.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={distHumor}
                  dataKey="qtd"
                  nameKey="icone"
                  innerRadius={48}
                  outerRadius={88}
                  paddingAngle={4}
                  label={(e) => e.icone}
                >
                  {distHumor.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="hsl(var(--card))" strokeWidth={2} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="py-12 text-center text-sm text-muted-foreground">Nenhum check-in hoje ainda</p>}
        </div>
      </div>

      {/* Aprovação rápida de fotos de desafios */}
      {(stats?.progDes.length ?? 0) > 0 && (
        <div className="mt-6 rounded-3xl border border-accent bg-accent/5 p-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-accent">
            <Trophy className="h-4 w-4" /> {stats!.progDes.length} foto(s) de desafio aguardando validação
          </h2>
          <Link to="/admin/desafios" className="mt-2 inline-block text-sm font-bold text-accent underline">Ir para validação →</Link>
        </div>
      )}

      <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="text-base font-bold">Feed em tempo real</h2>
        <p className="text-xs text-muted-foreground">Movimentações dos trabalhadores aparecem aqui automaticamente</p>
        <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
          {feed.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">Aguardando atividade do canteiro...</li>}
          {feed.map((f, i) => (
            <li key={i} className="flex items-center justify-between rounded-xl bg-gradient-to-r from-muted/40 to-transparent p-3 text-sm transition hover:from-primary/10">
              <div><span className="mr-2">{f.icone}</span><span className="font-bold">{f.tipo}</span> · {f.texto}</div>
              <span className="text-xs text-muted-foreground">{new Date(f.ts).toLocaleTimeString('pt-BR')}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Drill-down panel */}
      {drill && stats && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-foreground/40 lg:items-stretch" onClick={() => setDrill(null)}>
          <div onClick={(e) => e.stopPropagation()} className="h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-card p-6 lg:h-full lg:w-[640px] lg:rounded-none lg:rounded-l-3xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold">{titulosDrill[drill]}</h2>
              <button onClick={() => setDrill(null)} className="h-9 w-9 rounded-full bg-muted"><X className="mx-auto h-4 w-4" /></button>
            </div>

            {drill === 'ativos' && (
              <ul className="mt-4 space-y-2">
                {stats.profs.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                    <div>
                      <p className="font-bold">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">Mat. {p.matricula} · {p.turno} · {p.pontos_acumulados} pts</p>
                    </div>
                    {p.telefone && (
                      <a href={`https://wa.me/55${p.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener" className="rounded-lg bg-success/10 p-2 text-success">
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {drill === 'checkins' && (
              <ul className="mt-4 space-y-2">
                {stats.cks.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum check-in hoje</p>}
                {stats.cks.map((c, i) => {
                  const p = stats.profs.find((x) => x.id === c.user_id);
                  return (
                    <li key={i} className="rounded-xl border border-border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-bold">{c.humor_icone} {p?.nome ?? 'Trabalhador'}</p>
                        <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleTimeString('pt-BR')}</span>
                      </div>
                      {c.motivo_texto && <p className="mt-1 text-xs text-muted-foreground">"{c.motivo_texto}"</p>}
                    </li>
                  );
                })}
              </ul>
            )}

            {drill === 'hidratacao' && (
              <ul className="mt-4 space-y-2">
                {(() => {
                  const por = new Map<string, number>();
                  stats.hidr.forEach((h) => por.set(h.user_id, (por.get(h.user_id) ?? 0) + h.ml_consumidos));
                  const arr = Array.from(por.entries()).sort((a, b) => b[1] - a[1]);
                  if (arr.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma hidratação hoje</p>;
                  return arr.map(([uid, ml]) => {
                    const p = stats.profs.find((x) => x.id === uid);
                    return (
                      <li key={uid} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                        <p className="font-bold">{p?.nome ?? '—'} <span className="ml-1 text-xs text-muted-foreground">Mat. {p?.matricula}</span></p>
                        <span className="font-bold text-info">{(ml / 1000).toFixed(2)} L</span>
                      </li>
                    );
                  });
                })()}
              </ul>
            )}

            {drill === 'alertas' && (
              <ul className="mt-4 space-y-2">
                {stats.alertas.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Sem alertas em aberto 🎉</p>}
                {stats.alertas.map((a) => (
                  <li key={a.id} className={`rounded-xl border p-3 text-sm ${a.nivel_urgencia === 'critico' ? 'border-destructive bg-destructive/5' : 'border-warning bg-warning/5'}`}>
                    <div className="flex items-center justify-between">
                      <p className="font-bold">{a.profile?.nome ?? '—'} <span className="ml-1 text-xs text-muted-foreground">Mat. {a.profile?.matricula}</span></p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${a.nivel_urgencia === 'critico' ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning-foreground'}`}>
                        {a.nivel_urgencia}
                      </span>
                    </div>
                    <p className="mt-1 text-xs">{a.mensagem}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString('pt-BR')}</span>
                      {a.profile?.telefone && (
                        <a href={`https://wa.me/55${a.profile.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener"
                          className="ml-auto rounded-lg bg-success px-2 py-1 text-xs font-bold text-success-foreground">
                          📱 WhatsApp
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const titulosDrill: Record<NonNullable<Drill>, string> = {
  ativos: 'Trabalhadores ativos',
  checkins: 'Check-ins de hoje',
  hidratacao: 'Hidratação por trabalhador',
  alertas: 'Alertas abertos',
};

function KCard({ icon: Icon, label, value, tone, onClick }: { icon: React.ElementType; label: string; value: string | number; tone: string; onClick?: () => void }) {
  const tones: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    info: 'bg-info/10 text-info',
    water: 'bg-water/10 text-water',
    danger: 'bg-destructive/10 text-destructive',
  };
  return (
    <button onClick={onClick} className="rounded-2xl border border-border bg-card p-5 text-left shadow-soft transition hover:border-primary">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-3xl font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label} <span className="text-primary">›</span></p>
    </button>
  );
}
