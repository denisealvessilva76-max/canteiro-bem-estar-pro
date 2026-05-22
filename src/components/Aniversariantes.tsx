import { useQuery } from '@tanstack/react-query';
import { Cake } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function Aniversariantes() {
  const { data } = useQuery({
    queryKey: ['aniversariantes-semana'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('nome, data_nascimento, cargo')
        .not('data_nascimento', 'is', null);
      if (!data) return [];
      const hoje = new Date();
      const fim = new Date();
      fim.setDate(hoje.getDate() + 7);
      return data.filter((p) => {
        if (!p.data_nascimento) return false;
        const d = new Date(p.data_nascimento as string);
        const este = new Date(hoje.getFullYear(), d.getMonth(), d.getDate());
        return este >= new Date(hoje.toDateString()) && este <= fim;
      }).slice(0, 5);
    },
  });

  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <Cake className="h-4 w-4 text-pink-500" /> Aniversariantes da semana
      </h3>
      <ul className="mt-2 space-y-1">
        {data.map((p, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            🎉 <span className="font-medium">{p.nome}</span>
            {p.cargo && <span className="text-xs text-muted-foreground">· {p.cargo}</span>}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] italic text-muted-foreground">Mensagem do RH: parabéns! Que venham muitos canteiros pela frente.</p>
    </div>
  );
}
