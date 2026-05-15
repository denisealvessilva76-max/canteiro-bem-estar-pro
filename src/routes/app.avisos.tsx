import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/avisos")({
  component: Avisos,
});

const tones: Record<string, string> = {
  informativo: 'border-info/40 bg-info/5 text-info',
  saude: 'border-success/40 bg-success/5 text-success',
  lembrete: 'border-warning/40 bg-warning/5 text-warning-foreground',
  urgente: 'border-destructive/50 bg-destructive/5 text-destructive',
};

function Avisos() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: avisos } = useQuery({
    queryKey: ['avisos', user?.id],
    queryFn: async () => {
      const [{ data: avs }, { data: lidos }] = await Promise.all([
        supabase.from('avisos').select('*').eq('publicado', true).order('created_at', { ascending: false }),
        user ? supabase.from('avisos_lidos').select('aviso_id').eq('user_id', user.id) : Promise.resolve({ data: [] as { aviso_id: string }[] }),
      ]);
      const ids = new Set((lidos ?? []).map((l) => l.aviso_id));
      return (avs ?? []).map((a) => ({ ...a, lido: ids.has(a.id) }));
    },
  });

  async function marcarLido(id: string) {
    if (!user) return;
    await supabase.from('avisos_lidos').upsert({ user_id: user.id, aviso_id: id });
    void qc.invalidateQueries({ queryKey: ['avisos'] });
  }

  return (
    <div className="px-5 pb-8 pt-6">
      <Link to="/app/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Início
      </Link>
      <h1 className="mt-3 flex items-center gap-2 text-2xl font-extrabold">
        <Bell className="h-7 w-7 text-info" /> Avisos
      </h1>

      <div className="mt-6 space-y-3">
        {(avisos ?? []).map((a) => (
          <button
            key={a.id} onClick={() => marcarLido(a.id)}
            className={`block w-full rounded-2xl border-2 p-4 text-left ${tones[a.categoria] ?? tones.informativo} ${a.lido ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider">{a.categoria}</span>
              {!a.lido && <span className="h-2 w-2 rounded-full bg-current" />}
            </div>
            <h3 className="mt-2 text-base font-bold text-foreground">{a.titulo}</h3>
            <p className="mt-1 text-sm text-foreground/80">{a.conteudo}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleString('pt-BR')}</p>
          </button>
        ))}
        {avisos?.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">Nenhum aviso no momento.</p>
        )}
      </div>
    </div>
  );
}
