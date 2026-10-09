import type { AcaoEducativa } from '@/lib/educacao-api';
import { CATEGORIA_ACAO_LABEL, STATUS_ACAO_LABEL, criarDataLocal } from '@/lib/educacao';
import { larguraImagem } from '@/lib/educacao-imagens';

function Campo({ nome, valor }: { nome: string; valor?: string | number | null | undefined }) {
  return valor !== null && valor !== undefined && valor !== '' ? <p className="whitespace-pre-wrap"><strong>{nome}: </strong>{valor}</p> : null;
}

export function DocumentoAcao({ acao }: { acao: AcaoEducativa }) {
  return <article className="final-paper agenda-paper" aria-label="Documento final da ação educativa">
    <div className="agenda-row"><Campo nome="DATA DO EVENTO" valor={criarDataLocal(acao.data_acao).toLocaleDateString('pt-BR')} /><Campo nome="TIPO" valor={acao.tipo_atividade || CATEGORIA_ACAO_LABEL[acao.categoria]} /></div>
    <h1>AGENDA ELETRÔNICA - EDUCAÇÃO NO TRÂNSITO</h1>
    <section><Campo nome="TEMA" valor={acao.temas_educativos?.nome} /><Campo nome="EVENTO" valor={acao.titulo} /><Campo nome="LOCAL" valor={acao.local || acao.escolas?.nome} />
      <div className="agenda-address"><Campo nome="ENDEREÇO" valor={acao.endereco} /><Campo nome="Nº" valor={acao.numero_endereco} /><Campo nome="BAIRRO" valor={acao.bairro} /></div>
    </section>
    <div className="agenda-row"><Campo nome="INÍCIO" valor={acao.horario_inicio?.slice(0,5)} /><Campo nome="TÉRMINO" valor={acao.horario_fim?.slice(0,5)} /></div>
    {acao.descricao && <section><strong>ATIVIDADE:</strong><p className="whitespace-pre-wrap">{acao.descricao}</p></section>}
    {(acao.equipe || acao.orientadores?.nome) && <section><strong>EQUIPE:</strong><p className="whitespace-pre-wrap">{[acao.equipe, acao.orientadores?.nome].filter(Boolean).join(' · ')}</p></section>}
    {(acao.relatorio_texto || acao.relatorio_imagens.length > 0) && <section><strong>RELATÓRIO:</strong><div className="agenda-report">
      {acao.relatorio_texto && <p className="whitespace-pre-wrap">{acao.relatorio_texto}</p>}
      {acao.relatorio_imagens.map((imagem, i) => <figure key={imagem.id} className={`${larguraImagem[imagem.largura] ?? 'w-full'} mx-auto my-4 break-inside-avoid`}><img src={imagem.src} alt={imagem.legenda || `Imagem ${i + 1} do relatório`} className="h-auto w-full" />{imagem.legenda && <figcaption className="mt-1 text-center text-xs">{imagem.legenda}</figcaption>}</figure>)}
    </div></section>}
    <section><Campo nome="SITUAÇÃO" valor={STATUS_ACAO_LABEL[acao.status]} /><Campo nome="PÚBLICO-ALVO" valor={acao.publico_alvo} /><Campo nome="PARTICIPANTES" valor={acao.participantes} /><Campo nome="OBSERVAÇÕES" valor={acao.observacoes} /></section>
  </article>;
}