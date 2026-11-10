import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardPaste, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { urlAssinada, type FotoVeiculo } from "@/lib/veiculos-api";

function MiniaturaSalva({ foto, onRemover }: { foto: FotoVeiculo; onRemover: () => void }) {
  const q = useQuery({ queryKey: ["veiculos", "foto-documento", foto.caminho], queryFn: () => urlAssinada(foto.caminho), staleTime: 30 * 60 * 1000 });
  return <Miniatura src={q.data ?? undefined} legenda={foto.descricao || "Foto salva"} onRemover={onRemover} />;
}
function Miniatura({ src, legenda, onRemover }: { src?: string | undefined; legenda: string; onRemover: () => void }) {
  return <figure className="relative w-32 overflow-hidden rounded-md border bg-muted">
    {src ? <img src={src} alt={legenda} className="h-24 w-full object-cover" /> : <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">Carregando…</div>}
    <figcaption className="truncate px-1 py-0.5 text-[11px]">{legenda}</figcaption>
    <Button type="button" size="icon" variant="destructive" className="absolute right-1 top-1 h-7 w-7" aria-label="Excluir imagem" onClick={onRemover}><Trash2 className="h-4 w-4" /></Button>
  </figure>;
}

/** Fotos e recortes de mapa do veículo: arquivo, colar (Ctrl+V/botão) e exclusão antes de salvar. */
export function FotosVeiculoCampo({ novas, onNovas, salvas, removidas, onRemovidas }: { novas: File[]; onNovas: (f: File[]) => void; salvas: FotoVeiculo[]; removidas: string[]; onRemovidas: (ids: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = useMemo(() => novas.map((f) => URL.createObjectURL(f)), [novas]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);
  const adicionar = (lista: File[]) => {
    const imgs = lista.filter((f) => f.type.startsWith("image/"));
    if (imgs.some((f) => f.size > 10 * 1024 * 1024)) { toast.error("Cada imagem deve ter até 10 MB."); return; }
    if (imgs.length) onNovas([...novas, ...imgs.map((f, i) => f.name && f.name !== "image.png" ? f : new File([f], `recorte-${Date.now()}-${i}.png`, { type: f.type }))]);
  };
  const colarBotao = async () => {
    try {
      const itens = await navigator.clipboard.read();
      const arquivos: File[] = [];
      for (const item of itens) for (const t of item.types) if (t.startsWith("image/")) { const b = await item.getType(t); arquivos.push(new File([b], `recorte-${Date.now()}.png`, { type: t })); }
      if (!arquivos.length) toast.error("Não há imagem copiada. Recorte o mapa (Win+Shift+S) e tente de novo."); else adicionar(arquivos);
    } catch { toast.error("O navegador bloqueou a colagem. Clique na área e use Ctrl+V."); }
  };
  const visiveis = salvas.filter((f) => !removidas.includes(f.id));
  return <div tabIndex={0} onPaste={(e) => { const fs = Array.from(e.clipboardData.files); if (fs.length) { e.preventDefault(); adicionar(fs); } }} className="rounded-md border border-dashed p-3 outline-none focus:ring-2 focus:ring-ring">
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}><ImagePlus className="mr-2 h-4 w-4" />Adicionar foto</Button>
      <Button type="button" variant="outline" size="sm" onClick={colarBotao}><ClipboardPaste className="mr-2 h-4 w-4" />Colar recorte do mapa</Button>
      <input ref={inputRef} id="v-fotos" type="file" accept="image/*" multiple className="hidden" onChange={(e) => { adicionar(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
    </div>
    <p className="mt-2 text-xs text-muted-foreground">Recorte o mapa ou qualquer imagem e cole aqui com Ctrl+V. Até 10 MB por imagem. As exclusões valem ao salvar.</p>
    {(visiveis.length > 0 || novas.length > 0) && <div className="mt-3 flex flex-wrap gap-3">
      {visiveis.map((f) => <MiniaturaSalva key={f.id} foto={f} onRemover={() => onRemovidas([...removidas, f.id])} />)}
      {novas.map((f, i) => <Miniatura key={`${i}-${f.name}`} src={urls[i]} legenda={f.name.startsWith("recorte-") ? "Recorte colado" : f.name} onRemover={() => onNovas(novas.filter((_, j) => j !== i))} />)}
    </div>}
  </div>;
}
