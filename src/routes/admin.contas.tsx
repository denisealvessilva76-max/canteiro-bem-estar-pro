import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus, KeyRound, Trash2, Loader2 } from "lucide-react";
import { listarAdmins, criarAdmin, trocarSenhaAdmin, removerAdmin } from "@/lib/admin-accounts.functions";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/admin/contas")({
  component: AdminContas,
});

function AdminContas() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fnList = useServerFn(listarAdmins);
  const fnCriar = useServerFn(criarAdmin);
  const fnSenha = useServerFn(trocarSenhaAdmin);
  const fnRemover = useServerFn(removerAdmin);

  const { data, isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: () => fnList(),
  });

  const [novo, setNovo] = useState({ nome: '', email: '', senha: '' });
  const [trocando, setTrocando] = useState<string | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [criando, setCriando] = useState(false);

  async function criar() {
    if (!novo.nome || !novo.email || novo.senha.length < 8) {
      toast.error('Preencha nome, e-mail e senha (mín. 8 caracteres)'); return;
    }
    setCriando(true);
    try {
      await fnCriar({ data: novo });
      toast.success('Conta criada');
      setNovo({ nome: '', email: '', senha: '' });
      void qc.invalidateQueries({ queryKey: ['admins'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    } finally { setCriando(false); }
  }

  async function trocarSenha(uid: string) {
    if (novaSenha.length < 8) { toast.error('Mín. 8 caracteres'); return; }
    try {
      await fnSenha({ data: { userId: uid, novaSenha } });
      toast.success('Senha atualizada');
      setTrocando(null); setNovaSenha('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    }
  }

  async function remover(uid: string) {
    if (!confirm('Remover acesso administrativo deste usuário?')) return;
    try {
      await fnRemover({ data: { userId: uid } });
      toast.success('Removido');
      void qc.invalidateQueries({ queryKey: ['admins'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Contas administrativas</h1>
      <p className="text-sm text-muted-foreground">Gerencie quem tem acesso ao painel.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold"><UserPlus className="h-5 w-5" /> Nova conta</h2>
          <div className="mt-4 space-y-3">
            <Input label="Nome completo" value={novo.nome} onChange={(v) => setNovo({ ...novo, nome: v })} />
            <Input label="E-mail" type="email" value={novo.email} onChange={(v) => setNovo({ ...novo, email: v })} />
            <Input label="Senha (mín. 8)" type="password" value={novo.senha} onChange={(v) => setNovo({ ...novo, senha: v })} />
            <button onClick={criar} disabled={criando}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-60">
              {criando ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Criar conta
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Equipe atual ({data?.admins?.length ?? 0})</h2>
          <div className="mt-4 space-y-3">
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            {data?.admins?.map((a) => (
              <div key={a.id} className="rounded-xl border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">{a.nome} {a.id === user?.id && <span className="ml-1 text-xs text-primary">(você)</span>}</p>
                    <p className="text-xs text-muted-foreground">{a.email}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setTrocando(trocando === a.id ? null : a.id); setNovaSenha(''); }}
                      className="flex h-8 items-center gap-1 rounded-lg bg-muted px-2 text-xs font-bold"
                    >
                      <KeyRound className="h-3 w-3" /> Senha
                    </button>
                    {a.id !== user?.id && (
                      <button onClick={() => remover(a.id)}
                        className="flex h-8 items-center justify-center rounded-lg bg-destructive/10 px-2 text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                {trocando === a.id && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Nova senha (mín. 8)"
                      className="h-9 flex-1 rounded-lg border border-input bg-background px-2 text-sm outline-none focus:border-primary"
                    />
                    <button onClick={() => trocarSenha(a.id)} className="h-9 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground">
                      Salvar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
    </label>
  );
}
