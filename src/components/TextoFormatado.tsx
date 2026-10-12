import { lerTextoFormatado } from '@/lib/texto-formatado';

export function TextoFormatado({ valor }: { valor: string }) {
  return <>{lerTextoFormatado(valor).map((t, i) => {
    let conteudo = <>{t.texto}</>;
    if (t.negrito) conteudo = <strong>{conteudo}</strong>;
    if (t.italico) conteudo = <em>{conteudo}</em>;
    if (t.sublinhado) conteudo = <u>{conteudo}</u>;
    return <span key={i}>{conteudo}</span>;
  })}</>;
}