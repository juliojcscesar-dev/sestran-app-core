import { TextoFormatado } from "@/components/TextoFormatado";
import type { AcaoEducativa } from '@/lib/educacao-api';
import { CATEGORIA_ACAO_LABEL, STATUS_ACAO_LABEL, criarDataLocal } from '@/lib/educacao';
import { larguraImagem } from '@/lib/relatorio-imagens';
import { CaixaFolha as Caixa, LinhaFolha as Linha } from '@/components/FolhaDocumento';

export function DocumentoAcao({ acao }: { acao: AcaoEducativa }) {
  const temRelatorio = Boolean(acao.relatorio_texto) || acao.relatorio_imagens.length > 0;
  return <article className="final-paper agenda-paper" aria-label="Documento final da ação educativa">
    <header className="agenda-cabecalho">
      <img src="/assets/logo-header.png" alt="Prefeitura Municipal de Paranavaí — Secretaria Municipal de Segurança e Trânsito" />
      <div className="agenda-datas">
        <div><strong>Data:</strong><span>{criarDataLocal(acao.data_acao).toLocaleDateString('pt-BR')}</span></div>
        <div><strong>Situação:</strong><span>{STATUS_ACAO_LABEL[acao.status]}</span></div>
      </div>
    </header>
    <h1 className="agenda-titulo">AGENDA ELETRÔNICA - EDUCAÇÃO NO TRÂNSITO</h1>
    <Linha campos={[{ nome: 'Título da Ação', valor: acao.titulo }]} />
    <Linha campos={[{ nome: 'Tipo', valor: acao.tipo_atividade || acao.categorias_educativas?.nome || CATEGORIA_ACAO_LABEL[acao.categoria] || acao.categoria }, { nome: 'Tema', valor: acao.temas_educativos?.nome }]} />
    <Linha campos={[{ nome: 'Local', valor: acao.local || acao.escolas?.nome }]} />
    <Linha campos={[{ nome: 'Endereço', valor: [acao.endereco, acao.numero_endereco].filter(Boolean).join(', ') || null }, { nome: 'Bairro', valor: acao.bairro }]} />
    <Linha campos={[{ nome: 'Início', valor: acao.horario_inicio?.slice(0, 5) }, { nome: 'Término', valor: acao.horario_fim?.slice(0, 5) }]} />
    <Linha campos={[{ nome: 'Equipe', valor: [acao.equipe, acao.orientadores?.nome].filter(Boolean).join(' · ') || null }]} />
    <Linha campos={[{ nome: 'Público-alvo', valor: acao.publico_alvo }, { nome: 'Participantes', valor: acao.participantes != null ? String(acao.participantes) : null }]} />
    {acao.descricao && <Caixa titulo="Atividade"><p className="whitespace-pre-wrap"><TextoFormatado valor={acao.descricao} /></p></Caixa>}
    {acao.observacoes && <Caixa titulo="Observações"><p className="whitespace-pre-wrap"><TextoFormatado valor={acao.observacoes} /></p></Caixa>}
    {temRelatorio && <>
      {acao.relatorio_texto && <Caixa titulo="Relatório"><p className="whitespace-pre-wrap"><TextoFormatado valor={acao.relatorio_texto} /></p></Caixa>}
      {acao.relatorio_imagens.map((imagem, i) => <figure key={imagem.id} className={`agenda-foto ${larguraImagem[imagem.largura] ?? 'w-full'}`}>
        <img src={imagem.src} alt={imagem.legenda || `Imagem ${i + 1} do relatório`} />
        {imagem.legenda && <figcaption>{imagem.legenda}</figcaption>}
      </figure>)}
    </>}
  </article>;
}
