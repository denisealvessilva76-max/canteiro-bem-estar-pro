import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Activity, Droplets, AlertTriangle, HeartPulse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/canteiro";

export const Route = createFileRoute("/admin/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const [feed, setFeed] = useState<{ tipo: string; texto: string; ts: string }[]>([]);

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const today = todayISO();
      const [{ count: ativos }, { count: ckHoje }, { data: hidr }, { count: alertasN }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('checkin_diario').select('*', { count: 'exact', head: true }).eq('data', today),
        supabase.from('hidratacao_logs').select('ml_consumidos').eq('data', today),
        supabase.from('alertas').select('*', { count: 'exact', head: true }).eq('resolvido', false),
      ]);
      const totalMl = (hidr ?? []).reduce((s, h) => s + h.ml_consumidos, 0);
      const media = ativos ? Math.round(totalMl / ativos) : 0;
      return { ativos: ativos ?? 0, ckHoje: ckHoje ?? 0, mediaMl: media, alertas: alertasN ?? 0 };
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    const ch = supabase.channel('admin-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alertas' }, (p) => {
        const a = p.new as { tipo: string; mensagem: string; created_at: string };
        setFeed((f) => [{ tipo: '🚨 Alerta', texto: a.mensagem, ts: a.created_at }, ...f].slice(0, 20));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'checkin_diario' }, (p) => {
        const c = p.new as { humor_icone: string; created_at: string };
        setFeed((f) => [{ tipo: `${c.humor_icone} Check-in`, texto: 'Trabalhador fez check-in', ts: c.created_at }, ...f].slice(0, 20));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'saude_logs' }, (p) => {
        const s = p.new as { pressao_sistolica: number | null; pressao_diastolica: number | null; created_at: string };
        if (s.pressao_sistolica) {
          setFeed((f) => [{ tipo: '❤️ Pressão', texto: `${s.pressao_sistolica}/${s.pressao_diastolica} mmHg`, ts: s.created_at }, ...f].slice(0, 20));
        }
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Visão geral</h1>
      <p className="text-sm text-muted-foreground">Indicadores em tempo real do canteiro</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card icon={Users} label="Trabalhadores ativos" value={stats?.ativos ?? '—'} tone="primary" />
        <Card icon={Activity} label="Check-ins hoje" value={stats?.ckHoje ?? '—'} tone="info" />
        <Card icon={Droplets} label="Hidratação média" value={stats ? `${(stats.mediaMl / 1000).toFixed(1)}L` : '—'} tone="water" />
        <Card icon={AlertTriangle} label="Alertas abertos" value={stats?.alertas ?? '—'} tone="danger" />
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold">Feed em tempo real</h2>
        <p className="text-xs text-muted-foreground">Atualiza automaticamente conforme o canteiro registra</p>
        <ul className="mt-4 space-y-2">
          {feed.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">Aguardando atividade do canteiro...</li>}
          {feed.map((f, i) => (
            <li key={i} className="flex items-center justify-between rounded-xl bg-muted/40 p-3 text-sm">
              <div><span className="font-bold">{f.tipo}</span> · {f.texto}</div>
              <span className="text-xs text-muted-foreground">{new Date(f.ts).toLocaleTimeString('pt-BR')}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Card({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string | number; tone: string }) {
  const tones: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    info: 'bg-info/10 text-info',
    water: 'bg-water/10 text-water',
    danger: 'bg-destructive/10 text-destructive',
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-3xl font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
