export const STATUS_VEICULO = [
  "DENUNCIADO",
  "NOTIFICADO",
  "RECOLHER",
  "RECOLHIDO",
  "RETIRADO",
  "NAO_ABANDONADO",
  "TERRENO",
  "OUTROS",
] as const;

export type StatusVeiculo = (typeof STATUS_VEICULO)[number];

export const STATUS_VEICULO_LABEL: Record<string, string> = {
  DENUNCIADO: "Denunciado",
  NOTIFICADO: "Notificado",
  RECOLHER: "A recolher",
  RECOLHIDO: "Recolhido",
  RETIRADO: "Retirado",
  NAO_ABANDONADO: "Não está abandonado",
  TERRENO: "Dentro de terreno",
  OUTROS: "Outros",
};

export const STATUS_VEICULO_CLASSE: Record<string, string> = {
  DENUNCIADO: "bg-primary/10 text-primary border-primary/20",
  NOTIFICADO: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
  RECOLHER: "bg-destructive/10 text-destructive border-destructive/20",
  RECOLHIDO: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  RETIRADO: "bg-muted text-muted-foreground border-border",
  NAO_ABANDONADO: "bg-muted text-muted-foreground border-border",
  TERRENO: "bg-muted text-muted-foreground border-border",
  OUTROS: "bg-muted text-muted-foreground border-border",
};

export const SITUACOES_VEICULO = ["RETIRADO", "NOTIFICADO", "RECOLHIDO", "NAO_ABANDONADO", "TERRENO", "OUTROS"] as const;
/** Código de situação: padrão ou cadastrado pelo usuário no catálogo editável. */
export type SituacaoVeiculo = string;
export type OpcaoSituacao = { id: string; nome: string; ativo: boolean; ordem: number };

/** Atualiza os nomes exibidos com os do catálogo editável (inclui situações novas). */
/** Situações cadastradas cujo nome é "Retorno" (aceita a grafia "Rotorno"). */
export const SITUACOES_RETORNO = new Set<string>(["RETORNO"]);
const CLASSE_RETORNO = "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400";
export function ehNomeRetorno(nome: string) {
  return /^r[eo]torno$/.test(nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase());
}

/** Situações cadastradas cujo nome é "Denúncia a verificar" (somadas ao quadro Denúncia a Verificar). */
export const SITUACOES_DENUNCIA = new Set<string>(["DENUNCIADO"]);
export function ehNomeDenuncia(nome: string) {
  return /^denuncias? a verificar$/.test(nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase());
}

export function registrarSituacoes(opcoes: OpcaoSituacao[]) {
  for (const o of opcoes) {
    if (ehNomeDenuncia(o.nome)) SITUACOES_DENUNCIA.add(o.id);
    STATUS_VEICULO_LABEL[o.id] = o.nome;
    if (ehNomeRetorno(o.nome)) { SITUACOES_RETORNO.add(o.id); STATUS_VEICULO_CLASSE[o.id] = CLASSE_RETORNO; }
    if (!STATUS_VEICULO_CLASSE[o.id]) STATUS_VEICULO_CLASSE[o.id] = "bg-muted text-muted-foreground border-border";
  }
}

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
  situacao: "Situação informada",
  arquivado: "Arquivado",
  arquivado_em: "Arquivado em",
};

export type EtapaCronograma =
  | "AGUARDANDO_VERIFICACAO"
  | "A_RECOLHER"
  | "RECOLHIDOS"
  | "RETIRADOS"
  | "OUTRAS_SITUACOES";

export const ETAPAS_CRONOGRAMA: EtapaCronograma[] = [
  "AGUARDANDO_VERIFICACAO",
  "A_RECOLHER",
  "RECOLHIDOS",
  "RETIRADOS",
  "OUTRAS_SITUACOES",
];

export const ETAPA_LABEL: Record<EtapaCronograma, string> = {
  AGUARDANDO_VERIFICACAO: "Retorno",
  A_RECOLHER: "Notificados",
  RECOLHIDOS: "Recolhidos",
  RETIRADOS: "Retirados",
  OUTRAS_SITUACOES: "Outras situações",
};

export type VeiculoBase = {
  status: string;
  situacao?: SituacaoVeiculo | null;
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
export function statusEfetivo(v: VeiculoBase): string {
  if (v.situacao && v.situacao !== "NOTIFICADO") return v.situacao;
  if (v.situacao === "NOTIFICADO") {
    const prazo = v.prazo_recolhimento ?? (v.data_notificacao ? somarDias(v.data_notificacao, PRAZO_RECOLHIMENTO_DIAS) : null);
    return prazo && prazo <= hojeIso() ? "RECOLHER" : "NOTIFICADO";
  }
  if (v.data_retirada) return "RETIRADO";
  if (v.data_recolhimento) return "RECOLHIDO";
  if (v.data_notificacao) {
    const prazo = v.prazo_recolhimento ?? somarDias(v.data_notificacao, PRAZO_RECOLHIMENTO_DIAS);
    return prazo <= hojeIso() ? "RECOLHER" : "NOTIFICADO";
  }
  return "DENUNCIADO";
}

export function etapaDe(v: VeiculoBase): EtapaCronograma {
  const status = statusEfetivo(v);
  if (status === "RETIRADO") return "RETIRADOS";
  if (status === "RECOLHIDO") return "RECOLHIDOS";
  if (status === "RECOLHER" || status === "NOTIFICADO") return "A_RECOLHER";
  if (status === "DENUNCIADO" || SITUACOES_RETORNO.has(status)) return "AGUARDANDO_VERIFICACAO";
  return "OUTRAS_SITUACOES";
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
