import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, QrCode, Camera as CameraIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { todayISO } from '@/lib/canteiro';

export const Route = createFileRoute('/app/hidratacao-qr')({ component: HidratacaoQR });

function HidratacaoQR() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [scanner, setScanner] = useState(false);

  // tenta pegar ?c= da URL (gerada pelo QR físico)
  useEffect(() => {
    const url = new URL(window.location.href);
    const c = url.searchParams.get('c');
    if (c) {
      setCodigo(c);
      setTimeout(() => void resgatar(c), 300);
    }
  }, []);

  async function resgatar(cod?: string) {
    const codeUse = (cod ?? codigo).trim().toUpperCase();
    if (!user || !codeUse) return;
    setEnviando(true);
    try {
      const { data: qr } = await supabase
        .from('hidratacao_qr_codes')
        .select('*')
        .eq('codigo', codeUse)
        .eq('ativo', true)
        .maybeSingle();
      if (!qr) {
        toast.error('QR inválido. Confira o bebedouro.');
        return;
      }
      // anti-trapaça: 1 scan a cada 15 min por usuário e código
      const limite = new Date(Date.now() - 15 * 60_000).toISOString();
      const { count } = await supabase
        .from('hidratacao_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', limite);
      if ((count ?? 0) > 0) {
        toast.error('Aguarde 15 min entre registros pelo QR.');
        return;
      }
      const { error } = await supabase.from('hidratacao_logs').insert({
        user_id: user.id,
        data: todayISO(),
        ml_consumidos: qr.ml_padrao,
        fonte: `qr:${qr.codigo}`,
      });
      if (error) throw error;
      toast.success(`+${qr.ml_padrao} ml registrados no ${qr.localizacao}!`);
      setTimeout(() => void refreshProfile(), 500);
      setTimeout(() => navigate({ to: '/app/hidratacao' }), 800);
    } catch (e) {
      toast.error('Não foi possível registrar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <button onClick={() => navigate({ to: '/app/hidratacao' })} className="mb-4 flex items-center gap-1 text-sm font-medium text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="rounded-3xl border border-border bg-card p-6 text-center">
        <QrCode className="mx-auto h-16 w-16 text-primary" />
        <h1 className="mt-3 text-xl font-extrabold">Bater ponto na hidratação</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escaneie o QR do bebedouro com a câmera do celular ou digite o código que aparece nele.
        </p>

        <div className="mt-5 space-y-3">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="Ex.: BEB-01"
            className="h-12 w-full rounded-xl border-2 border-input bg-card px-4 text-center text-lg font-bold tracking-widest outline-none focus:border-primary"
          />
          <button
            onClick={() => void resgatar()}
            disabled={enviando || !codigo}
            className="h-12 w-full rounded-xl bg-gradient-primary font-bold text-primary-foreground disabled:opacity-50"
          >
            {enviando ? 'Registrando…' : 'Registrar copo'}
          </button>
          <button
            onClick={() => setScanner((s) => !s)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-bold"
          >
            <CameraIcon className="h-4 w-4" /> {scanner ? 'Fechar câmera' : 'Abrir câmera para QR'}
          </button>
          {scanner && (
            <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
              Aponte a câmera do seu celular (app de câmera) para o QR. Ele já abre direto no app com o código preenchido.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
