import type { ToolContext } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "./supabase";

type Filtros = { tabela: string; colunas: string; data: string; de?: string | undefined; ate?: string | undefined; status?: string | undefined; limite?: number | undefined; arquivo?: string | undefined };

/** Consulta somente-leitura com o usuário conectado; RLS decide o que ele vê. */
export async function consultar(ctx: ToolContext, f: Filtros) {
  if (!ctx.isAuthenticated()) {
    return { content: [{ type: "text" as const, text: "Não autenticado." }], isError: true };
  }
  const sb = supabaseForUser(ctx);
  let q = sb.from(f.tabela as never).select(f.colunas).order(f.data, { ascending: false }).limit(f.limite ?? 50);
  if (f.arquivo) q = q.eq(f.arquivo, false);
  if (f.de) q = q.gte(f.data, f.de);
  if (f.ate) q = q.lte(f.data, f.ate);
  if (f.status) q = q.eq("status", f.status);
  const { data, error } = await q;
  if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };
  const rows = (data ?? []) as unknown as Record<string, string | number | boolean | null>[];
  return {
    content: [{ type: "text" as const, text: rows.length ? JSON.stringify(rows) : "Nenhum registro encontrado (ou sem acesso a este módulo)." }],
    structuredContent: { registros: rows },
  };
}
