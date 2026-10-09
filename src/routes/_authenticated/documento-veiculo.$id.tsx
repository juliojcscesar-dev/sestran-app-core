import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentoVeiculo } from '@/components/veiculos/DocumentoVeiculo';
import { obterVeiculo } from '@/lib/veiculos-api';
export const Route = createFileRoute('/_authenticated/documento-veiculo/$id')({
  head: () => ({ meta: [{ title: 'Visualizar veículo | SESTRAN Paranavaí' }, { name: 'description', content: 'Documento final do registro de veículo abandonado, com situação, endereço e fotos.' }, { property: 'og:title', content: 'Documento do veículo | SESTRAN Paranavaí' }, { property: 'og:description', content: 'Visualização final do registro de veículo abandonado.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Documento,
});
function Documento() {
  const { id } = Route.useParams();
  const query = useQuery({ queryKey: ['veiculos', 'detalhe', id], queryFn: () => obterVeiculo(id) });
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><Button variant="outline" asChild><Link to="/veiculos-abandonados"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link></Button><Button disabled={!query.data} onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimir</Button></div>{query.isPending ? <p role="status">Carregando documento…</p> : query.isError ? <p role="alert" className="text-destructive">Não foi possível carregar o documento. <Button variant="outline" onClick={() => query.refetch()}>Tentar novamente</Button></p> : <DocumentoVeiculo registro={query.data} />}</div>;
}