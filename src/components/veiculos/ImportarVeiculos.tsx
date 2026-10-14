import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { criarVeiculo } from "@/lib/veiculos-api";
import { lerPlanilhaVeiculos, type LinhaImportacao } from "@/lib/veiculos-importar";
import { STATUS_VEICULO_LABEL, statusEfetivo } from "@/lib/veiculos";

export function ImportarVeiculos() {
  const [aberto, setAberto] = useState(false);
  const [linhas, setLinhas] = useState<LinhaImportacao[] | null>(null);
  const [lendo, setLendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const importar = useMutation({
    mutationFn: async (lista: LinhaImportacao[]) => {
      let ok = 0;
      const erros: string[] = [];
      for (const l of lista) {
        try {
          await criarVeiculo(l.dados);
          ok++;
        } catch (e) {
          erros.push(`Nº ${l.numero}: ${e instanceof Error ? e.message : "falha ao salvar"}`);
        }
      }
      return { ok, erros };
    },
    onSuccess: ({ ok, erros }) => {
      qc.invalidateQueries({ queryKey: ["veiculos"] });
      if (erros.length === 0) {
        toast.success(`${ok} veículo(s) cadastrado(s) com sucesso.`);
        setAberto(false);
        setLinhas(null);
      } else {
        toast.warning(`${ok} cadastrado(s); ${erros.length} falharam: ${erros.slice(0, 3).join(" | ")}`);
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha na importação."),
  });

  async function escolherArquivo(arquivo: File | null) {
    if (!arquivo) return;
    setLendo(true);
    try {
      setLinhas(await lerPlanilhaVeiculos(arquivo));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui ler a planilha.");
      setLinhas(null);
    } finally {
      setLendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setAberto(true)}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Importar planilha
      </Button>
      <Dialog open={aberto} onOpenChange={(v) => { setAberto(v); if (!v) setLinhas(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Importar planilha de veículos</DialogTitle>
          </DialogHeader>
          {!linhas && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Escolha a planilha (.xlsx) no modelo da Secretaria. O arquivo serve apenas para o cadastro e não fica
                guardado no sistema. Confira a prévia antes de confirmar.
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => escolherArquivo(e.target.files?.[0] ?? null)}
              />
              <Button variant="outline" disabled={lendo} onClick={() => inputRef.current?.click()}>
                {lendo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {lendo ? "Lendo planilha…" : "Escolher arquivo"}
              </Button>
            </div>
          )}
          {linhas && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {linhas.length} veículo(s) encontrados. Confira e confirme o cadastro.
              </p>
              <div className="max-h-80 overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Nº</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linhas.map((l) => (
                      <TableRow key={l.numero}>
                        <TableCell>{l.numero}</TableCell>
                        <TableCell>
                          <strong>{l.dados.placa ?? "Sem placa"}</strong>
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {[l.dados.marca, l.dados.modelo].filter(Boolean).join(" / ") || "Não identificado"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {l.dados.endereco}
                          {l.dados.bairro && <span className="block text-xs text-muted-foreground">{l.dados.bairro}</span>}
                          {l.aviso && <span className="block text-xs text-amber-600">{l.aviso}</span>}
                        </TableCell>
                        <TableCell>{(STATUS_VEICULO_LABEL[statusEfetivo({ ...l.dados, status: "", prazo_recolhimento: null })] ?? String(statusEfetivo({ ...l.dados, status: "", prazo_recolhimento: null })))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAberto(false); setLinhas(null); }}>
              Cancelar
            </Button>
            {linhas && (
              <>
                <Button variant="outline" onClick={() => setLinhas(null)}>Escolher outro arquivo</Button>
                <Button disabled={importar.isPending} onClick={() => importar.mutate(linhas)}>
                  {importar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar cadastro de {linhas.length} veículo(s)
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
