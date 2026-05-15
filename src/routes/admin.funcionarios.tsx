import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/funcionarios")({
  component: Funcionarios,
});

function Funcionarios() {
  const [q, setQ] = useState('');
  const { data } = useQuery({
    queryKey: ['admin-funcionarios'],
    queryFn: async () => {
      const { data: profs } = await supabase.from('profiles').select('*').order('nome');
      const { data: alertas } = await supabase.from('alertas').select('user_id').eq('resolvido', false);
      const set = new Set((alertas ?? []).map((a) => a.user_id));
      return (profs ?? []).map((p) => ({ ...p, temAlerta: set.has(p.id) }));
    },
  });

  const filtrados = (data ?? []).filter((p) =>
    p.nome.toLowerCase().includes(q.toLowerCase()) || p.matricula.includes(q));

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Funcionários</h1>
      <p className="text-sm text-muted-foreground">Lista completa com sinalização de risco</p>

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou matrícula"
          className="h-10 flex-1 bg-transparent text-sm outline-none" />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs font-bold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Matrícula</th>
              <th className="px-4 py-3">Turno</th>
              <th className="px-4 py-3">Pontos</th>
              <th className="px-4 py-3">Ofensiva</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id} className={`border-t border-border ${p.temAlerta ? 'bg-destructive/5' : ''}`}>
                <td className="px-4 py-3 font-semibold">{p.nome}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.matricula}</td>
                <td className="px-4 py-3 capitalize">{p.turno}</td>
                <td className="px-4 py-3 font-bold text-primary">{p.pontos_acumulados}</td>
                <td className="px-4 py-3">{p.ofensiva_dias}🔥</td>
                <td className="px-4 py-3">
                  {p.temAlerta
                    ? <span className="rounded-full bg-destructive/15 px-2 py-1 text-xs font-bold text-destructive">⚠️ Alerta</span>
                    : <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-bold text-success">OK</span>}
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Nenhum funcionário</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
