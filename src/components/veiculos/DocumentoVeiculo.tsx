import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Minus, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { urlAssinada, type VeiculoCompleto } from '@/lib/veiculos-api';
import { STATUS_VEICULO_LABEL, statusEfetivo } from '@/lib/veiculos';
import { CabecalhoFolha, CaixaFolha, LinhaFolha } from '@/components/FolhaDocumento';

function Foto({ id, caminho, legenda, inicial }: { id: string; caminho: string; legenda: string; inicial: number }) {
  const query = useQuery({ queryKey: ['veiculos', 'foto-documento', caminho], queryFn: () => urlAssinada(caminho), staleTime: 30 * 60 * 1000 });
  const [tamanho, setTamanho] = useState(inicial);
  const [salvo, setSalvo] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  const salvar = async () => {
    setSalvando(true);
    const { data, error } = await supabase.from('veiculo_fotos').update({ tamanho }).eq('id', id).select('id');
    setSalvando(false);
    if (error || !data?.length) { toast.error('Não foi possível salvar o tamanho. Verifique sua permissão.'); return; }
    setSalvo(tamanho); toast.success('Tamanho da imagem salvo.');
  };
  const mudar = (d: number) => setTamanho((t) => Math.min(100, Math.max(25, t + d)));
  return <figure className="agenda-foto" style={{ width: `calc(${tamanho}% - 0.5rem)` }}>
    <div className="mb-1 flex items-center justify-center gap-1 print:hidden">
      <Button type="button" size="icon" variant="outline" className="h-7 w-7" aria-label="Diminuir imagem" onClick={() => mudar(-25)} disabled={tamanho <= 25}><Minus className="h-4 w-4" /></Button>
      <span className="w-12 text-center text-xs">{tamanho}%</span>
      <Button type="button" size="icon" variant="outline" className="h-7 w-7" aria-label="Aumentar imagem" onClick={() => mudar(25)} disabled={tamanho >= 100}><Plus className="h-4 w-4" /></Button>
      <Button type="button" size="sm" variant={tamanho !== salvo ? 'default' : 'outline'} className="h-7 gap-1 px-2" onClick={salvar} disabled={salvando || tamanho === salvo}><Save className="h-3.5 w-3.5" />{salvando ? 'Salvando…' : 'Salvar'}</Button>
    </div>
    {query.data ? <img src={query.data} alt={legenda} className="mx-auto max-h-[110mm] w-full object-contain" /> : <p>{query.isPending ? 'Carregando foto…' : 'Foto indisponível.'}</p>}<figcaption>{legenda}</figcaption></figure>;
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
    {registro.fotos.length > 0 && <CaixaFolha titulo="Fotos"><div className="flex flex-wrap items-start justify-center gap-2">{registro.fotos.map((foto, i) => <Foto key={foto.id} id={foto.id} inicial={(foto as { tamanho?: number }).tamanho ?? 100} caminho={foto.caminho} legenda={foto.descricao || `Foto ${i + 1}`} />)}</div></CaixaFolha>}
  </article>;
}
