import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { listarTodasAtividades } from "@/lib/educacao-api";
import { STATUS_ACAO_CLASSE, STATUS_ACAO_LABEL } from "@/lib/educacao";
import { formatarData } from "@/lib/sestran";
import { textoSimples } from "@/lib/texto-formatado";

export function ListaTodasAtividades() {
  const acoes = useQuery({ queryKey: ["educacao", "todas-atividades"], queryFn: listarTodasAtividades });
  return <section aria-labelledby="todas-atividades-titulo" className="min-w-0 space-y-2">
    <h2 id="todas-atividades-titulo" className="font-display text-base font-semibold">Todas as atividades <span className="font-normal text-muted-foreground">({acoes.data?.length ?? 0})</span></h2>
    <ScrollArea type="always" className="h-28 border border-border bg-background">
      {acoes.isPending ? <p className="p-3 text-sm text-muted-foreground">Carregando atividades…</p> : acoes.isError ? <div className="p-2 text-sm text-destructive">Não foi possível carregar as atividades. <Button variant="link" onClick={() => acoes.refetch()}>Tentar novamente</Button></div> : !acoes.data.length ? <p className="p-3 text-sm text-muted-foreground">Nenhuma atividade cadastrada.</p> : <ul className="divide-y divide-border pr-3">
        {acoes.data.map(acao => <li key={acao.id}><Link to="/agenda-educativa/$id" params={{ id: acao.id }} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm hover:bg-muted focus-visible:outline focus-visible:outline-ring">
          <span className="shrink-0 tabular-nums text-muted-foreground">{formatarData(acao.data_acao)}{acao.horario_inicio ? ` · ${acao.horario_inicio.slice(0, 5)}` : ""}</span>
          <span className="min-w-0 flex-1 break-words font-medium">{textoSimples(acao.titulo)}</span>
          <Badge variant="outline" className={STATUS_ACAO_CLASSE[acao.status]}>{STATUS_ACAO_LABEL[acao.status]}</Badge>
          {acao.arquivada && <Badge variant="outline">Arquivada</Badge>}
        </Link></li>)}
      </ul>}
    </ScrollArea>
  </section>;
}