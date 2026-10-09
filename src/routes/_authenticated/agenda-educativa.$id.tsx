import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentoAcao } from '@/components/educacao/DocumentoAcao';
import { obterAcao } from '@/lib/educacao-api';

export const Route = createFileRoute('/_authenticated/agenda-educativa/$id')({
  head: () => ({ meta: [{ title: 'Visualizar agenda educativa | SESTRAN Paranavaí' }, { name: 'description', content: 'Documento final da agenda de Educação no Trânsito com equipe, atividade e relatório.' }, { property: 'og:title', content: 'Agenda educativa | SESTRAN Paranavaí' }, { property: 'og:description', content: 'Visualização do documento da ação educativa.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: AgendaEducativa,
});
function AgendaEducativa() {
  const { id } = Route.useParams();
  const query = useQuery({ queryKey: ['educacao', 'documento', id], queryFn: () => obterAcao(id) });
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><Button variant="outline" asChild><Link to="/educacao-transito"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link></Button><Button disabled={!query.data} onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimir</Button></div>
    {query.isPending ? <p role="status">Carregando documento…</p> : query.isError ? <p role="alert" className="text-destructive">Não foi possível carregar o documento. <Button variant="outline" onClick={() => query.refetch()}>Tentar novamente</Button></p> : <DocumentoAcao acao={query.data.acao} />}
  </div>;
}