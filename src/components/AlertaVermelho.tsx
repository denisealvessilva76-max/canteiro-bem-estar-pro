import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function AlertaVermelho() {
  const { data } = useQuery({
    queryKey: ['alerta-vermelho-ativo'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('alertas_vermelhos')
        .select('*')
        .eq('ativo', true)
        .or(`expira_em.is.null,expira_em.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(1);
      return data?.[0] ?? null;
    },
  });

  if (!data) return null;

  return (
    <div className="animate-pulse rounded-2xl border-2 border-destructive bg-destructive/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-destructive" />
        <div>
          <p className="text-sm font-extrabold uppercase tracking-wide text-destructive">{data.titulo}</p>
          <p className="mt-1 text-sm text-foreground">{data.mensagem}</p>
        </div>
      </div>
    </div>
  );
}
