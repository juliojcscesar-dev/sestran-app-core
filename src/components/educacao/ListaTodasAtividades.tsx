import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { listarTodasAtividades } from "@/lib/educacao-api";
import { STATUS_ACAO_CLASSE, STATUS_ACAO_LABEL } from "@/lib/educacao";
import { formatarData } from "@/lib/sestran";
import { textoSimples } from "@/lib/texto-formatado";
import { Archive, ArchiveRestore, Copy, Eye, FileDown, FileText, Loader2, Pencil } from "lucide-react";
import { useSessao } from "@/hooks/useSessao";
import { temAcesso } from "@/lib/permissoes";
import type { ResumoAcao } from "@/lib/educacao-api";
import { ExcluirAcaoButton } from "./ExcluirAcaoButton";

export type AcaoDaLista = "editar" | "duplicar" | "pdf" | "docx" | "arquivar";

export function ListaTodasAtividades({ onAcao, carregandoId }: { onAcao: (acao: ResumoAcao, operacao: AcaoDaLista) => void; carregandoId: string | null }) {
  const acoes = useQuery({ queryKey: ["educacao", "todas-atividades"], queryFn: listarTodasAtividades });
  const { data: sessao } = useSessao();
  const podeOperar = temAcesso(sessao, "EDUCACAO", "OPERADOR");
  const podeExcluir = temAcesso(sessao, "EDUCACAO", "EXCLUIR");
  const podeRelatorio = temAcesso(sessao, "EDUCACAO", "RELATORIO");
  return <section aria-labelledby="todas-atividades-titulo" className="min-w-0 space-y-2">
    <h2 id="todas-atividades-titulo" className="font-display text-base font-semibold">Todas as atividades <span className="font-normal text-muted-foreground">({acoes.data?.length ?? 0})</span></h2>
    <ScrollArea type="always" className="h-28 border border-border bg-background">
      {acoes.isPending ? <p className="p-3 text-sm text-muted-foreground">Carregando atividades…</p> : acoes.isError ? <div className="p-2 text-sm text-destructive">Não foi possível carregar as atividades. <Button variant="link" onClick={() => acoes.refetch()}>Tentar novamente</Button></div> : !acoes.data.length ? <p className="p-3 text-sm text-muted-foreground">Nenhuma atividade cadastrada.</p> : <ul className="divide-y divide-border pr-3">
        {acoes.data.map(acao => <li key={acao.id} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1 text-sm">
          <span className="shrink-0 tabular-nums text-muted-foreground">{formatarData(acao.data_acao)}{acao.horario_inicio ? ` · ${acao.horario_inicio.slice(0, 5)}` : ""}</span>
          <Link to="/agenda-educativa/$id" params={{ id: acao.id }} className="min-w-0 flex-1 break-words font-medium hover:underline">{textoSimples(acao.titulo)}</Link>
          <Badge variant="outline" className={STATUS_ACAO_CLASSE[acao.status]}>{STATUS_ACAO_LABEL[acao.status]}</Badge>
          {acao.arquivada && <Badge variant="outline">Arquivada</Badge>}
          <div role="group" aria-label={`Ações de ${textoSimples(acao.titulo)}`} className="flex shrink-0 items-center">
            <Button asChild variant="ghost" size="icon" title="Visualizar" aria-label="Visualizar"><Link to="/agenda-educativa/$id" params={{ id: acao.id }}><Eye className="h-4 w-4" /></Link></Button>
            {([
              ...(podeOperar && !acao.arquivada ? [{ operacao: "editar" as const, rotulo: "Editar", icone: Pencil }] : []),
              ...(podeOperar ? [{ operacao: "duplicar" as const, rotulo: "Duplicar", icone: Copy }] : []),
              ...(podeRelatorio ? [{ operacao: "docx" as const, rotulo: "Exportar DOCX", icone: FileText }, { operacao: "pdf" as const, rotulo: "Gerar PDF", icone: FileDown }] : []),
              ...(podeExcluir ? [{ operacao: "arquivar" as const, rotulo: acao.arquivada ? "Restaurar" : "Arquivar", icone: acao.arquivada ? ArchiveRestore : Archive }] : []),
            ]).map(item => <Button key={item.operacao} type="button" variant="ghost" size="icon" title={item.rotulo} aria-label={item.rotulo} disabled={carregandoId !== null} onClick={() => onAcao(acao, item.operacao)}>{carregandoId === acao.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <item.icone className="h-4 w-4" />}</Button>)}
            <ExcluirAcaoButton compacto id={acao.id} titulo={acao.titulo} onExcluida={() => {}} />
          </div>
        </li>)}
      </ul>}
    </ScrollArea>
  </section>;
}