import { TextoFormatado } from "@/components/TextoFormatado";
import { textoSimples } from "@/lib/texto-formatado";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { criarDataLocal, dataLocalIso, formatarHoraCurta, moverPeriodo, STATUS_ACAO_CLASSE, STATUS_ACAO_LABEL, type StatusAcao, type VisaoCalendario } from "@/lib/educacao";
import type { AcaoEducativa } from "@/lib/educacao-api";

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function datasEntre(inicio: Date, quantidade: number) {
  return Array.from({ length: quantidade }, (_, i) => { const d = new Date(inicio); d.setDate(d.getDate() + i); return d; });
}

function tituloPeriodo(data: Date, visao: VisaoCalendario) {
  if (visao === "mes") return data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  if (visao === "dia") return data.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  if (visao === "lista") return "Ações no período selecionado";
  const inicio = new Date(data); inicio.setDate(inicio.getDate() - inicio.getDay());
  const fim = new Date(inicio); fim.setDate(fim.getDate() + 6);
  return `${inicio.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${fim.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;
}

function Evento({ acao, onAbrir, compacto = false }: { acao: AcaoEducativa; onAbrir: (acao: AcaoEducativa) => void; compacto?: boolean }) {
  return <Button type="button" variant="ghost" onClick={() => onAbrir(acao)} className={cn("h-auto w-full justify-start border px-2 py-1 text-left", STATUS_ACAO_CLASSE[acao.status as StatusAcao])} title={`${textoSimples(acao.titulo)} — ${STATUS_ACAO_LABEL[acao.status]}`}><span className="min-w-0"><span className="block truncate text-xs font-semibold">{formatarHoraCurta(acao.horario_inicio)} · <TextoFormatado valor={acao.titulo} /></span>{!compacto && <span className="block truncate text-[11px] font-normal opacity-80">{acao.escolas?.nome ?? acao.local ?? STATUS_ACAO_LABEL[acao.status]}</span>}</span></Button>;
}

export function CalendarioAcoes({ acoes, referencia, visao, onReferenciaChange, onAbrir }: { acoes: AcaoEducativa[]; referencia: Date; visao: VisaoCalendario; onReferenciaChange: (data: Date) => void; onAbrir: (acao: AcaoEducativa) => void }) {
  const hoje = dataLocalIso(new Date());
  const porData = (data: Date) => acoes.filter((a) => a.data_acao === dataLocalIso(data));
  let dias: Date[] = [];
  if (visao === "mes") { const inicio = new Date(referencia.getFullYear(), referencia.getMonth(), 1); inicio.setDate(inicio.getDate() - inicio.getDay()); dias = datasEntre(inicio, 42); }
  if (visao === "semana") { const inicio = new Date(referencia); inicio.setDate(inicio.getDate() - inicio.getDay()); dias = datasEntre(inicio, 7); }
  if (visao === "dia") dias = [referencia];

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1"><Button type="button" variant="outline" size="icon" aria-label="Período anterior" onClick={() => onReferenciaChange(moverPeriodo(referencia, visao, -1))}><ChevronLeft className="h-4 w-4" /></Button><Button type="button" variant="outline" onClick={() => onReferenciaChange(new Date())}>Hoje</Button><Button type="button" variant="outline" size="icon" aria-label="Próximo período" onClick={() => onReferenciaChange(moverPeriodo(referencia, visao, 1))}><ChevronRight className="h-4 w-4" /></Button></div>
      <h2 className="font-display text-lg font-semibold capitalize">{tituloPeriodo(referencia, visao)}</h2>
      <div className="flex flex-wrap gap-2">{Object.entries(STATUS_ACAO_LABEL).map(([status, label]) => <Badge key={status} variant="outline" className={STATUS_ACAO_CLASSE[status as StatusAcao]}>{label}</Badge>)}</div>
    </div>

    {visao === "mes" && <div className="overflow-x-auto"><div className="min-w-[800px] border-l border-t"><div className="grid grid-cols-7">{diasSemana.map((d) => <div key={d} className="border-b border-r bg-muted/60 px-2 py-2 text-center text-xs font-semibold uppercase text-muted-foreground">{d}</div>)}</div><div className="grid grid-cols-7">{dias.map((dia) => { const itens = porData(dia); const fora = dia.getMonth() !== referencia.getMonth(); return <div key={dia.toISOString()} className={cn("min-h-20 border-b border-r p-1.5", fora && "bg-muted/30 text-muted-foreground")}><div className={cn("mb-2 flex h-7 w-7 items-center justify-center rounded-full text-sm", dataLocalIso(dia) === hoje && "bg-primary text-primary-foreground")}>{dia.getDate()}</div><div className="space-y-1">{itens.slice(0, 3).map((a) => <Evento key={a.id} acao={a} onAbrir={onAbrir} compacto />)}{itens.length > 3 && <p className="px-1 text-xs text-muted-foreground">+ {itens.length - 3} ações</p>}</div></div>; })}</div></div></div>}

    {visao === "semana" && <div className="overflow-x-auto"><div className="grid min-w-[850px] grid-cols-7 border-l border-t">{dias.map((dia) => <div key={dia.toISOString()} className="min-h-[300px] border-b border-r"><div className={cn("border-b p-3 text-center", dataLocalIso(dia) === hoje && "bg-primary text-primary-foreground")}><p className="text-xs uppercase">{diasSemana[dia.getDay()]}</p><p className="text-xl font-semibold">{dia.getDate()}</p></div><div className="space-y-2 p-2">{porData(dia).map((a) => <Evento key={a.id} acao={a} onAbrir={onAbrir} />)}</div></div>)}</div></div>}

    {visao === "dia" && <div className="min-h-[300px] border"><div className="grid grid-cols-[80px_1fr]">{Array.from({ length: 14 }, (_, i) => i + 7).map((hora) => { const itens = porData(referencia).filter((a) => Number(a.horario_inicio?.slice(0, 2) ?? 7) === hora); return <div key={hora} className="contents"><div className="border-b border-r p-3 text-right text-xs text-muted-foreground">{String(hora).padStart(2, "0")}:00</div><div className="min-h-10 space-y-1 border-b p-1.5">{itens.map((a) => <Evento key={a.id} acao={a} onAbrir={onAbrir} />)}</div></div>; })}</div>{porData(referencia).length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma ação neste dia.</p>}</div>}

    {visao === "lista" && <div className="divide-y border">{acoes.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma ação encontrada.</p> : acoes.map((a) => <Button key={a.id} type="button" variant="ghost" className="h-auto w-full flex-wrap justify-between gap-2 rounded-none px-4 py-3 text-left whitespace-normal" onClick={() => onAbrir(a)}><span className="min-w-0 flex-1 break-words"><span className="block font-medium"><TextoFormatado valor={a.titulo} /></span><span className="block text-xs text-muted-foreground">{criarDataLocal(a.data_acao).toLocaleDateString("pt-BR")} · {formatarHoraCurta(a.horario_inicio)} · {a.escolas?.nome ?? a.local ?? "Local não informado"}</span></span><Badge variant="outline" className={STATUS_ACAO_CLASSE[a.status]}>{STATUS_ACAO_LABEL[a.status]}</Badge></Button>)}</div>}
  </div>;
}