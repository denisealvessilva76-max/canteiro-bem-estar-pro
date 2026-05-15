import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, HeartPulse } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { classificaPressao, SINTOMAS_PADRAO, todayISO } from "@/lib/canteiro";
import { insertOrQueue } from "@/lib/offline";

export const Route = createFileRoute("/app/saude")({
  component: Saude,
});

function Saude() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [sis, setSis] = useState('');
  const [dia, setDia] = useState('');
  const [sintomas, setSintomas] = useState<string[]>([]);
  const [outros, setOutros] = useState('');
  const [showOutros, setShowOutros] = useState(false);

  const sisN = parseInt(sis); const diaN = parseInt(dia);
  const classe = sisN && diaN ? classificaPressao(sisN, diaN) : null;

  const { data: historico } = useQuery({
    queryKey: ['saude-historico', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from('saude_logs').select('*')
        .eq('user_id', user!.id).order('created_at', { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  function toggleSintoma(id: string) {
    if (id === 'outros') { setShowOutros((v) => !v); return; }
    setSintomas((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  async function enviar() {
    if (!user) return;
    if (!sisN && !diaN && sintomas.length === 0 && !outros.trim()) {
      toast.error('Informe pressão ou sintomas'); return;
    }
    const allSintomas = [...sintomas];
    if (outros.trim()) allSintomas.push(`outros: ${outros.trim()}`);
    const res = await insertOrQueue('saude_logs', {
      user_id: user.id, data: todayISO(),
      pressao_sistolica: sisN || null, pressao_diastolica: diaN || null,
      sintomas: allSintomas, outros_sintomas: outros.trim() || null,
    });
    if (res.online) toast.success('Sintomas reportados com sucesso. A equipe de saúde foi notificada.');
    else toast.info('Salvo offline');
    setSis(''); setDia(''); setSintomas([]); setOutros(''); setShowOutros(false);
    void qc.invalidateQueries({ queryKey: ['saude-historico'] });
  }

  const tones: Record<string, string> = {
    normal: 'bg-success/10 text-success border-success/30',
    alerta: 'bg-warning/15 text-warning-foreground border-warning/40',
    alta: 'bg-destructive/15 text-destructive border-destructive/40',
    baixa: 'bg-info/15 text-info border-info/40',
  };
  const labels: Record<string, string> = {
    normal: 'Normal — pressão dentro do ideal',
    alerta: 'Atenção — pressão limítrofe',
    alta: 'ALTA — equipe de saúde será avisada',
    baixa: 'BAIXA — equipe de saúde será avisada',
  };

  return (
    <div className="px-5 pb-8 pt-6">
      <Link to="/app/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Início
      </Link>
      <h1 className="mt-3 flex items-center gap-2 text-2xl font-extrabold">
        <HeartPulse className="h-7 w-7 text-destructive" /> Saúde
      </h1>

      <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="text-base font-bold">Pressão arterial</h2>
        <p className="text-xs text-muted-foreground">Diretriz Brasileira 2025</p>
        <div className="mt-4 flex items-center gap-2">
          <input
            value={sis} onChange={(e) => setSis(e.target.value)}
            inputMode="numeric" placeholder="120"
            className="h-14 w-full rounded-2xl border-2 border-input bg-background px-3 text-center text-2xl font-bold outline-none focus:border-primary"
          />
          <span className="text-2xl font-bold text-muted-foreground">/</span>
          <input
            value={dia} onChange={(e) => setDia(e.target.value)}
            inputMode="numeric" placeholder="80"
            className="h-14 w-full rounded-2xl border-2 border-input bg-background px-3 text-center text-2xl font-bold outline-none focus:border-primary"
          />
          <span className="text-xs font-medium text-muted-foreground">mmHg</span>
        </div>
        {classe && (
          <div className={`mt-4 rounded-2xl border-2 p-3 text-sm font-bold ${tones[classe]}`}>
            {labels[classe]}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="text-base font-bold">Sintomas</h2>
        <p className="text-xs text-muted-foreground">Marque o que está sentindo</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {SINTOMAS_PADRAO.map((s) => {
            const ativo = sintomas.includes(s.id);
            return (
              <button
                key={s.id} onClick={() => toggleSintoma(s.id)}
                className={`flex h-14 items-center gap-2 rounded-2xl border-2 px-3 text-sm font-semibold transition ${
                  ativo ? 'border-destructive bg-destructive/10 text-destructive' : 'border-border bg-background'
                }`}
              >
                <span className="text-xl">{s.icone}</span>
                <span className="text-left text-xs">{s.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => toggleSintoma('outros')}
            className={`col-span-2 flex h-14 items-center justify-center gap-2 rounded-2xl border-2 px-3 text-sm font-semibold ${
              showOutros ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background'
            }`}
          >
            ➕ Outros sintomas
          </button>
        </div>
        {showOutros && (
          <textarea
            value={outros} onChange={(e) => setOutros(e.target.value)}
            placeholder="Descreva o que sente..." rows={3}
            className="mt-3 w-full rounded-2xl border-2 border-input bg-background p-3 text-sm outline-none focus:border-primary"
          />
        )}
      </div>

      <button
        onClick={enviar}
        className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-primary text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.98]"
      >
        Enviar para a equipe de saúde
      </button>

      {historico && historico.length > 0 && (
        <>
          <h3 className="mt-8 text-base font-bold">Histórico</h3>
          <ul className="mt-3 space-y-2">
            {historico.map((h) => (
              <li key={h.id} className="rounded-2xl border border-border bg-card p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {h.pressao_sistolica ? `${h.pressao_sistolica}/${h.pressao_diastolica} mmHg` : 'Sintomas'}
                  </span>
                  <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                {h.classificacao_pressao && (
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${tones[h.classificacao_pressao]}`}>
                    {h.classificacao_pressao.toUpperCase()}
                  </span>
                )}
                {h.sintomas && h.sintomas.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">{h.sintomas.join(', ')}</p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
