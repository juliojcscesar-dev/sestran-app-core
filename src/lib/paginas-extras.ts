import type { ImagemRelatorio } from "@/lib/relatorio-imagens";

/** Página adicional da O.S.: repete o cabeçalho e traz observação e imagem opcionais. */
export type PaginaExtra = { id: string; observacao: string; imagem: ImagemRelatorio | null };

export const MAX_PAGINAS_EXTRAS = 5;

export function lerPaginasExtras(valor: unknown): PaginaExtra[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .filter((p): p is Record<string, unknown> => Boolean(p) && typeof p === "object")
    .map((p) => {
      const img = p["imagem"] as ImagemRelatorio | null | undefined;
      return {
        id: typeof p["id"] === "string" ? p["id"] : crypto.randomUUID(),
        observacao: typeof p["observacao"] === "string" ? p["observacao"] : "",
        imagem: img && typeof img.src === "string" && img.src.startsWith("data:image") ? img : null,
      };
    });
}

/** Mantém só páginas com conteúdo; página vazia não sai no documento. */
export function paginasPreenchidas(paginas: PaginaExtra[]) {
  return paginas.filter((p) => p.observacao.trim() || p.imagem);
}
