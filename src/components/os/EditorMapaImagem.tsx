import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowUpRight, Check, Circle, Copy, Crop, Download, Eraser, Highlighter, Minus, Pencil, Redo2, RotateCcw, Square, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Ferramenta = "caneta" | "marca" | "borracha" | "retangulo" | "circulo" | "linha" | "seta" | "recorte";
const ferramentas = [
  { id: "caneta", nome: "Caneta", icone: Pencil }, { id: "marca", nome: "Marca-texto", icone: Highlighter },
  { id: "borracha", nome: "Borracha", icone: Eraser }, { id: "retangulo", nome: "Retângulo", icone: Square },
  { id: "circulo", nome: "Círculo", icone: Circle }, { id: "linha", nome: "Linha", icone: Minus },
  { id: "seta", nome: "Seta", icone: ArrowUpRight }, { id: "recorte", nome: "Recortar imagem", icone: Crop },
] as const;

/** Annotations stay on a separate canvas, so erasing never removes the map. */
export function EditorMapaImagem({ imagem, onConfirmar, onCancelar }: { imagem: string; onConfirmar: (imagem: string) => void; onCancelar: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const desenhoRef = useRef<HTMLCanvasElement | null>(null);
  const inicioRef = useRef<{ x: number; y: number } | null>(null);
  const anteriorRef = useRef<{ x: number; y: number } | null>(null);
  const historico = useRef<{ base: string; desenho: string }[]>([]);
  const [indice, setIndice] = useState(0);
  const indiceRef = useRef(0);
  const [pronto, setPronto] = useState(false);
  const [ferramenta, setFerramenta] = useState<Ferramenta>("seta");
  const [cor, setCor] = useState("var(--map-danger)");
  const [espessura, setEspessura] = useState(5);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [logoTamanho, setLogoTamanho] = useState(160);
  const [mostrarLogo, setMostrarLogo] = useState(false);

  function renderizar() {
    const tela = canvasRef.current; const base = baseRef.current; const desenho = desenhoRef.current;
    const ctx = tela?.getContext("2d");
    if (!tela || !base || !desenho || !ctx) return;
    tela.width = base.width; tela.height = base.height;
    ctx.drawImage(base, 0, 0); ctx.drawImage(desenho, 0, 0);
    if (logo && mostrarLogo) {
      const largura = Math.min(logoTamanho, base.width / 3); const altura = largura * logo.height / logo.width;
      ctx.fillStyle = getComputedStyle(tela).getPropertyValue("--map-paper");
      ctx.fillRect(base.width - largura - 24, 12, largura + 12, altura + 12);
      ctx.drawImage(logo, base.width - largura - 18, 18, largura, altura);
    }
  }
  function guardar() {
    const base = baseRef.current; const desenho = desenhoRef.current; if (!base || !desenho) return;
    historico.current = [...historico.current.slice(0, indiceRef.current + 1), { base: base.toDataURL(), desenho: desenho.toDataURL() }].slice(-30);
    indiceRef.current = historico.current.length - 1; setIndice(indiceRef.current);
  }
  useEffect(() => {
    const img = new Image(); let cancelado = false;
    img.onload = () => {
      if (cancelado) return;
      const base = document.createElement("canvas"); base.width = img.width; base.height = img.height;
      base.getContext("2d")?.drawImage(img, 0, 0); baseRef.current = base;
      const desenho = document.createElement("canvas"); desenho.width = img.width; desenho.height = img.height; desenhoRef.current = desenho;
      historico.current = []; indiceRef.current = -1; guardar(); renderizar(); setPronto(true);
    }; img.src = imagem;
    return () => { cancelado = true; };
  }, [imagem]);
  useEffect(() => { renderizar(); }, [logo, logoTamanho, mostrarLogo]);
  function pos(e: PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - r.left) * e.currentTarget.width / r.width, y: (e.clientY - r.top) * e.currentTarget.height / r.height };
  }
  function configurar(ctx: CanvasRenderingContext2D) {
    const tela = canvasRef.current; if (!tela) return;
    const nome = cor.match(/var\((.+)\)/)?.[1];
    ctx.strokeStyle = nome ? getComputedStyle(tela).getPropertyValue(nome).trim() : cor;
    ctx.lineWidth = espessura; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.globalAlpha = ferramenta === "marca" ? 0.28 : 1;
    ctx.globalCompositeOperation = ferramenta === "borracha" ? "destination-out" : "source-over";
  }
  function mover(e: PointerEvent<HTMLCanvasElement>) {
    const inicio = inicioRef.current; const anterior = anteriorRef.current; const ctx = desenhoRef.current?.getContext("2d");
    if (!inicio || !anterior || !ctx) return;
    const p = pos(e);
    if (["caneta", "marca", "borracha"].includes(ferramenta)) {
      ctx.save(); configurar(ctx); ctx.beginPath(); ctx.moveTo(anterior.x, anterior.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.restore(); anteriorRef.current = p; renderizar();
    } else {
      renderizar(); const preview = canvasRef.current?.getContext("2d"); if (preview) desenharForma(preview, inicio, p);
    }
  }
  function desenharForma(ctx: CanvasRenderingContext2D, a: { x: number; y: number }, b: { x: number; y: number }) {
    ctx.save(); configurar(ctx); ctx.beginPath();
    if (ferramenta === "retangulo" || ferramenta === "recorte") ctx.rect(a.x, a.y, b.x - a.x, b.y - a.y);
    if (ferramenta === "circulo") ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2);
    if (ferramenta === "linha" || ferramenta === "seta") { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
    if (ferramenta === "seta") {
      const angle = Math.atan2(b.y - a.y, b.x - a.x); const tamanho = 16 + espessura;
      for (const delta of [-0.45, 0.45]) { ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - tamanho * Math.cos(angle + delta), b.y - tamanho * Math.sin(angle + delta)); }
    }
    ctx.stroke(); ctx.restore();
  }
  function terminar(e: PointerEvent<HTMLCanvasElement>) {
    const a = inicioRef.current; const ctx = desenhoRef.current?.getContext("2d"); if (!a || !ctx) return;
    const b = pos(e);
    if (ferramenta === "recorte") {
      const base = baseRef.current;
      if (base) {
        const x = Math.max(0, Math.min(a.x, b.x)); const y = Math.max(0, Math.min(a.y, b.y));
        const w = Math.min(base.width - x, Math.abs(a.x - b.x)); const h = Math.min(base.height - y, Math.abs(a.y - b.y));
        if (w > 20 && h > 20) {
          const recortar = (origem: HTMLCanvasElement) => { const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d")?.drawImage(origem, x, y, w, h, 0, 0, w, h); return c; };
          baseRef.current = recortar(base); if (desenhoRef.current) desenhoRef.current = recortar(desenhoRef.current);
        }
      }
    } else if (!["caneta", "marca", "borracha"].includes(ferramenta)) desenharForma(ctx, a, b);
    inicioRef.current = null; anteriorRef.current = null; guardar(); renderizar();
    e.currentTarget.releasePointerCapture(e.pointerId);
  }
  async function restaurar(proximo: number) {
    const estado = historico.current[proximo]; if (!estado) return;
    const carregar = (url: string) => new Promise<HTMLCanvasElement>((resolve) => { const img = new Image(); img.onload = () => { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; c.getContext("2d")?.drawImage(img, 0, 0); resolve(c); }; img.src = url; });
    [baseRef.current, desenhoRef.current] = await Promise.all([carregar(estado.base), carregar(estado.desenho)]);
    indiceRef.current = proximo; setIndice(proximo); renderizar();
  }
  function exportar(tipo: "png" | "jpeg" | "webp") {
    const tela = canvasRef.current; if (!tela) return; renderizar();
    const a = document.createElement("a"); a.href = tela.toDataURL(`image/${tipo}`, 0.92); a.download = `mapa-paranavai.${tipo === "jpeg" ? "jpg" : tipo}`; a.click();
  }
  return <section className="space-y-3 border-t pt-4" aria-label="Editor da imagem do mapa">
    <h3 className="text-sm font-semibold">Edição da imagem recortada</h3>
    <div className="flex flex-wrap items-center gap-1">
      {ferramentas.map(({ id, nome, icone: Icon }) => <Button key={id} type="button" size="icon" variant={ferramenta === id ? "default" : "outline"} title={nome} aria-label={nome} onClick={() => setFerramenta(id)}><Icon className="h-4 w-4" /></Button>)}
      <Button type="button" size="icon" variant="outline" title="Desfazer edição" aria-label="Desfazer edição" disabled={!indice} onClick={() => void restaurar(indice - 1)}><Undo2 className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant="outline" title="Refazer edição" aria-label="Refazer edição" disabled={indice >= historico.current.length - 1} onClick={() => void restaurar(indice + 1)}><Redo2 className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant="outline" title="Limpar anotações" aria-label="Limpar anotações" onClick={() => { const c = desenhoRef.current; if (c) { c.getContext("2d")?.clearRect(0, 0, c.width, c.height); guardar(); renderizar(); } }}><RotateCcw className="h-4 w-4" /></Button>
      <div className="flex gap-1 ml-2" aria-label="Cor da anotação">{["danger", "route", "success", "ink"].map((nome) => <Button key={nome} type="button" size="icon" variant={cor === `var(--map-${nome})` ? "default" : "outline"} aria-label={`Cor ${nome}`} title={`Cor ${nome}`} onClick={() => setCor(`var(--map-${nome})`)}><span className={`map-swatch map-swatch-${nome}`} /></Button>)}</div>
      <Label htmlFor="tamanho-anotacao">Espessura</Label><Input className="w-28" id="tamanho-anotacao" type="range" min="1" max="30" value={espessura} onChange={(e) => setEspessura(Number(e.target.value))} /><span className="text-xs">{espessura} px</span>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="outline" size="sm" onClick={() => { const img = new Image(); img.onload = () => { setLogo(img); setMostrarLogo(true); }; img.src = "/assets/logo-header.png"; }}>Logotipo institucional</Button>
      <Label className="cursor-pointer text-sm">Adicionar logo<Input className="max-w-56" type="file" accept="image/*" onChange={(e) => { const arquivo = e.target.files?.[0]; if (!arquivo) return; if (arquivo.size > 5000000) { toast.error("Use uma imagem de até 5 MB."); return; } const leitor = new FileReader(); leitor.onload = () => { const img = new Image(); img.onload = () => { setLogo(img); setMostrarLogo(true); }; img.src = String(leitor.result); }; leitor.readAsDataURL(arquivo); }} /></Label>
      {mostrarLogo && <><Input aria-label="Tamanho do logotipo" className="w-28" type="range" min="40" max="260" value={logoTamanho} onChange={(e) => setLogoTamanho(Number(e.target.value))} /><Button type="button" size="sm" variant="ghost" onClick={() => setMostrarLogo(false)}>Remover logo</Button></>}
    </div>
    <div className="border bg-muted/20 p-2"><canvas ref={canvasRef} aria-label="Imagem do mapa para anotação" className="mx-auto max-w-full touch-none" onPointerDown={(e) => { if (!pronto) return; e.currentTarget.setPointerCapture(e.pointerId); inicioRef.current = pos(e); anteriorRef.current = pos(e); }} onPointerMove={mover} onPointerUp={terminar} onPointerCancel={() => { inicioRef.current = null; renderizar(); }} /></div>
    <div className="flex flex-wrap gap-2">
      <Button type="button" disabled={!pronto} onClick={() => { renderizar(); const c = canvasRef.current; if (c) onConfirmar(c.toDataURL("image/png")); }}><Check className="mr-2 h-4 w-4" />Usar imagem na O.S.</Button>
      <Button type="button" variant="outline" onClick={onCancelar}>Cancelar edição</Button>
      {["png", "jpeg", "webp"].map((tipo) => <Button key={tipo} type="button" variant="outline" size="sm" onClick={() => exportar(tipo as "png" | "jpeg" | "webp")}><Download className="mr-2 h-4 w-4" />{tipo === "jpeg" ? "JPG" : tipo.toUpperCase()}</Button>)}
      <Button type="button" variant="outline" size="sm" onClick={() => { canvasRef.current?.toBlob(async (blob) => { if (!blob) return; try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); toast.success("Imagem copiada."); } catch { toast.error("Cópia indisponível neste navegador. Baixe a imagem."); } }); }}><Copy className="mr-2 h-4 w-4" />Copiar</Button>
    </div>
  </section>;
}