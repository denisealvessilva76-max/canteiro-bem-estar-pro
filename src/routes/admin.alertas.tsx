import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Phone, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/alertas")({
  component: Alertas,
});

const tones: Record<string, string> = {
  critico: "border-destructive bg-destructive/10",
  atencao: "border-warning bg-warning/10",
  info: "border-info bg-info/10",
};

const ordemUrgencia: Record<string, number> = { critico: 0, atencao: 1, info: 2 };

// Macros: mensagens prontas por tipo de alerta
function macroWhatsApp(tipo: string, nome: string | null): string {
  const n = (nome ?? "").split(" ")[0] || "colega";
  if (tipo.startsWith("pressao")) {
    return `Olá ${n}, aqui é da equipe de Saúde Ocupacional. Vi no Canteiro Saudável que sua pressão veio fora do normal. Pode me contar como está se sentindo agora? Vamos te orientar.`;
  }
  if (tipo === "sintomas") {
    return `Olá ${n}, é da Saúde Ocupacional. Vi que você reportou alguns sintomas hoje no app. Pode me explicar melhor o que está sentindo para a gente avaliar juntos?`;
  }
  if (tipo.startsWith("dor")) {
    return `Olá ${n}, vi no Canteiro Saudável que você está com dor. Onde dói exatamente? Vamos agendar um atendimento se precisar.`;
  }
  return `Olá ${n}, aqui é da Saúde Ocupacional. Vi um alerta seu no Canteiro Saudável e gostaria de saber se está tudo bem. Pode me responder?`;
}

function waUrl(telefone: string, mensagem: string): string {
  const num = telefone.replace(/\D/g, "");
  const full = num.startsWith("55") ? num : `55${num}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(mensagem)}`;
}

function Alertas() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-alertas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("alertas")
        .select("*, profiles(nome, matricula, telefone, turno)")
        .order("created_at", { ascending: false })
        .limit(150);
      return data ?? [];
    },
    refetchInterval: 15000,
  });

  async function resolver(id: string) {
    await supabase.from("alertas").update({ resolvido: true, resolvido_em: new Date().toISOString() }).eq("id", id);
    toast.success("Alerta resolvido");
    void qc.invalidateQueries({ queryKey: ["admin-alertas"] });
  }

  // Triagem: ordenar por urgência (críticos primeiro) depois por data
  const abertos = useMemo(() => {
    return (data ?? [])
      .filter((a) => !a.resolvido)
      .sort((a, b) => {
        const u = (ordemUrgencia[a.nivel_urgencia] ?? 9) - (ordemUrgencia[b.nivel_urgencia] ?? 9);
        if (u !== 0) return u;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [data]);
  const resolvidos = (data ?? []).filter((a) => a.resolvido).slice(0, 20);

  const criticos = abertos.filter((a) => a.nivel_urgencia === "critico");
  const atencao = abertos.filter((a) => a.nivel_urgencia === "atencao");

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Caixa de triagem</h1>
      <p className="text-sm text-muted-foreground">Alertas críticos no topo. Use as macros para responder em 1 clique.</p>

      {/* Resumo de triagem */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border-2 border-destructive bg-destructive/10 p-4">
          <p className="text-xs font-bold uppercase text-destructive">Vermelhos</p>
          <p className="text-3xl font-extrabold text-destructive">{criticos.length}</p>
        </div>
        <div className="rounded-2xl border-2 border-warning bg-warning/10 p-4">
          <p className="text-xs font-bold uppercase text-warning">Atenção</p>
          <p className="text-3xl font-extrabold text-warning">{atencao.length}</p>
        </div>
        <div className="rounded-2xl border-2 border-success bg-success/10 p-4">
          <p className="text-xs font-bold uppercase text-success">Resolvidos hoje</p>
          <p className="text-3xl font-extrabold text-success">
            {(data ?? []).filter((a) => a.resolvido && a.resolvido_em && new Date(a.resolvido_em).toDateString() === new Date().toDateString()).length}
          </p>
        </div>
      </div>

      <h2 className="mt-6 text-base font-bold">Abertos ({abertos.length})</h2>
      <div className="mt-3 space-y-2">
        {abertos.map((a) => {
          const prof = (a as { profiles?: { nome?: string; matricula?: string; telefone?: string; turno?: string } }).profiles;
          const tel = prof?.telefone;
          const macro = macroWhatsApp(a.tipo, prof?.nome ?? null);
          return (
            <div key={a.id} className={`rounded-2xl border-2 p-4 ${tones[a.nivel_urgencia] ?? ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    {a.tipo} · {a.nivel_urgencia}
                    {prof?.turno && <span className="ml-2 rounded-full bg-background/60 px-2 py-0.5 text-[10px]">{prof.turno}</span>}
                  </p>
                  <p className="mt-1 font-semibold">{a.mensagem}</p>
                  {prof?.nome && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {prof.nome} {prof.matricula && <>· Mat. {prof.matricula}</>} {tel && <>· {tel}</>}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-BR")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {tel && (
                    <>
                      <a
                        href={waUrl(tel, macro)}
                        target="_blank"
                        rel="noopener"
                        className="flex h-10 items-center gap-1 rounded-xl bg-success px-3 text-xs font-bold text-success-foreground"
                        title="Abrir WhatsApp com mensagem pronta"
                      >
                        <MessageCircle className="h-4 w-4" /> WhatsApp macro
                      </a>
                      <a
                        href={`tel:${tel}`}
                        className="flex h-10 items-center gap-1 rounded-xl bg-info px-3 text-xs font-bold text-info-foreground"
                      >
                        <Phone className="h-4 w-4" /> Ligar
                      </a>
                    </>
                  )}
                  <button
                    onClick={() => resolver(a.id)}
                    className="flex h-10 items-center gap-1 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
                  >
                    <Check className="h-4 w-4" /> Resolver
                  </button>
                </div>
              </div>
              {tel && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground">Ver mensagem da macro</summary>
                  <p className="mt-1 rounded-xl bg-background/60 p-2 text-xs">{macro}</p>
                </details>
              )}
            </div>
          );
        })}
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
