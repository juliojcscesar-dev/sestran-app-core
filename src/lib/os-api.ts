import type { PaginaExtra } from "@/lib/paginas-extras";
import { supabase } from "@/integrations/supabase/client";
import type { StatusOS } from "@/lib/os";
import type { InterdicaoMapa, PercursoMapa } from "@/lib/mapa";
import type { ImagemRelatorio } from "@/lib/relatorio-imagens";

export type AgenteOS = {
  agente_id: string;
  funcao: string | null;
  hora_chegada: string | null;
  observacao: string | null;
};

export type OrientadorOS = {
  orientador_id: string;
  observacao: string | null;
};

export type DadosOS = {
  numero?: string;
  data_emissao: string;
  ipm: string | null;
  remetente: string | null;
  destinatario: string | null;
  natureza: string | null;
  solicitante_id: string | null;
  local: string | null;
  data_servico: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  evento_id: string | null;
  trajeto: string | null;
  observacoes: string | null;
  telefone?: string | null;
  responsavel?: string | null;
  status: StatusOS;
  status_manual?: boolean;
  percurso: PercursoMapa | null;
  mapa_imagem?: string | null;
  relatorio_texto: string | null;
  relatorio_imagens: ImagemRelatorio[];
  paginas_extras?: PaginaExtra[];
  servicos: { tipo_servico_id: string; detalhe: string | null }[];
  agentes: AgenteOS[];
  orientadores: OrientadorOS[];
  interdicoes: InterdicaoMapa[];
};


function checar<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data;
}

function checarUnico<T>(res: { data: T; error: unknown }): NonNullable<T> {
  const dados = checar(res);
  if (!dados) throw new Error("Não foi possível concluir o cadastro.");
  return dados;
}

const SELECAO_LISTA =
  "id, numero, ano, data_servico, hora_inicio, hora_fim, local, status, arquivada, natureza, evento_id, solicitante_id, eventos(titulo), solicitantes(nome)";

export type FiltrosOS = {
  numero?: string;
  de?: string;
  ate?: string;
  eventoId?: string;
  solicitanteId?: string;
  local?: string;
  status?: string;
  arquivadas?: boolean;
};

export async function listarOrdens(filtros: FiltrosOS) {
  let q = supabase.from("ordens_servico").select(SELECAO_LISTA);
  q = q.eq("arquivada", filtros.arquivadas ?? false);
  if (filtros.numero) q = q.ilike("numero", `%${filtros.numero}%`);
  if (filtros.de) q = q.gte("data_servico", filtros.de);
  if (filtros.ate) q = q.lte("data_servico", filtros.ate);
  if (filtros.eventoId) q = q.eq("evento_id", filtros.eventoId);
  if (filtros.solicitanteId) q = q.eq("solicitante_id", filtros.solicitanteId);
  if (filtros.local) q = q.ilike("local", `%${filtros.local}%`);
  if (filtros.status) q = q.eq("status", filtros.status);
  const res = await q.order("data_servico", { ascending: false }).limit(300);
  return checar(res);
}

export async function contarSituacoesOrdens() {
  const contar = async (status: StatusOS) => {
    const res = await supabase.from("ordens_servico").select("id", { count: "exact", head: true }).eq("status", status);
    checar(res);
    return res.count ?? 0;
  };
  const [agendadas, executadas] = await Promise.all([contar("AGENDADA"), contar("EXECUTADA")]);
  return { agendadas, executadas };
}

export async function obterOrdem(id: string) {
  const [ordem, servicos, agentes, orientadores, interdicoes] = await Promise.all([
    supabase
      .from("ordens_servico")
      .select(
        "*, eventos(id, titulo, data_inicio, local), solicitantes(id, nome, telefone, email)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("ordem_servico_servicos")
      .select("tipo_servico_id, detalhe, tipos_servico(nome)")
      .eq("ordem_servico_id", id),
    supabase
      .from("ordem_servico_agentes")
      .select("agente_id, funcao, hora_chegada, observacao, agentes(nome, matricula)")
      .eq("ordem_servico_id", id),
    supabase
      .from("ordem_servico_orientadores")
      .select("orientador_id, observacao, orientadores(nome, matricula)")
      .eq("ordem_servico_id", id),
    supabase
      .from("ordem_servico_interdicoes")
      .select("id, rua, trecho_inicial, trecho_final, observacao, geometria")
      .eq("ordem_servico_id", id)
      .order("created_at"),
  ]);
  const dados = checar(ordem);
  if (!dados) throw new Error("Ordem de serviço não encontrada.");
  return {
    ordem: dados,
    servicos: checar(servicos) ?? [],
    agentes: checar(agentes) ?? [],
    orientadores: checar(orientadores) ?? [],
    interdicoes: (checar(interdicoes) ?? []).map((i) => ({
      id: i.id,
      rua: i.rua ?? "",
      trecho_inicial: i.trecho_inicial ?? "",
      trecho_final: i.trecho_final ?? "",
      observacao: i.observacao ?? "",
      geometria: lerGeometria(i.geometria),
    })) as InterdicaoMapa[],
  };
}

function lerGeometria(valor: unknown): PontoMapaLido[] | null {
  if (!Array.isArray(valor)) return null;
  const pontos = valor
    .map((p) => (p && typeof p === "object" ? (p as Record<string, unknown>) : null))
    .filter((p): p is Record<string, unknown> => p !== null)
    .map((p) => ({ lat: Number(p["lat"]), lng: Number(p["lng"]) }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  return pontos.length ? pontos : null;
}

type PontoMapaLido = { lat: number; lng: number };

export type OrdemCompleta = Awaited<ReturnType<typeof obterOrdem>>;

async function sincronizarFilhos(id: string, dados: DadosOS) {
  const removidos = await Promise.all([
    supabase.from("ordem_servico_servicos").delete().eq("ordem_servico_id", id),
    supabase.from("ordem_servico_agentes").delete().eq("ordem_servico_id", id),
    supabase.from("ordem_servico_orientadores").delete().eq("ordem_servico_id", id),
    supabase.from("ordem_servico_interdicoes").delete().eq("ordem_servico_id", id),
  ]);
  removidos.forEach(checar);

  if (dados.servicos.length) {
    checar(
      await supabase
        .from("ordem_servico_servicos")
        .insert(dados.servicos.map((s) => ({ ...s, ordem_servico_id: id })))
        .select("id"),
    );
  }
  if (dados.agentes.length) {
    checar(
      await supabase
        .from("ordem_servico_agentes")
        .insert(dados.agentes.map((a) => ({ ...a, ordem_servico_id: id })))
        .select("id"),
    );
  }
  if (dados.orientadores.length) {
    checar(
      await supabase
        .from("ordem_servico_orientadores")
        .insert(dados.orientadores.map((o) => ({ ...o, ordem_servico_id: id })))
        .select("id"),
    );
  }
  const interdicoes = dados.interdicoes.filter((i) => i.rua.trim() || i.geometria?.length);
  if (interdicoes.length) {
    checar(
      await supabase
        .from("ordem_servico_interdicoes")
        .insert(
          interdicoes.map((i) => ({
            ordem_servico_id: id,
            rua: i.rua.trim() || "Rua não informada",
            trecho_inicial: i.trecho_inicial.trim() || null,
            trecho_final: i.trecho_final.trim() || null,
            observacao: i.observacao.trim() || null,
            geometria: i.geometria ? (i.geometria as unknown as never) : null,
          })),
        )
        .select("id"),
    );
  }
}

function camposOrdem(dados: DadosOS) {
  return {
    data_emissao: dados.data_emissao,
    ano: Number(dados.data_emissao.slice(0, 4)),
    ipm: dados.ipm,
    remetente: dados.remetente,
    destinatario: dados.destinatario,
    natureza: dados.natureza,
    titulo: dados.natureza,
    solicitante_id: dados.solicitante_id,
    local: dados.local,
    data_servico: dados.data_servico,
    hora_inicio: dados.hora_inicio,
    hora_fim: dados.hora_fim,
    evento_id: dados.evento_id,
    trajeto: dados.trajeto,
    observacoes: dados.observacoes,
    telefone: dados.telefone ?? null,
    responsavel: dados.responsavel ?? null,
    status: dados.status,
    status_manual: dados.status_manual ?? false,
    percurso: dados.percurso ? (dados.percurso as unknown as never) : null,
    mapa_imagem: dados.mapa_imagem !== undefined ? dados.mapa_imagem : null,
    relatorio_texto: dados.relatorio_texto,
    relatorio_imagens: (dados.relatorio_imagens ?? []) as unknown as never,
    paginas_extras: (dados.paginas_extras ?? []) as unknown as never,
  };
}


export async function criarOrdem(dados: DadosOS) {
  const { data: userData } = await supabase.auth.getUser();
  const criada = checar(
    await supabase
      .from("ordens_servico")
      .insert({
        ...camposOrdem(dados),
        // O banco normaliza números manuais e mantém o contador anual consistente.
        numero: dados.numero?.trim() ?? "",
        criado_por: userData.user?.id ?? null,
      })
      .select("id, numero")
      .single(),
  );
  if (!criada) throw new Error("Não foi possível criar a ordem de serviço.");
  await sincronizarFilhos(criada.id, dados);
  return criada;
}

export async function proximoNumeroOS(ano: number) {
  const [{ data: contador, error: erroContador }, { data: maior, error: erroMaior }] =
    await Promise.all([
      supabase.from("os_contador").select("ultimo").eq("ano", ano).maybeSingle(),
      supabase
        .from("ordens_servico")
        .select("sequencial")
        .eq("ano", ano)
        .order("sequencial", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
  if (erroContador) throw erroContador;
  if (erroMaior) throw erroMaior;
  const proximo = Math.max(contador?.ultimo ?? 0, maior?.sequencial ?? 0) + 1;
  return `${String(proximo).padStart(3, "0")}/${ano}`;
}

export function normalizarNumeroOS(valor: string, ano: number) {
  const limpo = valor.trim();
  const correspondencia = /^(\d+)(?:\/(\d{4}))?$/.exec(limpo);
  if (!correspondencia) throw new Error("Use somente o número ou o formato número/ano.");
  const sequencial = Number(correspondencia[1]);
  const anoInformado = correspondencia[2] ? Number(correspondencia[2]) : ano;
  if (!Number.isInteger(sequencial) || sequencial < 1) {
    throw new Error("O número da O.S. deve ser maior que zero.");
  }
  if (anoInformado !== ano) {
    throw new Error("O ano do número deve corresponder ao ano da data de emissão.");
  }
  return { sequencial, ano, numero: `${String(sequencial).padStart(3, "0")}/${ano}` };
}

export async function numeroOSDisponivel(numero: string, ano: number) {
  const normalizado = normalizarNumeroOS(numero, ano);
  const { data, error } = await supabase
    .from("ordens_servico")
    .select("id")
    .eq("ano", ano)
    .eq("sequencial", normalizado.sequencial)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return { disponivel: !data, numero: normalizado.numero };
}

export async function atualizarOrdem(id: string, dados: DadosOS) {
  checar(
    await supabase
      .from("ordens_servico")
      .update(camposOrdem(dados))
      .eq("id", id)
      .select("id")
      .single(),
  );
  await sincronizarFilhos(id, dados);
  return { id };
}

export async function alterarStatusOrdem(id: string, status: StatusOS) {
  checar(
    await supabase.from("ordens_servico").update({ status }).eq("id", id).select("id").single(),
  );
}

export async function arquivarOrdem(id: string, arquivar: boolean) {
  const { data: userData } = await supabase.auth.getUser();
  checar(
    await supabase
      .from("ordens_servico")
      .update({
        arquivada: arquivar,
        arquivada_em: arquivar ? new Date().toISOString() : null,
        arquivada_por: arquivar ? (userData.user?.id ?? null) : null,
      })
      .eq("id", id)
      .select("id")
      .single(),
  );
}

export async function excluirOrdem(id: string) {
  checarUnico(
    await supabase.from("ordens_servico").delete().eq("id", id).select("id").single(),
  );
}

export async function historicoOrdem(id: string) {
  return checar(
    await supabase
      .from("ordem_servico_historico")
      .select("id, acao, alteracoes, created_at, user_id")
      .eq("ordem_servico_id", id)
      .order("created_at", { ascending: false }),
  );
}

/* ---------- Cadastros auxiliares ---------- */

export async function listarSolicitantes() {
  return checar(
    await supabase
      .from("solicitantes")
      .select("id, nome, tipo")
      .eq("ativo", true)
      .order("nome"),
  );
}

export async function listarAgentes() {
  return checar(
    await supabase.from("agentes").select("id, nome, matricula").eq("ativo", true).order("nome"),
  );
}

export async function listarOrientadores() {
  return checar(
    await supabase
      .from("orientadores")
      .select("id, nome, matricula")
      .eq("ativo", true)
      .order("nome"),
  );
}

export async function listarEventos(somenteAtivos = false) {
  let consulta = supabase.from("eventos").select("id, titulo, data_inicio, local");
  if (somenteAtivos) consulta = consulta.eq("ativo", true);
  return checar(await consulta.order("data_inicio", { ascending: false }).limit(300));
}

export async function listarLocais() {
  return checar(
    await supabase.from("locais").select("id, nome, endereco").eq("ativo", true).order("nome"),
  );
}

export async function listarTiposServico() {
  return checar(
    await supabase
      .from("tipos_servico")
      .select("id, nome")
      .eq("ativo", true)
      .order("ordem")
      .order("nome"),
  );
}

export async function criarSolicitante(nome: string) {
  return checarUnico(
    await supabase.from("solicitantes").insert({ nome }).select("id, nome, tipo").single(),
  );
}

export async function criarAgente(nome: string) {
  return checarUnico(
    await supabase.from("agentes").insert({ nome }).select("id, nome, matricula").single(),
  );
}

export async function criarOrientador(nome: string) {
  return checarUnico(
    await supabase.from("orientadores").insert({ nome }).select("id, nome, matricula").single(),
  );
}

export async function criarLocal(nome: string) {
  return checarUnico(
    await supabase.from("locais").insert({ nome }).select("id, nome, endereco").single(),
  );
}

export async function criarTipoServico(nome: string) {
  return checarUnico(await supabase.from("tipos_servico").insert({ nome }).select("id, nome").single());
}

export async function criarEvento(titulo: string, data: string, local: string | null) {
  return checarUnico(await supabase.from("eventos").insert({
    titulo: titulo.trim(), data_inicio: `${data}T00:00:00`, local,
  }).select("id, titulo, local").single());
}

export async function editarTipoServico(id: string, nome: string) {
  return checarUnico(await supabase.from("tipos_servico").update({ nome: nome.trim() })
    .eq("id", id).select("id, nome").single());
}

/** Retira do catálogo ativo sem apagar vínculos de ordens já emitidas. */
export async function excluirTipoServico(id: string) {
  return checarUnico(await supabase.from("tipos_servico").update({ ativo: false })
    .eq("id", id).select("id").single());
}

export type CadastroOS = "solicitantes" | "eventos" | "locais" | "agentes" | "orientadores";

/** Renomeia um nome salvo usado nas listas da O.S. */
export async function editarCadastroOS(tabela: CadastroOS, id: string, nome: string) {
  const valor = nome.trim();
  if (valor.length < 2) throw new Error("Informe um nome com pelo menos 2 letras.");
  const resposta = tabela === "eventos"
    ? await supabase.from("eventos").update({ titulo: valor }).eq("id", id).select("id").single()
    : await supabase.from(tabela).update({ nome: valor }).eq("id", id).select("id").single();
  return checarUnico(resposta);
}

/** Retira o nome das listas sem apagar o vínculo das ordens já emitidas. */
export async function excluirCadastroOS(tabela: CadastroOS, id: string) {
  return checarUnico(await supabase.from(tabela).update({ ativo: false }).eq("id", id).select("id").single());
}

export async function obterConfiguracoes() {
  const linhas = checar(await supabase.from("configuracoes").select("chave, valor"));
  const mapa: Record<string, string> = {};
  for (const l of linhas ?? []) mapa[l.chave] = l.valor ?? "";
  return {
    orgao: mapa["orgao"] || "Prefeitura Municipal de Paranavaí",
    secretaria: mapa["secretaria"] || "Secretaria Municipal de Trânsito — SESTRAN",
    logo_url: mapa["logo_url"] || "",
    autoridade: mapa["autoridade_transito"] || "Carlos Hideki de Souza Fujimori",
    cargo_autoridade: mapa["cargo_autoridade"] || "Diretor de Trânsito",
  };
}

export async function salvarConfiguracoes(valores: Record<string, string>) {
  for (const [chave, valor] of Object.entries(valores)) {
    checar(
      await supabase.from("configuracoes").upsert({ chave, valor }).select("chave").single(),
    );
  }
}
