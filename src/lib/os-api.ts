import { supabase } from "@/integrations/supabase/client";
import type { StatusOS } from "@/lib/os";

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
  status: StatusOS;
  servicos: { tipo_servico_id: string; detalhe: string | null }[];
  agentes: AgenteOS[];
  orientadores: OrientadorOS[];
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

export async function obterOrdem(id: string) {
  const [ordem, servicos, agentes, orientadores] = await Promise.all([
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
  ]);
  const dados = checar(ordem);
  if (!dados) throw new Error("Ordem de serviço não encontrada.");
  return {
    ordem: dados,
    servicos: checar(servicos) ?? [],
    agentes: checar(agentes) ?? [],
    orientadores: checar(orientadores) ?? [],
  };
}

export type OrdemCompleta = Awaited<ReturnType<typeof obterOrdem>>;

async function sincronizarFilhos(id: string, dados: DadosOS) {
  await Promise.all([
    supabase.from("ordem_servico_servicos").delete().eq("ordem_servico_id", id),
    supabase.from("ordem_servico_agentes").delete().eq("ordem_servico_id", id),
    supabase.from("ordem_servico_orientadores").delete().eq("ordem_servico_id", id),
  ]);

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
    status: dados.status,
  };
}

export async function criarOrdem(dados: DadosOS) {
  const { data: userData } = await supabase.auth.getUser();
  const criada = checar(
    await supabase
      .from("ordens_servico")
      .insert({
        ...camposOrdem(dados),
        // o número é gerado pelo banco (formato 001/2026)
        numero: "",
        criado_por: userData.user?.id ?? null,
      })
      .select("id, numero")
      .single(),
  );
  if (!criada) throw new Error("Não foi possível criar a ordem de serviço.");
  await sincronizarFilhos(criada.id, dados);
  return criada;
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

export async function listarEventos() {
  return checar(
    await supabase
      .from("eventos")
      .select("id, titulo, data_inicio, local")
      .order("data_inicio", { ascending: false })
      .limit(300),
  );
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

export async function obterConfiguracoes() {
  const linhas = checar(await supabase.from("configuracoes").select("chave, valor"));
  const mapa: Record<string, string> = {};
  for (const l of linhas ?? []) mapa[l.chave] = l.valor ?? "";
  return {
    orgao: mapa["orgao"] || "Prefeitura Municipal de Paranavaí",
    secretaria: mapa["secretaria"] || "Secretaria Municipal de Trânsito — SESTRAN",
    logo_url: mapa["logo_url"] || "",
  };
}

export async function salvarConfiguracoes(valores: Record<string, string>) {
  for (const [chave, valor] of Object.entries(valores)) {
    checar(
      await supabase.from("configuracoes").upsert({ chave, valor }).select("chave").single(),
    );
  }
}
