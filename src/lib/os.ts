export const STATUS_OS = ["AGENDADA", "EM_ANDAMENTO", "EXECUTADA", "CANCELADA"] as const;
export type StatusOS = (typeof STATUS_OS)[number];

export const STATUS_OS_LABEL: Record<StatusOS, string> = {
  AGENDADA: "Agendada",
  EM_ANDAMENTO: "Em andamento",
  EXECUTADA: "Concluída",
  CANCELADA: "Cancelada",
};

export const STATUS_OS_CLASSE: Record<StatusOS, string> = {
  AGENDADA: "border-success/40 bg-success/15 text-success",
  EM_ANDAMENTO: "border-warning/50 bg-warning/25 text-warning-foreground",
  EXECUTADA: "border-destructive/40 bg-destructive/15 text-destructive",
  CANCELADA: "border-muted-foreground/30 bg-muted text-muted-foreground",
};

export const ACAO_HISTORICO_LABEL: Record<string, string> = {
  CRIACAO: "Criação",
  EDICAO: "Edição",
  MUDANCA_STATUS: "Alteração de situação",
  ARQUIVAMENTO: "Arquivamento",
  RESTAURACAO: "Restauração",
};

export const CAMPO_LABEL: Record<string, string> = {
  numero: "Número",
  ano: "Ano",
  sequencial: "Sequencial",
  data_emissao: "Data de emissão",
  ipm: "IPM",
  remetente: "De",
  destinatario: "Para",
  natureza: "Natureza",
  solicitante_id: "Solicitante",
  local: "Local",
  data_servico: "Data do serviço",
  hora_inicio: "Horário de início",
  hora_fim: "Horário de término",
  evento_id: "Evento",
  trajeto: "Trajeto / Percurso",
  observacoes: "Observações",
  status: "Situação",
  arquivada: "Arquivada",
  arquivada_em: "Arquivada em",
  arquivada_por: "Arquivada por",
  titulo: "Título",
  descricao: "Descrição",
  prioridade: "Prioridade",
  tipo: "Tipo",
};

export function formatarHora(valor: string | null | undefined) {
  if (!valor) return "—";
  return valor.slice(0, 5);
}

export function formatarDataBr(valor: string | null | undefined) {
  if (!valor) return "—";
  const partes = valor.slice(0, 10).split("-");
  if (partes.length !== 3) return "—";
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function indiceDiaSemana(valor: string) {
  const [ano, mes, dia] = valor.slice(0, 10).split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  return Number.isNaN(data.getTime()) ? null : data.getDay();
}

/** Dia da semana por extenso, ex.: "Quarta-feira". */
export function diaDaSemana(valor: string | null | undefined) {
  if (!valor) return "";
  const indice = indiceDiaSemana(valor);
  if (indice === null) return "";
  return indice === 0 || indice === 6 ? DIAS_SEMANA[indice] : `${DIAS_SEMANA[indice]}-feira`;
}

/** Data no padrão brasileiro com o dia da semana, ex.: 14/10/2026 (Quarta). */
export function formatarDataBrComDia(valor: string | null | undefined) {
  const data = formatarDataBr(valor);
  if (data === "—") return "—";
  const indice = indiceDiaSemana(valor as string);
  return indice === null ? data : `${data} (${DIAS_SEMANA[indice]})`;
}

export function periodoHorario(inicio?: string | null, fim?: string | null) {
  if (!inicio && !fim) return "—";
  if (inicio && fim) return `${formatarHora(inicio)} às ${formatarHora(fim)}`;
  return formatarHora(inicio ?? fim);
}
