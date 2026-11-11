import { useEffect, useState } from "react";
import { BarChart3, FileDown, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { gerarRelatorioDocx, gerarRelatorioPdf, intervaloPeriodo, TIPO_PERIODO_LABEL, type TipoPeriodo } from "@/lib/relatorios";
import { hojeIso } from "@/lib/veiculos";
import { useSessao } from "@/hooks/useSessao";
import { temAcesso, type ModuloAcesso } from "@/lib/permissoes";

type Props = {
  /** Nome do módulo usado no título do documento, ex.: "Ordens de Serviço". */
  titulo: string;
  /** Cabeçalhos das colunas da tabela do relatório. */
  colunas: string[];
  /** Busca as linhas do relatório no período; sem datas quando o período é Geral. */
  buscar: (de?: string, ate?: string, situacao?: string) => Promise<string[][]>;
  /** Nome base do arquivo gerado, sem extensão. */
  arquivo: string;
  /** Texto do botão; padrão "Relatório". */
  rotulo?: string;
  /** Opções de situação para filtrar o relatório; quando omitido, o filtro não aparece. */
  situacoes?: { valor: string; rotulo: string }[];
};

const TODAS_SITUACOES = "__todas__";

/** Botão "Relatório" da página inicial do módulo: escolhe o período e gera PDF ou DOCX. */
export function RelatorioModulo(props: Props & { modulo: ModuloAcesso }) {
  const { data: sessao } = useSessao();
  if (!temAcesso(sessao, props.modulo, "RELATORIO")) return null;
  return <RelatorioModuloLiberado {...props} />;
}

function RelatorioModuloLiberado({ titulo, colunas, buscar, arquivo, rotulo = "Relatório" }: Props) {
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<TipoPeriodo>("mes");
  const [dia, setDia] = useState(hojeIso());
  const [mes, setMes] = useState(hojeIso().slice(0, 7));
  const [ano, setAno] = useState(hojeIso().slice(0, 4));
  const [linhas, setLinhas] = useState<string[][] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [gerando, setGerando] = useState<"pdf" | "docx" | null>(null);

  const referencia = tipo === "dia" ? dia : tipo === "mes" ? mes : ano;
  const intervalo = intervaloPeriodo(tipo, referencia);

  useEffect(() => {
    if (!aberto) return;
    let vivo = true;
    setCarregando(true);
    buscar(intervalo.de, intervalo.ate)
      .then((resultado) => { if (vivo) setLinhas(resultado); })
      .catch(() => { if (vivo) { setLinhas([]); toast.error("Não foi possível carregar os registros do período."); } })
      .finally(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, tipo, referencia]);

  async function gerar(formato: "pdf" | "docx") {
    const dados = linhas ?? [];
    setGerando(formato);
    try {
      const base = { titulo: `Relatório — ${titulo}`, periodo: intervalo.rotulo, colunas, linhas: dados, arquivo };
      if (formato === "pdf") await gerarRelatorioPdf(base);
      else await gerarRelatorioDocx(base);
      toast.success(`Relatório ${formato.toUpperCase()} gerado.`);
    } catch {
      toast.error("Não foi possível gerar o relatório.");
    } finally {
      setGerando(null);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setAberto(true)}>
        <BarChart3 className="mr-2 h-4 w-4" aria-hidden="true" />
        {rotulo}
      </Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar relatório</DialogTitle>
            <DialogDescription>Escolha o período e o formato do relatório.</DialogDescription>
          </DialogHeader>
          <Tabs value={tipo} onValueChange={(v) => setTipo(v as TipoPeriodo)}>
            <TabsList className="grid w-full grid-cols-4">
              {(Object.keys(TIPO_PERIODO_LABEL) as TipoPeriodo[]).map((t) => (
                <TabsTrigger key={t} value={t}>{TIPO_PERIODO_LABEL[t]}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {tipo === "dia" && (
            <Input type="date" aria-label="Dia do relatório" value={dia} onChange={(e) => setDia(e.target.value)} />
          )}
          {tipo === "mes" && (
            <Input type="month" aria-label="Mês do relatório" value={mes} onChange={(e) => setMes(e.target.value)} />
          )}
          {tipo === "ano" && (
            <Input type="number" aria-label="Ano do relatório" min={2000} max={2100} value={ano} onChange={(e) => setAno(e.target.value)} />
          )}
          <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm">
            <p className="text-muted-foreground">{intervalo.rotulo}</p>
            <p className="font-display text-xl font-semibold">
              {carregando ? "…" : `${linhas?.length ?? 0} registro(s)`}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" className="flex-1" disabled={carregando || gerando !== null} onClick={() => gerar("pdf")}>
              {gerando === "pdf" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              Imprimir PDF
            </Button>
            <Button type="button" variant="outline" className="flex-1" disabled={carregando || gerando !== null} onClick={() => gerar("docx")}>
              {gerando === "docx" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
              Exportar DOC
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
