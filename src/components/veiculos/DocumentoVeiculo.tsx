import { useQuery } from '@tanstack/react-query';
import { urlAssinada, type VeiculoCompleto } from '@/lib/veiculos-api';
import { STATUS_VEICULO_LABEL, statusEfetivo } from '@/lib/veiculos';
import { CabecalhoFolha, CaixaFolha, LinhaFolha } from '@/components/FolhaDocumento';

function Foto({ caminho, legenda }: { caminho: string; legenda: string }) {
  const query = useQuery({ queryKey: ['veiculos', 'foto-documento', caminho], queryFn: () => urlAssinada(caminho), staleTime: 30 * 60 * 1000 });
  return <figure className="agenda-foto w-full">{query.data ? <img src={query.data} alt={legenda} className="max-h-[110mm] object-contain" /> : <p>{query.isPending ? 'Carregando foto…' : 'Foto indisponível.'}</p>}<figcaption>{legenda}</figcaption></figure>;
}
const data = (v: string | null) => v ? new Date(`${v}T12:00:00`).toLocaleDateString('pt-BR') : null;

export function DocumentoVeiculo({ registro }: { registro: VeiculoCompleto }) {
  const v = registro.veiculo;
  const situacao = STATUS_VEICULO_LABEL[statusEfetivo(v)] ?? String(statusEfetivo(v));
  return <article className="final-paper agenda-paper vehicle-paper" aria-label="Documento final do veículo">
    <CabecalhoFolha itens={[{ nome: 'Registro', valor: new Date(v.created_at).toLocaleDateString('pt-BR') }, { nome: 'Situação', valor: situacao }]} />
    <h1 className="agenda-titulo">REGISTRO DE VEÍCULO ABANDONADO</h1>
    <LinhaFolha campos={[{ nome: 'Placa', valor: v.placa }, { nome: 'Chassi', valor: v.chassi }]} />
    <LinhaFolha campos={[{ nome: 'Marca', valor: v.marca }, { nome: 'Modelo', valor: v.modelo }]} />
    <LinhaFolha campos={[{ nome: 'Endereço', valor: v.endereco }, { nome: 'Bairro', valor: v.bairro }]} />
    <LinhaFolha campos={[{ nome: 'Origem da denúncia', valor: v.tipo_denuncia?.replaceAll('_', ' ') }, { nome: 'Número da denúncia', valor: v.numero_denuncia }]} />
    <LinhaFolha campos={[{ nome: 'Verificação', valor: data(v.data_verificacao) }, { nome: 'Notificação', valor: data(v.data_notificacao) }]} />
    <LinhaFolha campos={[{ nome: 'Prazo para recolhimento', valor: data(v.prazo_recolhimento) }, { nome: 'Recolhimento', valor: data(v.data_recolhimento) }]} />
    {v.observacoes && <CaixaFolha titulo="Observações"><p className="whitespace-pre-wrap">{v.observacoes}</p></CaixaFolha>}
    {registro.fotos.length > 0 && <CaixaFolha titulo="Fotos">{registro.fotos.map((foto, i) => <Foto key={foto.id} caminho={foto.caminho} legenda={foto.descricao || `Foto ${i + 1}`} />)}</CaixaFolha>}
  </article>;
}
