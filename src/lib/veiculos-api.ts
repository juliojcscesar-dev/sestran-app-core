import { supabase } from "@/integrations/supabase/client";
import type { TipoDenuncia, SituacaoVeiculo } from "@/lib/veiculos";

export type DadosVeiculo = {
  situacao?: SituacaoVeiculo | null;
  placa: string | null;
  chassi: string | null;
  marca: string | null;
  modelo: string | null;
  cor: string | null;
  endereco: string;
  bairro: string | null;
  tipo_denuncia: TipoDenuncia;
  numero_denuncia: string | null;
  data_constatacao: string;
  data_verificacao: string | null;
  data_notificacao: string | null;
  data_recolhimento: string | null;
  data_retirada: string | null;
  observacoes: string | null;
  latitude: number | null;
  longitude: number | null;
  bairro_id: string | null;
  rua_id: string | null;
};

function checar<T>(res: { data: T; error: unknown }): T {
  if (res.error) {
    const mensagem = typeof res.error === "object" && "message" in res.error ? String(res.error.message) : "Não foi possível salvar ou carregar o registro.";
    throw new Error(mensagem);
  }
  return res.data;
}

const SELECAO =
  "id, placa, chassi, marca, modelo, cor, endereco, bairro, tipo_denuncia, numero_denuncia, data_constatacao, data_verificacao, data_notificacao, prazo_recolhimento, data_recolhimento, data_retirada, status, situacao, observacoes, arquivado, arquivado_em, created_at, latitude, longitude, bairro_id, rua_id";

export type VeiculoLista = {
  situacao: SituacaoVeiculo | null;
  id: string;
  placa: string | null;
  chassi: string | null;
  marca: string | null;
  modelo: string | null;
  cor: string | null;
  endereco: string;
  bairro: string | null;
  tipo_denuncia: string;
  numero_denuncia: string | null;
  data_constatacao: string;
  data_verificacao: string | null;
  data_notificacao: string | null;
  prazo_recolhimento: string | null;
  data_recolhimento: string | null;
  data_retirada: string | null;
  status: string;
  observacoes: string | null;
  arquivado: boolean;
  arquivado_em: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  bairro_id: string | null;
  rua_id: string | null;
};

export type FiltrosVeiculo = {
  busca?: string;
  bairro?: string;
  status?: string;
  tipoDenuncia?: string;
  de?: string;
  ate?: string;
  arquivados?: boolean;
};

export async function listarVeiculos(filtros: FiltrosVeiculo = {}) {
  let q = supabase.from("veiculos_abandonados").select(SELECAO);
  q = q.eq("arquivado", filtros.arquivados ?? false);
  if (filtros.busca) {
    const termo = `%${filtros.busca}%`;
    q = q.or(
      `placa.ilike.${termo},chassi.ilike.${termo},endereco.ilike.${termo},modelo.ilike.${termo},marca.ilike.${termo}`,
    );
  }
  if (filtros.bairro) q = q.ilike("bairro", `%${filtros.bairro}%`);
  if (filtros.status) q = q.eq("status", filtros.status);
  if (filtros.tipoDenuncia) q = q.eq("tipo_denuncia", filtros.tipoDenuncia);
  if (filtros.de) q = q.gte("data_constatacao", filtros.de);
  if (filtros.ate) q = q.lte("data_constatacao", filtros.ate);
  const res = await q.order("data_constatacao", { ascending: false }).limit(500);
  return (checar(res) ?? []) as VeiculoLista[];
}

export type FotoVeiculo = {
  id: string;
  veiculo_id: string;
  caminho: string;
  url: string;
  descricao: string | null;
  created_at: string;
};

export async function obterVeiculo(id: string) {
  const [veiculo, fotos, historico] = await Promise.all([
    supabase.from("veiculos_abandonados").select(SELECAO).eq("id", id).single(),
    supabase
      .from("veiculo_fotos")
      .select("id, veiculo_id, caminho, url, descricao, tamanho, created_at")
      .eq("veiculo_id", id)
      .order("created_at"),
    supabase
      .from("veiculo_historico")
      .select("id, acao, alteracoes, created_at, user_id")
      .eq("veiculo_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    veiculo: checar(veiculo) as VeiculoLista,
    fotos: (checar(fotos) ?? []) as FotoVeiculo[],
    historico: (checar(historico) ?? []) as {
      id: string;
      acao: string;
      alteracoes: unknown;
      created_at: string;
      user_id: string | null;
    }[],
  };
}

export type VeiculoCompleto = Awaited<ReturnType<typeof obterVeiculo>>;

export async function criarVeiculo(dados: DadosVeiculo) {
  const { data: sessao } = await supabase.auth.getUser();
  const res = await supabase
    .from("veiculos_abandonados")
    .insert({ ...dados, registrado_por: sessao.user?.id ?? null })
    .select("id")
    .single();
  const criado = checar(res);
  if (!criado) throw new Error("Não foi possível registrar o veículo.");
  return criado.id as string;
}

export async function atualizarVeiculo(id: string, dados: DadosVeiculo) {
  checar(await supabase.from("veiculos_abandonados").update(dados).eq("id", id).select("id").single());
  return id;
}

export async function arquivarVeiculo(id: string, arquivar: boolean) {
  const { data: sessao } = await supabase.auth.getUser();
  checar(
    await supabase
      .from("veiculos_abandonados")
      .update({
        arquivado: arquivar,
        arquivado_em: arquivar ? new Date().toISOString() : null,
        arquivado_por: arquivar ? (sessao.user?.id ?? null) : null,
      })
      .eq("id", id)
      .select("id")
      .single(),
  );
}

const BUCKET = "veiculos";

export async function enviarFoto(veiculoId: string, arquivo: File, descricao?: string) {
  const extensao = arquivo.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const caminho = `${veiculoId}/${crypto.randomUUID()}.${extensao}`;
  const envio = await supabase.storage.from(BUCKET).upload(caminho, arquivo, {
    contentType: arquivo.type || "image/jpeg",
    upsert: false,
  });
  if (envio.error) throw envio.error;

  const assinada = await supabase.storage.from(BUCKET).createSignedUrl(caminho, 60 * 60 * 24 * 365);
  if (assinada.error) throw assinada.error;

  checar(
    await supabase
      .from("veiculo_fotos")
      .insert({
        veiculo_id: veiculoId,
        caminho,
        url: assinada.data.signedUrl,
        descricao: descricao?.trim() || null,
      })
      .select("id")
      .single(),
  );
}

export async function removerFoto(foto: FotoVeiculo) {
  await supabase.storage.from(BUCKET).remove([foto.caminho]);
  checar(await supabase.from("veiculo_fotos").delete().eq("id", foto.id).select("id"));
}

/** URL temporária de leitura para uma foto guardada em bucket privado. */
export async function urlAssinada(caminho: string, segundos = 3600) {
  const res = await supabase.storage.from(BUCKET).createSignedUrl(caminho, segundos);
  if (res.error) return null;
  return res.data.signedUrl;
}

export async function listarBairros() {
  const res = await supabase
    .from("veiculos_abandonados")
    .select("bairro")
    .not("bairro", "is", null)
    .limit(1000);
  const linhas = checar(res) ?? [];
  const nomes = new Set<string>();
  for (const l of linhas) if (l.bairro) nomes.add(l.bairro);
  return [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export async function listarSituacoesVeiculo() {
  const res = await supabase.from("situacoes_veiculo").select("id, nome, ativo, ordem").order("ordem").order("nome");
  return (checar(res) ?? []) as { id: string; nome: string; ativo: boolean; ordem: number }[];
}

export async function salvarSituacaoVeiculo(nome: string, id?: string) {
  const limpo = nome.trim().replace(/\s+/g, " ");
  if (limpo.length < 2) throw new Error("Informe o nome da situação.");
  const existentes = await listarSituacoesVeiculo();
  if (existentes.some(s => s.ativo && s.id !== id && s.nome.localeCompare(limpo, "pt-BR", { sensitivity: "base" }) === 0)) throw new Error("Já existe uma situação com esse nome.");
  const res = id
    ? await supabase.from("situacoes_veiculo").update({ nome: limpo }).eq("id", id).select("id, nome").single()
    : await supabase.from("situacoes_veiculo").insert({ nome: limpo }).select("id, nome").single();
  const item = checar(res);
  if (!item) throw new Error("Não foi possível salvar a situação.");
  return item as { id: string; nome: string };
}

export async function excluirSituacaoVeiculo(id: string) {
  const res = await supabase.from("situacoes_veiculo").update({ ativo: false }).eq("id", id).select("id");
  if (!checar(res)?.length) throw new Error("Exclusão não autorizada pelo administrador.");
}
