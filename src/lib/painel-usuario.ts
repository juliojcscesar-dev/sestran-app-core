// Conteúdo e formatação compartilhados entre o Painel e o Painel 2.
export const NOTICIA_SECRETARIA = {
  url: "https://paranavai.atende.net",
  titulo: "Alunos de Paraíso do Norte participam de atividade de educação no trânsito em Paranavaí",
  resumo: "Ação na minicidade do Detran combina orientações teóricas e simulações práticas para ensinar regras de segurança viária.",
};

export function dataPorExtenso(d: Date) {
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .replace(/(^|[\s-])(\p{L})(?=\p{L}{2,})/gu, (_m, a: string, b: string) => a + b.toUpperCase()).replace(/ De /g, " de ");
}
