// Máscaras de exibição/digitação para telefone e documentos brasileiros.
const digitos = (v: string) => v.replace(/\D/g, "");

/** Formata telefone enquanto digita: (44) 3452-7766 ou (44) 99999-9999. */
export function mascararTelefone(valor: string): string {
  const d = digitos(valor).slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  if (d.length <= 10) return `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`;
  return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}`;
}

/** Formata CPF enquanto digita: 000.000.000-00. */
export function mascararCpf(valor: string): string {
  const d = digitos(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

/** Formata CNPJ enquanto digita: 00.000.000/0000-00. */
export function mascararCnpj(valor: string): string {
  const d = digitos(valor).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/** Aplica a máscara conforme o tipo de documento; outros tipos ficam como digitados. */
export function mascararDocumento(tipo: string | null | undefined, valor: string): string {
  const t = (tipo ?? "").toUpperCase();
  if (t === "CPF") return mascararCpf(valor);
  if (t === "CNPJ") return mascararCnpj(valor);
  return valor;
}

const soNumeroEPontuacao = (v: string) => /^[\d\s().\-/+]*$/.test(v);

/** Exibe telefone salvo já formatado; valores fora do padrão permanecem como estão. */
export function exibirTelefone(valor: string | null | undefined): string {
  const v = (valor ?? "").trim();
  const n = digitos(v).length;
  return v && soNumeroEPontuacao(v) && (n === 10 || n === 11) ? mascararTelefone(v) : v;
}

/** Exibe documento salvo já formatado (CPF/CNPJ completos); demais permanecem como estão. */
export function exibirDocumento(tipo: string | null | undefined, valor: string | null | undefined): string {
  const v = (valor ?? "").trim();
  const t = (tipo ?? "").toUpperCase();
  const n = digitos(v).length;
  if (!v || !soNumeroEPontuacao(v)) return v;
  if (t === "CPF" && n === 11) return mascararCpf(v);
  if (t === "CNPJ" && n === 14) return mascararCnpj(v);
  return v;
}
