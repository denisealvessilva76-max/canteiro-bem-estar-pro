import { Quote } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fraseDoDia } from '@/lib/gamificacao';

export function FraseMotivacional() {
  const { profile } = useAuth();
  const frase = fraseDoDia(profile?.cargo);
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-accent/10 p-4">
      <div className="flex items-start gap-2">
        <Quote className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-sm font-medium italic text-foreground">{frase}</p>
      </div>
      {profile?.cargo && (
        <p className="mt-1 pl-6 text-[10px] uppercase tracking-wide text-muted-foreground">para {profile.cargo}</p>
      )}
    </div>
  );
}
