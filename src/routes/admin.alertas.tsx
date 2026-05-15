import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/alertas")({
  component: Alertas,
});

const tones: Record<string, string> = {
  critico: 'border-destructive bg-destructive/5',
  atencao: 'border-warning bg-warning/5',
  info: 'border-info bg-info/5',
};

function Alertas() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin-alertas'],
    queryFn: async () => {
      const { data } = await supabase.from('alertas').select('*, profiles(nome, matricula)')
        .order('created_at', { ascending: false }).limit(100);
      return data ?? [];
    },
    refetchInterval: 15000,
  });

  async function resolver(id: string) {
    await supabase.from('alertas').update({ resolvido: true, resolvido_em: new Date().toISOString() }).eq('id', id);
    toast.success('Alerta resolvido');
    void qc.invalidateQueries({ queryKey: ['admin-alertas'] });
  }

  const abertos = (data ?? []).filter((a) => !a.resolvido);
  const resolvidos = (data ?? []).filter((a) => a.resolvido).slice(0, 20);

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Alertas</h1>
      <p className="text-sm text-muted-foreground">Eventos críticos do canteiro</p>

      <h2 className="mt-6 text-base font-bold">Abertos ({abertos.length})</h2>
      <div className="mt-3 space-y-2">
        {abertos.map((a) => (
          <div key={a.id} className={`flex items-center justify-between gap-3 rounded-2xl border-2 p-4 ${tones[a.nivel_urgencia] ?? ''}`}>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase text-muted-foreground">{a.tipo} · {a.nivel_urgencia}</p>
              <p className="mt-1 font-semibold">{a.mensagem}</p>
              <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString('pt-BR')}</p>
            </div>
            <button onClick={() => resolver(a.id)}
              className="flex h-10 items-center gap-1 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">
              <Check className="h-4 w-4" /> Resolver
            </button>
          </div>
        ))}
        {abertos.length === 0 && <p className="rounded-2xl bg-success/5 p-6 text-center text-success">✅ Nenhum alerta aberto</p>}
      </div>

      {resolvidos.length > 0 && (
        <>
          <h2 className="mt-8 text-base font-bold">Resolvidos recentes</h2>
          <ul className="mt-3 space-y-2">
            {resolvidos.map((a) => (
              <li key={a.id} className="rounded-xl border border-border bg-muted/30 p-3 text-sm opacity-75">
                {a.mensagem}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
