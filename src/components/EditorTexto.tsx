import { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { htmlTextoFormatado, salvarTextoFormatado, type TrechoTexto } from '@/lib/texto-formatado';

export function EditorTexto({ id, value, onChange, rotulo, compacto = false }: { id?: string; value: string; onChange: (valor: string) => void; rotulo: string; compacto?: boolean }) {
  const editor = useRef<HTMLDivElement>(null);
  const ultimo = useRef<string | null>(null);
  const [ativos, setAtivos] = useState<string[]>([]);
  useEffect(() => {
    if (editor.current && ultimo.current !== value) { editor.current.innerHTML = htmlTextoFormatado(value); ultimo.current = value; }
  }, [value]);
  function atualizar() {
    const raiz = editor.current;
    if (!raiz) return;
    const trechos: TrechoTexto[] = [];
    function visitar(no: Node, estilo: Omit<TrechoTexto, 'texto'>) {
      if (no.nodeType === Node.TEXT_NODE) { trechos.push({ texto: no.textContent ?? '', ...estilo }); return; }
      if (!(no instanceof HTMLElement)) return;
      if (no.tagName === 'BR') { trechos.push({ texto: '\n', ...estilo }); return; }
      if (['DIV', 'P'].includes(no.tagName) && trechos.length && !trechos.at(-1)?.texto.endsWith('\n')) trechos.push({ texto: '\n' });
      const proximo = { negrito: estilo.negrito || ['B', 'STRONG'].includes(no.tagName) || no.style.fontWeight === 'bold', italico: estilo.italico || ['I', 'EM'].includes(no.tagName) || no.style.fontStyle === 'italic', sublinhado: estilo.sublinhado || no.tagName === 'U' || no.style.textDecoration.includes('underline') };
      no.childNodes.forEach(filho => visitar(filho, proximo));
    }
    raiz.childNodes.forEach(no => visitar(no, {}));
    const valor = salvarTextoFormatado(trechos);
    ultimo.current = valor; onChange(valor);
    setAtivos(['bold', 'italic', 'underline'].filter(c => document.queryCommandState(c)));
  }
  return <div className="min-w-0 rounded-md border border-input bg-background">
    <div role="toolbar" aria-label={`Formatação de ${rotulo}`} className="flex gap-1 border-b p-1">
      {([{ comando: 'bold', nome: 'Negrito', Icone: Bold }, { comando: 'underline', nome: 'Sublinhado', Icone: Underline }, { comando: 'italic', nome: 'Itálico', Icone: Italic }]).map(({ comando, nome, Icone }) => <Button key={comando} type="button" size="icon" variant={ativos.includes(comando) ? 'secondary' : 'ghost'} className="h-7 w-7" title={nome} aria-label={`${nome} — ${rotulo}`} aria-pressed={ativos.includes(comando)} onMouseDown={e => e.preventDefault()} onClick={() => { editor.current?.focus(); document.execCommand(comando); atualizar(); }}><Icone className="h-4 w-4" /></Button>)}
    </div>
    <div ref={editor} id={id} role="textbox" aria-label={rotulo} aria-multiline="true" contentEditable suppressContentEditableWarning className={`w-full whitespace-pre-wrap break-words px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring ${compacto ? 'min-h-10' : 'min-h-24'}`} onInput={atualizar} onKeyUp={() => setAtivos(['bold', 'italic', 'underline'].filter(c => document.queryCommandState(c)))} onMouseUp={() => setAtivos(['bold', 'italic', 'underline'].filter(c => document.queryCommandState(c)))} onPaste={e => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); atualizar(); }} />
  </div>;
}