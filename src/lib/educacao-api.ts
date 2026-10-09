import { supabase } from "@/integrations/supabase/client";
import type { CategoriaAcao, StatusAcao } from "@/lib/educacao";
import type { ImagemRelatorio } from "@/lib/educacao-imagens";
import type { Json } from "@/integrations/supabase/types";

export type AcaoEducativa = {
  tipo_atividade: string | null;
  endereco: string | null;
  numero_endereco: string | null;
  bairro: string | null;
  equipe: string | null;
  relatorio_texto: string | null;
  relatorio_imagens: ImagemRelatorio[];
  id: string;
  titulo: string;
  descricao: string | null;
  data_acao: string;
  horario_inicio: string | null;
  horario_fim: string | null;
  categoria: CategoriaAcao;
  status: StatusAcao;
  local: string | null;
  publico_alvo: string | null;
  participantes: number | null;
  observacoes: string | null;
  escola_id: string | null;
  orientador_id: string | null;
  tema_id: string | null;
  arquivada: boolean;
  escolas: { nome: string } | null;
  orientadores: { nome: string } | null;
  temas_educativos: { nome: string } | null;
};

export type DadosAcao = Omit<
  AcaoEducativa,
  "id" | "arquivada" | "escolas" | "orientadores" | "temas_educativos"
>;

export type FiltrosAcao = {
  inicio?: string;
  fim?: string;
  status?: string;
  categoria?: string;
  escolaId?: string;
  orientadorId?: string;
  arquivadas?: boolean;
};

const selecao =
  "id,titulo,descricao,data_acao,horario_inicio,horario_fim,categoria,status,local,publico_alvo,participantes,observacoes,escola_id,orientador_id,tema_id,arquivada,tipo_atividade,endereco,numero_endereco,bairro,equipe,relatorio_texto,relatorio_imagens,escolas(nome),orientadores(nome),temas_educativos(nome)";

export async function listarAcoes(filtros: FiltrosAcao = {}) {
  let query = supabase
    .from("acoes_educativas")
    .select(selecao)
    .eq("arquivada", filtros.arquivadas ?? false)
    .order("data_acao")
    .order("horario_inicio");
  if (filtros.inicio) query = query.gte("data_acao", filtros.inicio);
  if (filtros.fim) query = query.lte("data_acao", filtros.fim);
  if (filtros.status) query = query.eq("status", filtros.status);
  if (filtros.categoria) query = query.eq("categoria", filtros.categoria);
  if (filtros.escolaId) query = query.eq("escola_id", filtros.escolaId);
  if (filtros.orientadorId) query = query.eq("orientador_id", filtros.orientadorId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as AcaoEducativa[];
}

export async function obterAcao(id: string) {
  const [acao, historico] = await Promise.all([
    supabase.from("acoes_educativas").select(selecao).eq("id", id).single(),
    supabase
      .from("acao_educativa_historico")
      .select("id,acao,alteracoes,created_at,user_id")
      .eq("acao_educativa_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (acao.error) throw acao.error;
  if (historico.error) throw historico.error;
  return { acao: acao.data as unknown as AcaoEducativa, historico: historico.data ?? [] };
}

export async function criarAcao(dados: DadosAcao) {
  const { data: usuario } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("acoes_educativas")
    .insert({ ...dados, relatorio_imagens: dados.relatorio_imagens as unknown as Json, criado_por: usuario.user?.id ?? null })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function atualizarAcao(id: string, dados: DadosAcao) {
  const { error } = await supabase.from("acoes_educativas").update({ ...dados, relatorio_imagens: dados.relatorio_imagens as unknown as Json }).eq("id", id).select("id").single();
  if (error) throw error;
}

export async function arquivarAcao(id: string, valor: boolean) {
  const { data: usuario } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("acoes_educativas")
    .update({
      arquivada: valor,
      arquivada_em: valor ? new Date().toISOString() : null,
      arquivada_por: valor ? usuario.user?.id ?? null : null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function listarReferenciasEducacao() {
  const [escolas, orientadores, temas] = await Promise.all([
    supabase.from("escolas").select("id,nome").eq("ativo", true).order("nome"),
    supabase.from("orientadores").select("id,nome").eq("ativo", true).order("nome"),
    supabase.from("temas_educativos").select("id,nome").eq("ativo", true).order("nome"),
  ]);
  if (escolas.error) throw escolas.error;
  if (orientadores.error) throw orientadores.error;
  if (temas.error) throw temas.error;
  return { escolas: escolas.data ?? [], orientadores: orientadores.data ?? [], temas: temas.data ?? [] };
}

export async function criarTema(nome: string) {
  const { data, error } = await supabase
    .from("temas_educativos")
    .insert({ nome: nome.trim() })
    .select("id,nome")
    .single();
  if (error) throw error;
  return data;
}