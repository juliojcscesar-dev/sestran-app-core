import type { ReactNode } from 'react';
import { TextoFormatado } from '@/components/TextoFormatado';

export type CampoLinha = { nome: string; valor?: string | null | undefined };

/** Linha de campos no desenho institucional do PDF: caixas lado a lado, só com o que foi preenchido. */
export function LinhaFolha({ campos }: { campos: CampoLinha[] }) {
  const visiveis = campos.filter((c) => c.valor != null && String(c.valor).trim() !== '');
  if (!visiveis.length) return null;
  return <div className={`agenda-linha ${visiveis.length > 1 ? 'agenda-linha-2' : ''}`}>
    {visiveis.map((c) => <div key={c.nome} className="agenda-campo"><strong>{c.nome}:</strong> <TextoFormatado valor={String(c.valor).trim()} /></div>)}
  </div>;
}

export function CaixaFolha({ titulo, children }: { titulo: string; children: ReactNode }) {
  return <div className="agenda-caixa"><strong>{titulo}</strong><div className="agenda-caixa-corpo">{children}</div></div>;
}

/** Cabeçalho com logo à esquerda e quadro de informações à direita. */
export function CabecalhoFolha({ itens }: { itens: { nome: string; valor: string }[] }) {
  return <header className="agenda-cabecalho">
    <img src="/assets/logo-header.png" alt="Prefeitura Municipal de Paranavaí — Secretaria Municipal de Segurança e Trânsito" />
    <div className="agenda-datas">{itens.map((i) => <div key={i.nome}><strong>{i.nome}:</strong><span>{i.valor}</span></div>)}</div>
  </header>;
}
