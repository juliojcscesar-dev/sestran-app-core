// Consulta das credenciais (Idoso e PcD): base histórica anterior ao sistema (somente leitura)
// somada às credenciais emitidas no sistema. Não interfere na emissão nem na numeração.
import { exibirDocumento } from "./mascaras";

export type GrupoHistorico = "IDOSO" | "PCD";
export type StatusValidade = "ok" | "soon" | "exp" | "indet" | "none";
export type FiltroSituacao = "" | "com" | "sem" | "sn" | "ne" | "ex";
export type ColunaOrdem = "grupo" | "numero" | "nome" | "documento" | "telefone" | "validade" | "situacao";

export type CredencialHistorica = {
  id: number;
  grupo: string;
  numero: number;
  nome: string | null;
  nascimento: string | null;
  validade: string | null;
  validade_indeterminada: boolean;
  documento: string | null;
  telefone: string | null;
  cid: string | null;
  determinacao: string | null;
  situacao: string | null;
  observacoes: string | null;
};

/** Campos da credencial emitida no sistema usados na consulta. */
export type RegistroSistema = {
  id: string; tipo: string; nome: string; tipo_documento: string; numero_documento: string;
  nascimento: string | null; telefone: string | null; observacoes: string | null; numero_registro: string | null;
  data_emissao: string; data_validade: string | null; criado_em: string;
};

/** Linha da consulta: credencial da base existente ou emitida no sistema (que substitui a da base com o mesmo nº). */
export type CredencialConsulta = Omit<CredencialHistorica, "id" | "numero"> & {
  chave: string;
  numero: number | null;
  origem: "BASE" | "SISTEMA";
  historicoId: number | null;
  sistemaId: string | null;
  tipoSistema: string | null;
  emissao: string | null;
  situacaoAnterior: string | null;
};

const TIPOS_PCD = ["PCD", "RENOVACAO_PCD", "TEMPORARIA_PCD"];
export const grupoDoTipo = (tipo: string): GrupoHistorico => (TIPOS_PCD.includes(tipo) ? "PCD" : "IDOSO");
/** Nº da credencial a partir do registro digitado ("0167" → 167); null quando não há número. */
export function numeroDoRegistro(reg: string | null | undefined) {
  const m = (reg ?? "").trim().match(/^\d+/);
  return m ? Number(m[0]) : null;
}

function daBase(h: CredencialHistorica): CredencialConsulta {
  const { id, ...resto } = h;
  return { ...resto, chave: `b-${id}`, origem: "BASE", historicoId: id, sistemaId: null, tipoSistema: null, emissao: null, situacaoAnterior: null };
}
function doSistema(s: RegistroSistema, h?: CredencialHistorica): CredencialConsulta {
  return {
    chave: `s-${s.id}`, origem: "SISTEMA", historicoId: h?.id ?? null, sistemaId: s.id, tipoSistema: s.tipo, emissao: s.data_emissao,
    grupo: grupoDoTipo(s.tipo), numero: numeroDoRegistro(s.numero_registro), nome: s.nome,
    nascimento: s.nascimento ?? h?.nascimento ?? null, validade: s.data_validade, validade_indeterminada: false,
    documento: exibirDocumento(s.tipo_documento, s.numero_documento) || h?.documento || null,
    telefone: s.telefone ?? h?.telefone ?? null, cid: h?.cid ?? null, determinacao: h?.determinacao ?? null,
    situacao: null, situacaoAnterior: h?.situacao ?? null, observacoes: s.observacoes ?? h?.observacoes ?? null,
  };
}

/** Junta a base existente com as credenciais do sistema: para cada Tipo + Nº vale a emissão mais recente do sistema,
    então a mesma credencial nunca aparece repetida e uma correção feita no sistema aparece na consulta. */
export function mesclarConsulta(historico: CredencialHistorica[], sistema: RegistroSistema[]): CredencialConsulta[] {
  const recentes = new Map<string, RegistroSistema>();
  const semNumero: RegistroSistema[] = [];
  for (const s of sistema) {
    const n = numeroDoRegistro(s.numero_registro);
    if (n === null) { semNumero.push(s); continue; }
    const k = `${grupoDoTipo(s.tipo)}-${n}`;
    const a = recentes.get(k);
    if (!a || `${s.data_emissao}|${s.criado_em}` > `${a.data_emissao}|${a.criado_em}`) recentes.set(k, s);
  }
  const res = historico.map((h) => {
    const k = `${h.grupo}-${h.numero}`;
    const s = recentes.get(k);
    if (!s) return daBase(h);
    recentes.delete(k);
    return doSistema(s, h);
  });
  for (const s of recentes.values()) res.push(doSistema(s));
  for (const s of semNumero) res.push(doSistema(s));
  return res;
}

export type FiltrosHistorico = {
  busca: string;
  grupo: "" | GrupoHistorico;
  validade: "" | StatusValidade;
  situacao: FiltroSituacao;
  ordem: ColunaOrdem;
  direcao: 1 | -1;
};

export const FILTROS_INICIAIS: FiltrosHistorico = { busca: "", grupo: "", validade: "", situacao: "", ordem: "nome", direcao: 1 };

export const ROTULO_VALIDADE: Record<StatusValidade, string> = {
  ok: "Válida", soon: "Vence em breve", exp: "Vencida", indet: "Indeterminada", none: "Sem data",
};
export const ROTULO_GRUPO: Record<GrupoHistorico, string> = { IDOSO: "Idoso", PCD: "PcD" };

export const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function inicioDoDia(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Válida, vence em até 90 dias, vencida, indeterminada ou sem data — comparação por dia do calendário. */
export function statusValidade(r: Pick<CredencialHistorica, "validade" | "validade_indeterminada">, hoje: Date): StatusValidade {
  if (r.validade_indeterminada) return "indet";
  if (!r.validade) return "none";
  const [a = 0, m = 1, d = 1] = r.validade.split("-").map(Number);
  const val = new Date(a, m - 1, d);
  const base = inicioDoDia(hoje);
  const em90 = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 90);
  if (val < base) return "exp";
  if (val <= em90) return "soon";
  return "ok";
}

export function atendeSituacao(r: Pick<CredencialHistorica, "nome" | "situacao">, f: FiltroSituacao) {
  const sit = r.situacao ?? "";
  if (f === "sn") return !r.nome;
  if (f === "com") return Boolean(sit);
  if (f === "sem") return !sit;
  if (f === "ne") return /N[ÃA]O ENTREGUE/.test(sit);
  if (f === "ex") return /EXTRAV|CANCEL|PERDEU/.test(sit);
  return true;
}

/** Busca por nome, nº da credencial, CPF, RG ou CNPJ (números com ou sem pontos/traços). */
/** Linha aceita pela busca: credencial da base ou a consulta já mesclada com o sistema. */
export type LinhaConsulta = Omit<CredencialHistorica, "id" | "numero"> & { numero: number | null };

export function filtrarHistorico<T extends LinhaConsulta>(lista: T[], f: FiltrosHistorico, hoje: Date): T[] {
  const q = f.busca.trim();
  const digitos = q.replace(/\D/g, "");
  const numerica = q !== "" && /^[\d.\-/\s]+$/.test(q) && digitos.length > 0;
  const termos = normalizar(q).split(/\s+/).filter(Boolean);
  const numeroBuscado = numerica ? String(Number(digitos)) : "";

  const res = lista.filter((r) => {
    if (f.grupo && r.grupo !== f.grupo) return false;
    if (f.validade && statusValidade(r, hoje) !== f.validade) return false;
    if (f.situacao && !atendeSituacao(r, f.situacao)) return false;
    if (!q) return true;
    if (numerica) return String(r.numero) === numeroBuscado || (r.documento ?? "").replace(/\D/g, "").includes(digitos);
    const nome = normalizar(r.nome ?? "");
    const doc = normalizar(r.documento ?? "");
    return termos.every((t) => nome.includes(t) || doc.includes(t));
  });

  if (numerica) {
    return res.sort((a, b) => Number(String(b.numero) === numeroBuscado) - Number(String(a.numero) === numeroBuscado));
  }
  const d = f.direcao;
  return res.sort((a, b) => {
    if (f.ordem === "numero") return ((a.numero ?? Number.MAX_SAFE_INTEGER) - (b.numero ?? Number.MAX_SAFE_INTEGER)) * d;
    const valor = (r: T) => {
      if (f.ordem === "validade") return r.validade_indeterminada ? "9999" : r.validade ?? "";
      return (r[f.ordem] ?? "") as string;
    };
    const x = valor(a), y = valor(b);
    if (!x && y) return 1; // vazios sempre ao final
    if (x && !y) return -1;
    return x.localeCompare(y, "pt-BR") * d;
  });
}

export function idade(nascimento: string | null, hoje: Date) {
  if (!nascimento) return null;
  const [a = 0, m = 1, d = 1] = nascimento.split("-").map(Number);
  let anos = hoje.getFullYear() - a;
  if (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) anos--;
  return anos;
}

export function csvHistorico(lista: LinhaConsulta[], hoje: Date) {
  const cab = ["Tipo", "Nº", "Nome", "Nascimento", "Validade", "Status", "CPF/RG", "Telefone", "CID", "Determinação", "Situação", "Observações"];
  const br = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "");
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const linhas = lista.map((r) => [
    ROTULO_GRUPO[r.grupo as GrupoHistorico] ?? r.grupo, r.numero === null ? "" : String(r.numero), r.nome ?? "", br(r.nascimento),
    r.validade_indeterminada ? "Indeterminada" : br(r.validade), ROTULO_VALIDADE[statusValidade(r, hoje)],
    r.documento ?? "", r.telefone ?? "", r.cid ?? "", r.determinacao ?? "", r.situacao ?? "", r.observacoes ?? "",
  ].map(esc).join(";"));
  return "\ufeff" + [cab.map(esc).join(";"), ...linhas].join("\r\n");
}
