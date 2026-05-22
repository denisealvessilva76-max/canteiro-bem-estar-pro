import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Mostra o recorde pessoal do empregado num determinado jogo.
export function PlacarPessoal({ jogo, label = 'Seu recorde' }: { jogo: string; label?: string }) {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['placar', jogo, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('jogo_scores')
        .select('pontos, acertos, total, created_at')
        .eq('user_id', user!.id)
        .eq('jogo', jogo)
        .order('pontos', { ascending: false })
        .limit(1);
      return data?.[0] ?? null;
    },
  });

  if (!data) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
        <Trophy className="h-4 w-4" /> Sem recorde ainda — jogue pela primeira vez!
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50 p-3 text-xs">
      <span className="flex items-center gap-2 font-bold text-amber-700">
        <Trophy className="h-4 w-4" /> {label}
      </span>
      <span className="font-extrabold tabular-nums text-amber-900">
        {data.pontos} pts
        {data.acertos != null && data.total != null && (
          <span className="ml-1 font-normal text-amber-700">· {data.acertos}/{data.total}</span>
        )}
      </span>
    </div>
  );
}
