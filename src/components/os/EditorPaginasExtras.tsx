import { useRef, useState } from "react";
import { ClipboardPaste, FilePlus2, ImagePlus, Map as MapaIcon, RotateCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { EditorTexto } from "@/components/EditorTexto";
import { girarImagem, prepararImagem } from "@/lib/relatorio-imagens";
import { MAX_PAGINAS_EXTRAS, type PaginaExtra } from "@/lib/paginas-extras";

type Props = {
  paginas: PaginaExtra[];
  onChange: (v: PaginaExtra[]) => void;
  /** Gera a imagem do mapa do sistema (recorte salvo ou captura automática). */
  obterMapa: () => Promise<string | null>;
};

export function EditorPaginasExtras({ paginas, onChange, obterMapa }: Props) {
  const atualizar = (id: string, v: Partial<PaginaExtra>) => onChange(paginas.map((p) => (p.id === id ? { ...p, ...v } : p)));
  return (
    <div className="space-y-4">
      {paginas.map((p, i) => (
        <PaginaEditor key={p.id} pagina={p} indice={i} atualizar={(v) => atualizar(p.id, v)} remover={() => onChange(paginas.filter((x) => x.id !== p.id))} obterMapa={obterMapa} />
      ))}
      <Button type="button" variant="outline" disabled={paginas.length >= MAX_PAGINAS_EXTRAS}
        onClick={() => onChange([...paginas, { id: crypto.randomUUID(), observacao: "", imagem: null }])}>
        <FilePlus2 className="mr-2 h-4 w-4" aria-hidden="true" />Adicionar página
      </Button>
      <p className="text-xs text-muted-foreground">
        Cada página repete o cabeçalho (logo, número, data de emissão e IPM). A observação só aparece se for preenchida. Até {MAX_PAGINAS_EXTRAS} páginas.
      </p>
    </div>
  );
}

function PaginaEditor({ pagina, indice, atualizar, remover, obterMapa }: { pagina: PaginaExtra; indice: number; atualizar: (v: Partial<PaginaExtra>) => void; remover: () => void; obterMapa: () => Promise<string | null> }) {
  const input = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState(false);
  const usarArquivo = async (arquivo: File) => {
    setOcupado(true);
    try { atualizar({ imagem: await prepararImagem(arquivo) }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível usar a imagem."); }
    finally { setOcupado(false); }
  };
  const colar = async () => {
    try {
      const itens = await navigator.clipboard.read();
      for (const item of itens) {
        const tipo = item.types.find((t) => t.startsWith("image/"));
        if (tipo) { const blob = await item.getType(tipo); await usarArquivo(new File([blob], "colada.png", { type: tipo === "image/png" || tipo === "image/jpeg" || tipo === "image/webp" ? tipo : "image/png" })); return; }
      }
      toast.error("Nenhuma imagem copiada. Copie uma imagem e tente de novo.");
    } catch {
      toast.error("O navegador bloqueou a área de transferência. Clique no quadro e use Ctrl+V.");
    }
  };
  const usarMapa = async () => {
    setOcupado(true);
    try {
      const src = await obterMapa();
      if (!src) { toast.error("Não há mapa ou percurso para capturar."); return; }
      atualizar({ imagem: { id: crypto.randomUUID(), src, largura: 100, angulo: 0, legenda: "" } });
    } finally { setOcupado(false); }
  };
  return (
    <section className="space-y-3 rounded-md border p-4"
      onPaste={(e) => { const f = Array.from(e.clipboardData.files).find((x) => x.type.startsWith("image/")); if (f) { e.preventDefault(); void usarArquivo(f); } }}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">Página adicional {indice + 2}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={remover} aria-label={`Remover página ${indice + 2}`}>
          <Trash2 className="mr-1 h-4 w-4 text-destructive" aria-hidden="true" />Remover página
        </Button>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`pagina-obs-${pagina.id}`}>Observação (opcional)</Label>
        <EditorTexto id={`pagina-obs-${pagina.id}`} rotulo={`Observação da página ${indice + 2}`} value={pagina.observacao} onChange={(v) => atualizar({ observacao: v })} />
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label="Imagem da página"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void usarArquivo(f); }} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={ocupado} onClick={() => { if (input.current) { input.current.value = ""; input.current.click(); } }}><ImagePlus className="mr-2 h-4 w-4" aria-hidden="true" />Escolher imagem</Button>
        <Button type="button" variant="outline" disabled={ocupado} onClick={colar}><ClipboardPaste className="mr-2 h-4 w-4" aria-hidden="true" />Colar imagem</Button>
        <Button type="button" variant="outline" disabled={ocupado} onClick={usarMapa}><MapaIcon className="mr-2 h-4 w-4" aria-hidden="true" />Usar mapa do sistema</Button>
      </div>
      {!pagina.imagem && <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">{ocupado ? "Processando…" : "Clique aqui e use Ctrl+V para colar uma imagem (por exemplo, de outro mapa)."}</p>}
      {pagina.imagem && (
        <div className="space-y-3">
          <figure className="mx-auto" style={{ width: `${pagina.imagem.largura}%` }}>
            <img src={pagina.imagem.src} alt={`Imagem da página ${indice + 2}`} className="h-auto max-h-[480px] w-full object-contain" />
          </figure>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm">Tamanho na página</span>
            <Slider className="w-48" min={20} max={100} step={5} value={[pagina.imagem.largura]} aria-label="Tamanho da imagem na página"
              onValueChange={([v]) => pagina.imagem && atualizar({ imagem: { ...pagina.imagem, largura: v ?? 100 } })} />
            <span className="w-10 text-sm text-muted-foreground">{pagina.imagem.largura}%</span>
            <Button type="button" variant="outline" size="icon" disabled={ocupado} title="Girar 90°" aria-label="Girar imagem"
              onClick={async () => { if (!pagina.imagem) return; setOcupado(true); try { atualizar({ imagem: await girarImagem(pagina.imagem) }); } finally { setOcupado(false); } }}><RotateCw className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => atualizar({ imagem: null })}><Trash2 className="mr-1 h-4 w-4 text-destructive" />Retirar imagem</Button>
          </div>
        </div>
      )}
    </section>
  );
}
