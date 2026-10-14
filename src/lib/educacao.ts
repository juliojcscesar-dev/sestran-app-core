export const STATUS_ACAO = ["AGENDADA", "EM_ANDAMENTO", "REALIZADA", "CANCELADA"] as const;
export type StatusAcao = (typeof STATUS_ACAO)[number];

export const STATUS_ACAO_LABEL: Record<StatusAcao, string> = {
  AGENDADA: "Agendada",
  EM_ANDAMENTO: "Em andamento",
  REALIZADA: "Concluída",
  CANCELADA: "Cancelada",
};

export const STATUS_ACAO_CLASSE: Record<StatusAcao, string> = {
  AGENDADA: "border-success/40 bg-success/15 text-success",
  EM_ANDAMENTO: "border-warning/50 bg-warning/25 text-warning-foreground",
  REALIZADA: "border-destructive/40 bg-destructive/15 text-destructive",
  CANCELADA: "border-muted-foreground/30 bg-muted text-muted-foreground",
};

export const CATEGORIAS_ACAO = ["EVENTO_ESCOLA", "BLITZ_EDUCATIVA", "PALESTRA", "OUTRA"] as const;
export type CategoriaAcao = string;

export const CATEGORIA_ACAO_LABEL: Record<CategoriaAcao, string> = {
  EVENTO_ESCOLA: "Evento em escola",
  BLITZ_EDUCATIVA: "Blitz educativa",
  PALESTRA: "Palestra",
  OUTRA: "Outra ação",
};

export type VisaoCalendario = "mes" | "semana" | "dia" | "lista";

export function dataLocalIso(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function criarDataLocal(valor: string) {
  const [ano, mes, dia] = valor.slice(0, 10).split("-").map(Number);
  return new Date(ano || 2000, (mes || 1) - 1, dia || 1);
}

export function formatarHoraCurta(valor: string | null | undefined) {
  return valor ? valor.slice(0, 5) : "Horário livre";
}

export function intervaloDaVisao(referencia: Date, visao: VisaoCalendario) {
  const inicio = new Date(referencia);
  const fim = new Date(referencia);
  if (visao === "mes") {
    inicio.setDate(1);
    inicio.setDate(inicio.getDate() - inicio.getDay());
    fim.setMonth(fim.getMonth() + 1, 0);
    fim.setDate(fim.getDate() + (6 - fim.getDay()));
  } else if (visao === "semana") {
    inicio.setDate(inicio.getDate() - inicio.getDay());
    fim.setTime(inicio.getTime());
    fim.setDate(fim.getDate() + 6);
  }
  return { inicio: dataLocalIso(inicio), fim: dataLocalIso(fim) };
}

export function moverPeriodo(referencia: Date, visao: VisaoCalendario, passo: number) {
  const proxima = new Date(referencia);
  if (visao === "mes") proxima.setMonth(proxima.getMonth() + passo);
  else if (visao === "semana") proxima.setDate(proxima.getDate() + passo * 7);
  else proxima.setDate(proxima.getDate() + passo);
  return proxima;
}