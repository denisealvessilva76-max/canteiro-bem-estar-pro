import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { importarMatriculas } from "@/lib/matriculas.functions";

export const Route = createFileRoute("/admin/matriculas")({
  component: Matriculas,
});

type Row = { matricula: string; nome?: string; turno?: "diurno" | "noturno"; cargo?: string; telefone?: string };

function parseCSV(text: string): Row[] {
  const linhas = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (linhas.length === 0) return [];
  const header = linhas[0].split(/[,;]/).map((h) => h.trim().toLowerCase());
  const idx = (n: string) => header.indexOf(n);
  const iMat = idx("matricula"), iNome = idx("nome"), iTurno = idx("turno"),
        iCargo = idx("cargo"), iTel = idx("telefone");
  if (iMat < 0) throw new Error('CSV precisa ter coluna "matricula"');
  const out: Row[] = [];
  for (let i = 1; i < linhas.length; i++) {
    const cols = linhas[i].split(/[,;]/).map((c) => c.trim());
    const m = cols[iMat];
    if (!m) continue;
    const t = (iTurno >= 0 ? cols[iTurno]?.toLowerCase() : "") || "";
    out.push({
      matricula: m,
      nome: iNome >= 0 ? cols[iNome] : "",
      turno: t === "noturno" ? "noturno" : "diurno",
      cargo: iCargo >= 0 ? cols[iCargo] : "",
      telefone: iTel >= 0 ? cols[iTel] : "",
    });
  }
  return out;
}

function Matriculas() {
  const importar = useServerFn(importarMatriculas);
  const qc = useQueryClient();
  const [preview, setPreview] = useState<Row[]>([]);
  const [enviando, setEnviando] = useState(false);

  const { data: existentes } = useQuery({
    queryKey: ["matriculas-autorizadas"],
    queryFn: async () => (await supabase.from("matriculas_autorizadas")
      .select("*").order("criado_em", { ascending: false }).limit(500)).data ?? [],
  });

  async function handleFile(file: File) {
    try {
      const txt = await file.text();
      const rows = parseCSV(txt);
      if (rows.length === 0) { toast.error("CSV vazio"); return; }
      setPreview(rows);
      toast.success(`${rows.length} linha(s) prontas para importar`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function enviar() {
    if (preview.length === 0) return;
    setEnviando(true);
    try {
      const res = await importar({ data: { linhas: preview } });
      toast.success(`${res.total} matrícula(s) importadas`);
      setPreview([]);
      void qc.invalidateQueries({ queryKey: ["matriculas-autorizadas"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setEnviando(false); }
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Pré-cadastro (CSV)</h1>
      <p className="text-sm text-muted-foreground">
        Faça upload de uma planilha com as colunas: <code>matricula, nome, turno, cargo, telefone</code>. Apenas
        matrículas autorizadas conseguem se registrar no app.
      </p>

      <div className="mt-6 rounded-2xl border-2 border-dashed border-border bg-card p-6 text-center">
        <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground" />
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
          <Upload className="h-4 w-4" /> Selecionar CSV
          <input type="file" accept=".csv,text/csv" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
        <p className="mt-2 text-xs text-muted-foreground">Separador: vírgula ou ponto-e-vírgula</p>
      </div>

      {preview.length > 0 && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">Pré-visualização ({preview.length} linhas)</p>
            <button onClick={enviar} disabled={enviando}
              className="flex items-center gap-2 rounded-xl bg-success px-4 py-2 text-sm font-bold text-success-foreground disabled:opacity-60">
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Enviar para o banco
            </button>
          </div>
          <div className="mt-3 max-h-64 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50"><tr>
                <th className="px-2 py-1 text-left">Matrícula</th><th className="px-2 py-1 text-left">Nome</th>
                <th className="px-2 py-1 text-left">Turno</th><th className="px-2 py-1 text-left">Cargo</th>
              </tr></thead>
              <tbody>
                {preview.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-2 py-1 font-mono">{r.matricula}</td>
                    <td className="px-2 py-1">{r.nome}</td>
                    <td className="px-2 py-1">{r.turno}</td>
                    <td className="px-2 py-1">{r.cargo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 50 && <p className="mt-2 text-xs text-muted-foreground">+ {preview.length - 50} linhas…</p>}
          </div>
        </div>
      )}

      <h2 className="mt-8 text-lg font-bold">Já autorizadas ({existentes?.length ?? 0})</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs font-bold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Matrícula</th><th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Turno</th><th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Telefone</th>
            </tr>
          </thead>
          <tbody>
            {(existentes ?? []).map((m) => (
              <tr key={m.matricula} className="border-t border-border">
                <td className="px-4 py-3 font-mono font-bold">{m.matricula}</td>
                <td className="px-4 py-3">{m.nome ?? '—'}</td>
                <td className="px-4 py-3 capitalize">{m.turno ?? '—'}</td>
                <td className="px-4 py-3">{m.cargo ?? '—'}</td>
                <td className="px-4 py-3">{m.telefone ?? '—'}</td>
              </tr>
            ))}
            {(existentes ?? []).length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Nenhuma matrícula importada ainda</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
