import { useQuery } from '@tanstack/react-query';
import { urlAssinada, type VeiculoCompleto } from '@/lib/veiculos-api';
import { STATUS_VEICULO_LABEL, statusEfetivo } from '@/lib/veiculos';

function Campo({ nome, valor }: { nome: string; valor?: string | number | null | undefined }) {
  return valor !== null && valor !== undefined && valor !== '' ? <p className="whitespace-pre-wrap"><strong>{nome}: </strong>{valor}</p> : null;
}
function Foto({ caminho, legenda }: { caminho: string; legenda: string }) {
  const query = useQuery({ queryKey: ['veiculos', 'foto-documento', caminho], queryFn: () => urlAssinada(caminho), staleTime: 30 * 60 * 1000 });
  return <figure className="my-4 break-inside-avoid">{query.data ? <img src={query.data} alt={legenda} className="max-h-96 w-full object-contain" /> : <p>{query.isPending ? 'Carregando foto…' : 'Foto indisponível.'}</p>}<figcaption className="mt-2 text-center text-xs">{legenda}</figcaption></figure>;
}
const data = (v: string | null) => v ? new Date(`${v}T12:00:00`).toLocaleDateString('pt-BR') : null;
export function DocumentoVeiculo({ registro }: { registro: VeiculoCompleto }) {
  const v = registro.veiculo;
  return <article className="final-paper vehicle-paper" aria-label="Documento final do veículo">
    <img src="/assets/logo-header.png" alt="Prefeitura Municipal de Paranavaí — SESTRAN" className="mx-auto mb-6 h-auto w-full max-w-sm" />
    <h1>REGISTRO DE VEÍCULO ABANDONADO</h1>
    <section className="grid gap-3 sm:grid-cols-2"><Campo nome="PLACA" valor={v.placa} /><Campo nome="CHASSI" valor={v.chassi} /><Campo nome="MARCA" valor={v.marca} /><Campo nome="MODELO" valor={v.modelo} /><Campo nome="SITUAÇÃO" valor={STATUS_VEICULO_LABEL[statusEfetivo(v)]} /><Campo nome="REGISTRO" valor={new Date(v.created_at).toLocaleDateString('pt-BR')} /></section>
    <section><Campo nome="ENDEREÇO" valor={v.endereco} /><Campo nome="BAIRRO" valor={v.bairro} /><Campo nome="ORIGEM DA DENÚNCIA" valor={v.tipo_denuncia.replaceAll('_', ' ')} /><Campo nome="NÚMERO DA DENÚNCIA" valor={v.numero_denuncia} /></section>
    <section><Campo nome="VERIFICAÇÃO" valor={data(v.data_verificacao)} /><Campo nome="NOTIFICAÇÃO" valor={data(v.data_notificacao)} /><Campo nome="PRAZO PARA RECOLHIMENTO" valor={data(v.prazo_recolhimento)} /><Campo nome="RECOLHIMENTO" valor={data(v.data_recolhimento)} /><Campo nome="OBSERVAÇÕES" valor={v.observacoes} /></section>
    {registro.fotos.length > 0 && <section><h2>FOTOS</h2>{registro.fotos.map((foto, i) => <Foto key={foto.id} caminho={foto.caminho} legenda={foto.descricao || `Foto ${i + 1}`} />)}</section>}
  </article>;
}