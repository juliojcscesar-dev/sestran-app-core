import { supabase } from "@/integrations/supabase/client";

export type Bairro = { id: string; nome: string; codigo_oficial: string | null; fonte: string; fonte_url: string | null; atualizado_em: string; ativo: boolean };
export type Rua = { id: string; tipo: string | null; nome: string; nome_completo: string; bairro_id: string | null; codigo_oficial: string | null; fonte: string; fonte_url: string | null; atualizado_em: string; geometria: unknown; ativo: boolean; bairros: { nome: string } | null };

export async function listarBairrosOficiais(busca = "") {
  let q = supabase.from("bairros").select("id,nome,codigo_oficial,fonte,fonte_url,atualizado_em,ativo").order("nome");
  if (busca.trim()) q = q.ilike("nome", `%${busca.trim()}%`);
  const { data, error } = await q.limit(500); if (error) throw error; return (data ?? []) as Bairro[];
}

export async function listarRuasOficiais(busca = "", bairroId?: string) {
  let q = supabase.from("ruas").select("id,tipo,nome,nome_completo,bairro_id,codigo_oficial,fonte,fonte_url,atualizado_em,geometria,ativo,bairros(nome)").order("nome_completo");
  if (busca.trim()) q = q.ilike("nome_completo", `%${busca.trim()}%`); if (bairroId) q = q.eq("bairro_id", bairroId);
  const { data, error } = await q.limit(500); if (error) throw error; return (data ?? []) as unknown as Rua[];
}

export async function salvarBairro(dados: Omit<Bairro, "id" | "ativo">, id?: string) {
  const q = id ? supabase.from("bairros").update(dados).eq("id", id) : supabase.from("bairros").insert(dados);
  const { error } = await q; if (error) throw error;
}

export async function salvarRua(dados: Omit<Rua, "id" | "ativo" | "bairros" | "geometria">, id?: string) {
  const q = id ? supabase.from("ruas").update(dados).eq("id", id) : supabase.from("ruas").insert(dados);
  const { error } = await q; if (error) throw error;
}

export async function pesquisarEnderecoOficial(termo: string) {
  const { data, error } = await supabase.from("ruas").select("id,nome_completo,geometria,bairros(nome)").eq("ativo", true).ilike("nome_completo", `%${termo.trim()}%`).limit(8);
  if (error) throw error; return data ?? [];
}