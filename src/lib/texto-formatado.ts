export type TrechoTexto = { texto: string; negrito?: boolean; italico?: boolean; sublinhado?: boolean };
const PREFIXO = 'sestran:rich:';

export function lerTextoFormatado(valor: string): TrechoTexto[] {
  if (valor.startsWith(PREFIXO)) {
    try {
      const dados: unknown = JSON.parse(valor.slice(PREFIXO.length));
      if (Array.isArray(dados) && dados.every(t => t && typeof t.texto === 'string')) {
        return dados.map(t => ({ texto: t.texto, negrito: t.negrito === true, italico: t.italico === true, sublinhado: t.sublinhado === true }));
      }
    } catch { /* Registros antigos continuam sendo texto simples. */ }
  }
  return [{ texto: valor }];
}
export const textoSimples = (valor: string) => lerTextoFormatado(valor).map(t => t.texto).join('');
export function salvarTextoFormatado(trechos: TrechoTexto[]) {
  return trechos.some(t => t.negrito || t.italico || t.sublinhado) ? PREFIXO + JSON.stringify(trechos) : trechos.map(t => t.texto).join('');
}
export function juntarTextosFormatados(valores: string[], separador: string) {
  return salvarTextoFormatado(valores.flatMap((v, i) => [...(i ? [{ texto: separador }] : []), ...lerTextoFormatado(v)]));
}
export function htmlTextoFormatado(valor: string) {
  return lerTextoFormatado(valor).map(t => {
    let s = t.texto.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll('\n', '<br>');
    if (t.negrito) s = `<strong>${s}</strong>`;
    if (t.italico) s = `<em>${s}</em>`;
    if (t.sublinhado) s = `<u>${s}</u>`;
    return s;
  }).join('');
}