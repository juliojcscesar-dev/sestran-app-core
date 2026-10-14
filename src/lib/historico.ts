const LIMITE = 120;

function resumir(texto: string): string {
  if (texto.startsWith("data:image") || texto.includes("data:image")) return "imagem";
  if (texto.length <= LIMITE) return texto;
  return texto.slice(0, LIMITE - 1) + "…";
}

/**
 * Resume um valor de histórico para exibição: nunca devolve texto longo ou
 * imagem em base64, que estourariam a largura da tela.
 */
export function resumoHistorico(valor: unknown): string {
  if (valor === null || valor === undefined) return "vazio";
  if (typeof valor === "string") return resumir(valor);
  if (typeof valor === "number" || typeof valor === "boolean") return String(valor);
  try {
    return resumir(JSON.stringify(valor));
  } catch {
    return "valor";
  }
}
