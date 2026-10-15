import { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MAX_IMAGENS_RECOLHIDOS, prepararImagemRecolhido } from '@/lib/recolhidos-imagens';

export function ImagensObservacoes({ imagens, onChange, onOcupado }: { imagens: string[]; onChange: (v: string[]) => void; onOcupado: (v: boolean) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState(false);
  return <div className="space-y-3">
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" aria-label="Imagens das observações" disabled={ocupado} onChange={async e => {
      const arquivos = Array.from(e.target.files ?? []);
      e.target.value = '';
      if (!arquivos.length) return;
      if (imagens.length + arquivos.length > MAX_IMAGENS_RECOLHIDOS) { toast.error('Adicione no máximo 3 imagens.'); return; }
      setOcupado(true); onOcupado(true);
      try { onChange([...imagens, ...await Promise.all(arquivos.map(prepararImagemRecolhido))]); }
      catch (erro) { toast.error(erro instanceof Error ? erro.message : 'Não foi possível adicionar as imagens.'); }
      finally { setOcupado(false); onOcupado(false); }
    }} />
    <Button type="button" variant="outline" disabled={ocupado || imagens.length >= MAX_IMAGENS_RECOLHIDOS} onClick={() => input.current?.click()}><ImagePlus className="mr-2 h-4 w-4" />{ocupado ? 'Processando…' : 'Adicionar imagem'} <span className="ml-2 text-muted-foreground">{imagens.length}/3</span></Button>
    {imagens.length > 0 && <div className="grid grid-cols-3 items-start gap-2" aria-label="Imagens anexadas às observações">
      {imagens.map((src, i) => <figure key={`${i}-${src.slice(-24)}`} className="min-w-0 space-y-2 text-center"><img src={src} alt={`Imagem ${i + 1} das observações`} className="mx-auto h-auto max-h-[9cm] w-auto max-w-full object-contain sm:max-w-[min(100%,7cm)]" /><Button type="button" variant="outline" size="icon" disabled={ocupado} title={`Excluir imagem ${i + 1}`} aria-label={`Excluir imagem ${i + 1}`} onClick={() => onChange(imagens.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button></figure>)}
    </div>}
  </div>;
}