export const STATUS_VEICULO = [
  "DENUNCIADO",
  "NOTIFICADO",
  "RECOLHER",
  "RECOLHIDO",
  "RETIRADO",
] as const;

export type StatusVeiculo = (typeof STATUS_VEICULO)[number];

export const STATUS_VEICULO_LABEL: Record<StatusVeiculo, string> = {
  DENUNCIADO: "Denunciado",
  NOTIFICADO: "Notificado",
  RECOLHER: "A recolher",
  RECOLHIDO: "Recolhido",
  RETIRADO: "Retirado pelo proprietário",
};

export const STATUS_VEICULO_CLASSE: Record<StatusVeiculo, string> = {
  DENUNCIADO: "bg-primary/10 text-primary border-primary/20",
  NOTIFICADO: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
  RECOLHER: "bg-destructive/10 text-destructive border-destructive/20",
  RECOLHIDO: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  RETIRADO: "bg-muted text-muted-foreground border-border",
};

export const TIPOS_DENUNCIA = ["OUVIDORIA", "INFORMAL"] as const;
export type TipoDenuncia = (typeof TIPOS_DENUNCIA)[number];

export const TIPO_DENUNCIA_LABEL: Record<TipoDenuncia, string> = {
  OUVIDORIA: "Ouvidoria",
  INFORMAL: "Informal",
};

/** Prazo legal entre a notificação e o recolhimento do veículo. */
export const PRAZO_RECOLHIMENTO_DIAS = 15;

export const ACAO_HISTORICO_VEICULO_LABEL: Record<string, string> = {
  CRIACAO: "Criação",
  EDICAO: "Edição",
  MUDANCA_STATUS: "Alteração de situação",
  ARQUIVAMENTO: "Arquivamento",
  RESTAURACAO: "Restauração",
};

export const CAMPO_VEICULO_LABEL: Record<string, string> = {
  placa: "Placa",
  chassi: "Chassi",
  marca: "Marca",
  modelo: "Modelo",
  cor: "Cor",
  endereco: "Endereço",
  bairro: "Bairro",
  tipo_denuncia: "Tipo de denúncia",
  numero_denuncia: "Número da denúncia",
  data_constatacao: "Data da denúncia",
  data_verificacao: "Data da verificação",
  data_notificacao: "Data da notificação",
  prazo_recolhimento: "Prazo para recolhimento",
  data_recolhimento: "Data do recolhimento",
  data_retirada: "Data da retirada",
  observacoes: "Observações",
  status: "Situação",
  arquivado: "Arquivado",
  arquivado_em: "Arquivado em",
};

export type EtapaCronograma =
  | "AGUARDANDO_VERIFICACAO"
  | "VERIFICADOS"
  | "A_RECOLHER"
  | "RECOLHIDOS"
  | "RETIRADOS";

export const ETAPAS_CRONOGRAMA: EtapaCronograma[] = [
  "AGUARDANDO_VERIFICACAO",
  "VERIFICADOS",
  "A_RECOLHER",
  "RECOLHIDOS",
  "RETIRADOS",
];

export const ETAPA_LABEL: Record<EtapaCronograma, string> = {
  AGUARDANDO_VERIFICACAO: "Aguardando verificação",
  VERIFICADOS: "Verificados",
  A_RECOLHER: "A recolher",
  RECOLHIDOS: "Recolhidos",
  RETIRADOS: "Retirados",
};

export type VeiculoBase = {
  status: string;
  data_verificacao: string | null;
  data_notificacao: string | null;
  data_recolhimento: string | null;
  data_retirada: string | null;
  prazo_recolhimento: string | null;
};

export function hojeIso() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/**
 * Situação considerando o prazo de 15 dias já vencido, mesmo que o registro
 * ainda não tenha sido salvo depois do vencimento.
 */
export function statusEfetivo(v: VeiculoBase): StatusVeiculo {
  if (v.data_retirada) return "RETIRADO";
  if (v.data_recolhimento) return "RECOLHIDO";
  if (v.data_notificacao) {
    const prazo = v.prazo_recolhimento ?? somarDias(v.data_notificacao, PRAZO_RECOLHIMENTO_DIAS);
    return prazo <= hojeIso() ? "RECOLHER" : "NOTIFICADO";
  }
  return "DENUNCIADO";
}

export function etapaDe(v: VeiculoBase): EtapaCronograma {
  if (v.data_retirada) return "RETIRADOS";
  if (v.data_recolhimento) return "RECOLHIDOS";
  if (statusEfetivo(v) === "RECOLHER") return "A_RECOLHER";
  if (v.data_verificacao) return "VERIFICADOS";
  return "AGUARDANDO_VERIFICACAO";
}

export function somarDias(dataIso: string, dias: number) {
  const d = new Date(`${dataIso.slice(0, 10)}T12:00:00`);
  d.setDate(d.getDate() + dias);
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** Dias restantes até o vencimento do prazo (negativo quando vencido). */
export function diasParaPrazo(prazo: string | null): number | null {
  if (!prazo) return null;
  const alvo = new Date(`${prazo.slice(0, 10)}T12:00:00`).getTime();
  const agora = new Date(`${hojeIso()}T12:00:00`).getTime();
  return Math.round((alvo - agora) / 86_400_000);
}

export function descricaoVeiculo(v: {
  marca?: string | null;
  modelo?: string | null;
  cor?: string | null;
}) {
  const partes = [v.marca, v.modelo, v.cor].filter(Boolean);
  return partes.length ? partes.join(" / ") : "—";
}
