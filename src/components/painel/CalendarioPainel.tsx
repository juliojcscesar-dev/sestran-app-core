import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { criarDataLocal, dataLocalIso } from "@/lib/educacao";
import { cn } from "@/lib/utils";

export function CalendarioPainel({ nome, mes, selecionada, datas, onMes, onSelecionar, educativo = false, compacto = false }: {
  nome: string; mes: Date; selecionada: Date | undefined; datas: string[];
  onMes: (data: Date) => void; onSelecionar: (data: Date | undefined) => void; educativo?: boolean; compacto?: boolean;
}) {
  return <div aria-label={`Calendário de ${nome}`} className={cn("painel-calendario bg-muted/60", compacto ? "painel-calendario-compacto rounded-md p-2" : "p-3", educativo && "painel-calendario-educacao")}>
    <Calendar locale={ptBR} mode="single" month={mes} onMonthChange={onMes} selected={selecionada} onSelect={onSelecionar} fixedWeeks
      className="w-full bg-transparent p-0" classNames={{ root: "w-full", month: "flex w-full flex-col gap-3" }}
      modifiers={{ atividade: [...new Set(datas)].map(criarDataLocal) }} modifiersClassNames={{ atividade: "painel-dia-atividade" }}
      labels={{ labelNext: () => `Próximo mês de ${nome}`, labelPrevious: () => `Mês anterior de ${nome}` }} />
    <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t pt-2">
      <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground"><span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", educativo ? "bg-primary" : "bg-warning")} />{selecionada ? selecionada.toLocaleDateString("pt-BR") : "Dias com atividades"}</span>
      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { onMes(new Date()); onSelecionar(undefined); }}>Hoje</Button>
    </div>
  </div>;
}

export function periodoCalendario(mes: Date) {
  const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1);
  inicio.setDate(inicio.getDate() - inicio.getDay());
  const fim = new Date(inicio); fim.setDate(fim.getDate() + 41);
  return { inicio: dataLocalIso(inicio), fim: dataLocalIso(fim) };
}