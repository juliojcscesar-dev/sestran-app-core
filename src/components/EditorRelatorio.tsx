import { useRef, useState } from 'react';
import { ImagePlus, RotateCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { EditorTexto } from '@/components/EditorTexto';
import { girarImagem, prepararImagem, larguraImagem, type ImagemRelatorio } from '@/lib/relatorio-imagens';

export function EditorRelatorio({ texto, onTexto, imagens, onImagens, id = 'relatorio', rotulo = 'Relatório' }: { texto: string; onTexto: (v: string) => void; imagens: ImagemRelatorio[]; onImagens: (v: ImagemRelatorio[]) => void; id?: string; rotulo?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState(false);
  const atualizar = (chave: string, valor: Partial<ImagemRelatorio>) => onImagens(imagens.map(i => i.id === chave ? { ...i, ...valor } : i));
  return <section className="space-y-3 md:col-span-2">
    <Label htmlFor={id}>{rotulo}</Label><EditorTexto id={id} rotulo={rotulo} value={texto} onChange={onTexto} />
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" aria-label="Imagens do relatório" onChange={async e => {
      const arquivos = Array.from(e.target.files ?? []);
      if (imagens.length + arquivos.length > 6) { toast.error('Adicione no máximo 6 imagens.'); return; }
      setOcupado(true);
      try { onImagens([...imagens, ...await Promise.all(arquivos.map(prepararImagem))]); } catch (err) { toast.error(err instanceof Error ? err.message : 'Não foi possível adicionar imagens.'); } finally { setOcupado(false); }
    }} />
    <Button type="button" variant="outline" disabled={ocupado || imagens.length >= 6} onClick={() => { if (input.current) { input.current.value = ''; input.current.click(); } }}><ImagePlus className="mr-2 h-4 w-4" />{ocupado ? 'Processando…' : 'Adicionar imagens'}</Button>
    {imagens.map((imagem, indice) => <div key={imagem.id} className="space-y-2 border-b pb-4">
      <figure className={`${larguraImagem[imagem.largura] ?? 'w-full'} mx-auto`}><img src={imagem.src} alt={imagem.legenda || `Imagem ${indice + 1} do relatório`} className="h-auto max-h-96 w-full object-contain" /></figure>
      <div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" size="icon" disabled={ocupado} title="Girar 90°" aria-label={`Girar imagem ${indice + 1}`} onClick={async () => { setOcupado(true); try { atualizar(imagem.id, await girarImagem(imagem)); } catch { toast.error('Não foi possível girar a imagem.'); } finally { setOcupado(false); } }}><RotateCw className="h-4 w-4" /></Button><span className="text-xs text-muted-foreground">{imagem.angulo}°</span>
      <Select value={String(imagem.largura)} onValueChange={v => atualizar(imagem.id, { largura: Number(v) })}><SelectTrigger className="w-32" aria-label={`Tamanho da imagem ${indice + 1}`}><SelectValue /></SelectTrigger><SelectContent>{[25,50,75,100].map(v => <SelectItem key={v} value={String(v)}>{v}%</SelectItem>)}</SelectContent></Select>
      <Input className="min-w-40 flex-1" aria-label={`Legenda da imagem ${indice + 1}`} placeholder="Legenda" value={imagem.legenda} onChange={e => atualizar(imagem.id, { legenda: e.target.value })} />
      <Button type="button" variant="ghost" size="icon" aria-label={`Remover imagem ${indice + 1}`} onClick={() => onImagens(imagens.filter(i => i.id !== imagem.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
    </div>)}
  </section>;
}
