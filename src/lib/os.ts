export const STATUS_OS = ["AGENDADA", "EM_ANDAMENTO", "EXECUTADA", "CANCELADA"] as const;
export type StatusOS = (typeof STATUS_OS)[number];

export const STATUS_OS_LABEL: Record<StatusOS, string> = {
  AGENDADA: "Agendada",
  EM_ANDAMENTO: "Em andamento",
  EXECUTADA: "Executada",
  CANCELADA: "Cancelada",
};

export const STATUS_OS_CLASSE: Record<StatusOS, string> = {
  AGENDADA: "bg-primary/10 text-primary border-primary/20",
  EM_ANDAMENTO: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
  EXECUTADA: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  CANCELADA: "bg-destructive/10 text-destructive border-destructive/20",
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

export function periodoHorario(inicio?: string | null, fim?: string | null) {
  if (!inicio && !fim) return "—";
  if (inicio && fim) return `${formatarHora(inicio)} às ${formatarHora(fim)}`;
  return formatarHora(inicio ?? fim);
}
