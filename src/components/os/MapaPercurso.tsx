import { EditorTexto } from "@/components/EditorTexto";
import { TextoFormatado } from "@/components/TextoFormatado";
import { textoSimples } from "@/lib/texto-formatado";
import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Ban, Check, Crop, Eye, Loader2, MapPin, Plus, Minus, Layers, Scan, RotateCcw, Route as RotaIcone, Search, Trash2, Undo2, Redo2, Hand, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import {
  CENTRO_PARANAVAI,
  ZOOM_PADRAO,
  coordenadaTexto,
  rotuloEtapa,
  type InterdicaoMapa,
  type EnquadramentoMapa,
  type PercursoMapa,
  type PontoMapa,
} from "@/lib/mapa";
import { pesquisarEnderecoOficial } from "@/lib/territorio-api";
import { EditorMapaImagem } from "@/components/os/EditorMapaImagem";

type Modo = "navegar" | "percurso" | "ponto" | "interdicao" | "recorte";

export type MapaPercursoProps = {
  percurso: PercursoMapa;
  onPercursoChange?: (percurso: PercursoMapa) => void;
  interdicoes?: InterdicaoMapa[];
  onInterdicoesChange?: (interdicoes: InterdicaoMapa[]) => void;
  permitirInterdicoes?: boolean;
  somenteLeitura?: boolean;
  altura?: number;
  onMapaImagemChange?: (imagem: string) => void;
  solicitarRecorte?: number;
};

function icone(texto: string, cor: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:9999px;background:${cor};color:#fff;font:600 11px/1 'IBM Plex Sans',sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.4);border:2px solid #fff">${texto}</span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export default function MapaPercurso({
  percurso,
  onPercursoChange,
  interdicoes = [],
  onInterdicoesChange,
  permitirInterdicoes = false,
  somenteLeitura = false,
  altura = 420,
  onMapaImagemChange,
  solicitarRecorte = 0,
}: MapaPercursoProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const camadasRef = useRef<{ base: L.TileLayer; percurso: L.LayerGroup; pontos: L.LayerGroup; interdicoes: L.LayerGroup } | null>(null);
  const [camadasVisiveis, setCamadasVisiveis] = useState({ base: true, percurso: true, pontos: true, interdicoes: true });
  const [zoomAtual, setZoomAtual] = useState(percurso.zoom ?? ZOOM_PADRAO);
  const modoRef = useRef<Modo>("navegar");
  const [modo, setModo] = useState<Modo>("navegar");
  const [busca, setBusca] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [sugestoes, setSugestoes] = useState<{ id: string; nome_completo: string; geometria: unknown; bairros: { nome: string } | null }[]>([]);
  const rascunhoRef = useRef<PontoMapa[]>([]);
  const selecaoRef = useRef<L.Rectangle | null>(null);
  const inicioRecorteRef = useRef<L.LatLng | null>(null);
  const [enquadramento, setEnquadramento] = useState<EnquadramentoMapa | null>(null);
  const [gerandoRecorte, setGerandoRecorte] = useState(false);
  const [preVisualizacao, setPreVisualizacao] = useState<string | null>(null);
  const [resultados, setResultados] = useState<{ lat: string; lon: string; display_name: string }[]>([]);
  const historicoRef = useRef<{ percurso: PercursoMapa; interdicoes: InterdicaoMapa[] }[]>([]);
  const indiceHistoricoRef = useRef(-1);
  const restaurandoRef = useRef(false);
  const [indiceHistorico, setIndiceHistorico] = useState(-1);
  const assinatura = JSON.stringify({ pontos: percurso.pontos, marcadores: percurso.marcadores, estilo: percurso.estilo, interdicoes });
  useEffect(() => {
    if (restaurandoRef.current) { restaurandoRef.current = false; return; }
    historicoRef.current = [...historicoRef.current.slice(0, indiceHistoricoRef.current + 1), structuredClone({ percurso, interdicoes })].slice(-50);
    indiceHistoricoRef.current = historicoRef.current.length - 1;
    setIndiceHistorico(indiceHistoricoRef.current);
  }, [assinatura]);
  function restaurarHistorico(indice: number) {
    const estado = historicoRef.current[indice]; if (!estado) return;
    restaurandoRef.current = true; indiceHistoricoRef.current = indice; setIndiceHistorico(indice);
    onPercursoChange?.({ ...structuredClone(estado.percurso), centro: percurso.centro, zoom: percurso.zoom });
    onInterdicoesChange?.(structuredClone(estado.interdicoes));
    modoRef.current = "navegar"; setModo("navegar");
  }
  function mudarEstilo(campo: "corLinha" | "corMarcador" | "espessura", valor: string | number) {
    const tela = containerRef.current;
    const estilos = getComputedStyle(tela ?? document.documentElement);
    const padrao = { corLinha: estilos.getPropertyValue("--map-route").trim(), corMarcador: estilos.getPropertyValue("--map-marker").trim(), espessura: 5 };
    atualizar({ estilo: { ...padrao, ...percurso.estilo, [campo]: valor } });
  }

  const estadoRef = useRef({ percurso, interdicoes });
  estadoRef.current = { percurso, interdicoes };

  const atualizar = useCallback(
    (parcial: Partial<PercursoMapa>) => {
      onPercursoChange?.({ ...estadoRef.current.percurso, ...parcial });
    },
    [onPercursoChange],
  );

  const clicarMapa = useCallback(
    (lat: number, lng: number) => {
      const atual = estadoRef.current.percurso;
      if (modoRef.current === "percurso") {
        atualizar({ pontos: [...atual.pontos, { lat, lng }] });
      } else if (modoRef.current === "ponto") {
        atualizar({ marcadores: [...atual.marcadores, { lat, lng }] });
      } else if (modoRef.current === "interdicao") {
        rascunhoRef.current = [...rascunhoRef.current, { lat, lng }];
        if (rascunhoRef.current.length === 2) {
          const geometria = rascunhoRef.current;
          rascunhoRef.current = [];
          onInterdicoesChange?.([
            ...estadoRef.current.interdicoes,
            { rua: "", trecho_inicial: "", trecho_final: "", observacao: "", geometria },
          ]);
          toast.success("Trecho de interdição marcado. Informe o nome da rua abaixo do mapa.");
        } else {
          toast.info("Agora clique no fim do trecho interditado.");
        }
      }
    },
    [atualizar, onInterdicoesChange],
  );

  // mantém as callbacks acessíveis sem recriar o mapa
  const clicarRef = useRef(clicarMapa);
  const atualizarRef = useRef(atualizar);
  const leituraRef = useRef(somenteLeitura);
  clicarRef.current = clicarMapa;
  atualizarRef.current = atualizar;
  leituraRef.current = somenteLeitura;

  // cria o mapa uma única vez
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    if (!containerRef.current || mapaRef.current) return;
    const inicial = estadoRef.current.percurso;
    const mapa = L.map(containerRef.current, { zoomControl: false, minZoom: 2, maxZoom: 19 }).setView(
      inicial.centro ?? CENTRO_PARANAVAI,
      inicial.zoom ?? ZOOM_PADRAO,
    );
    const base = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(mapa);
    camadasRef.current = { base, percurso: L.layerGroup().addTo(mapa), pontos: L.layerGroup().addTo(mapa), interdicoes: L.layerGroup().addTo(mapa) };
    mapa.on("zoomend", () => setZoomAtual(mapa.getZoom()));
    setZoomAtual(mapa.getZoom());
    mapa.on("click", (e: L.LeafletMouseEvent) => {
      if (modoRef.current !== "recorte") clicarRef.current(e.latlng.lat, e.latlng.lng);
    });
    mapa.on("dblclick", () => { if (modoRef.current === "percurso") { modoRef.current = "navegar"; setModo("navegar"); mapa.doubleClickZoom.enable(); } });
    mapa.on("mousedown", (e: L.LeafletMouseEvent) => {
      if (modoRef.current !== "recorte") return;
      inicioRecorteRef.current = e.latlng;
      mapa.dragging.disable();
      selecaoRef.current?.remove();
      selecaoRef.current = L.rectangle(L.latLngBounds(e.latlng, e.latlng), {
        color: "#d97706",
        weight: 3,
        dashArray: "8 6",
        fillColor: "#f59e0b",
        fillOpacity: 0.18,
      }).addTo(mapa);
    });
    mapa.on("mousemove", (e: L.LeafletMouseEvent) => {
      if (modoRef.current !== "recorte" || !inicioRecorteRef.current) return;
      selecaoRef.current?.setBounds(L.latLngBounds(inicioRecorteRef.current, e.latlng));
    });
    mapa.on("mouseup", (e: L.LeafletMouseEvent) => {
      if (modoRef.current !== "recorte" || !inicioRecorteRef.current) return;
      const limites = L.latLngBounds(inicioRecorteRef.current, e.latlng);
      inicioRecorteRef.current = null;
      mapa.dragging.enable();
      if (!limites.isValid() || limites.getNorth() === limites.getSouth()) return;
      setEnquadramento({
        norte: limites.getNorth(),
        sul: limites.getSouth(),
        leste: limites.getEast(),
        oeste: limites.getWest(),
      });
    });
    mapa.on("moveend", () => {
      if (leituraRef.current) return;
      const c = mapa.getCenter();
      atualizarRef.current({ centro: [c.lat, c.lng], zoom: mapa.getZoom() });
    });
    mapaRef.current = mapa;
    const tempo = setTimeout(() => mapa.invalidateSize(), 200);
    setPronto(true);
    return () => {
      clearTimeout(tempo);
      mapa.remove();
      mapaRef.current = null;
      camadasRef.current = null;
      setPronto(false);
    };
  }, []);

  useEffect(() => {
    const mapa = mapaRef.current;
    const camadas = camadasRef.current;
    if (!mapa || !camadas) return;
    for (const chave of Object.keys(camadasVisiveis) as (keyof typeof camadasVisiveis)[]) {
      if (camadasVisiveis[chave]) camadas[chave].addTo(mapa);
      else camadas[chave].remove();
    }
  }, [camadasVisiveis, pronto]);

  function centralizar() {
    const mapa = mapaRef.current;
    if (!mapa) return;
    const todos = [...percurso.pontos, ...percurso.marcadores, ...interdicoes.flatMap((item) => item.geometria ?? [])];
    if (todos.length) {
      mapa.fitBounds(L.latLngBounds(todos.map((p) => [p.lat, p.lng] as [number, number])), { padding: [30, 30], maxZoom: 17 });
    } else mapa.setView(CENTRO_PARANAVAI, ZOOM_PADRAO);
  }

  useEffect(() => {
    if (solicitarRecorte > 0 && !somenteLeitura) trocarModo("recorte");
  }, [solicitarRecorte, somenteLeitura]);


  // redesenha marcadores, trajeto e interdições
  useEffect(() => {
    const camadas = camadasRef.current;
    if (!camadas) return;
    camadas.percurso.clearLayers();
    camadas.pontos.clearLayers();
    camadas.interdicoes.clearLayers();

    percurso.pontos.forEach((p, i) => {
      const total = percurso.pontos.length;
      const cor = i === 0 ? "#166534" : i === total - 1 && total > 1 ? "#b91c1c" : "#1e3a8a";
      const marcador = L.marker([p.lat, p.lng], {
        icon: icone(String(i + 1), cor),
        draggable: !somenteLeitura,
      })
        .bindTooltip(Object.assign(document.createElement("span"), { textContent: textoSimples(rotuloEtapa(i, total, p.rotulo)) }))
        .addTo(camadas.percurso);
      marcador.on("dragend", () => {
        const ll = marcador.getLatLng();
        const pontos = estadoRef.current.percurso.pontos.map((atual, indice) =>
          indice === i ? { ...atual, lat: ll.lat, lng: ll.lng } : atual,
        );
        atualizar({ pontos });
      });
    });

    if (percurso.pontos.length > 1) {
      L.polyline(
        percurso.pontos.map((p) => [p.lat, p.lng] as [number, number]),
        { color: percurso.estilo?.corLinha ?? "#1d4ed8", weight: percurso.estilo?.espessura ?? 5, opacity: 0.85 },
      ).addTo(camadas.percurso);
    }

    percurso.marcadores.forEach((p, i) => {
      const marcador = L.marker([p.lat, p.lng], {
        icon: icone("•", percurso.estilo?.corMarcador ?? "#b45309"),
        draggable: !somenteLeitura,
      })
        .bindTooltip(p.rotulo?.trim() || `Ponto ${i + 1}`)
        .addTo(camadas.pontos);
      marcador.on("dragend", () => {
        const ll = marcador.getLatLng();
        const marcadores = estadoRef.current.percurso.marcadores.map((atual, indice) =>
          indice === i ? { ...atual, lat: ll.lat, lng: ll.lng } : atual,
        );
        atualizar({ marcadores });
      });
    });

    interdicoes.forEach((item) => {
      if (!item.geometria || item.geometria.length < 2) return;
      L.polyline(
        item.geometria.map((p) => [p.lat, p.lng] as [number, number]),
        { color: "#dc2626", weight: 6, dashArray: "8 6" },
      )
        .bindTooltip(item.rua.trim() || "Rua interditada")
        .addTo(camadas.interdicoes);
    });
  }, [percurso, interdicoes, somenteLeitura, atualizar, pronto]);

  // enquadra o percurso salvo ao abrir em modo leitura
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !somenteLeitura) return;
    const todos = [
      ...percurso.pontos,
      ...percurso.marcadores,
      ...interdicoes.flatMap((i) => i.geometria ?? []),
    ];
    if (todos.length < 2) return;
    mapa.fitBounds(L.latLngBounds(todos.map((p) => [p.lat, p.lng] as [number, number])), {
      padding: [30, 30],
    });
  }, [percurso, interdicoes, somenteLeitura, pronto]);

  function trocarModo(novo: Modo) {
    rascunhoRef.current = [];
    const valor = modo === novo ? "navegar" : novo;
    modoRef.current = valor;
    setModo(valor);
    if (valor === "percurso") mapaRef.current?.doubleClickZoom.disable(); else mapaRef.current?.doubleClickZoom.enable();
    if (containerRef.current) {
      containerRef.current.style.cursor = valor === "navegar" ? "" : "crosshair";
    }
    if (valor !== "recorte") {
      inicioRecorteRef.current = null;
      mapaRef.current?.dragging.enable();
    }
  }

  function cancelarRecorte() {
    selecaoRef.current?.remove();
    selecaoRef.current = null;
    setEnquadramento(null);
    setPreVisualizacao(null);
    modoRef.current = "navegar";
    setModo("navegar");
    mapaRef.current?.dragging.enable();
    if (containerRef.current) containerRef.current.style.cursor = "";
  }

  async function gerarRecorte(confirmar: boolean) {
    if (!enquadramento) {
      toast.error("Desenhe um retângulo sobre o mapa para definir o recorte.");
      return;
    }
    setGerandoRecorte(true);
    try {
      const { gerarImagemMapa } = await import("@/lib/mapa-imagem");
      const imagem = await gerarImagemMapa(percurso, interdicoes, enquadramento);
      if (!imagem) throw new Error("A captura não pôde ser gerada.");
      setPreVisualizacao(imagem);
      if (confirmar) {
        onMapaImagemChange?.(imagem);
        toast.success("Recorte do mapa definido para a O.S.");
        cancelarRecorte();
      }
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível gerar o recorte.");
    } finally {
      setGerandoRecorte(false);
    }
  }

  async function pesquisar(evento?: { preventDefault: () => void }) {
    evento?.preventDefault();

    const termo = busca.trim();
    if (termo.length < 3) return;
    setBuscando(true);
    try {
      const oficiais = await pesquisarEnderecoOficial(termo);
      setSugestoes(oficiais as typeof sugestoes);
      const oficial = oficiais[0];
      const geometria = oficial?.geometria as { lat?: number; lng?: number }[] | null | undefined;
      const pontoOficial = geometria?.find((p) => typeof p.lat === "number" && typeof p.lng === "number");
      if (oficial && pontoOficial?.lat !== undefined && pontoOficial.lng !== undefined) {
        mapaRef.current?.setView([pontoOficial.lat, pontoOficial.lng], 17);
        toast.success(`${oficial.nome_completo} · base oficial`);
        return;
      }
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", `${termo}, Paranavaí, Paraná, Brasil`);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "6");
      url.searchParams.set("countrycodes", "br");
      const resposta = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      if (!resposta.ok) throw new Error("Pesquisa indisponível");
      const lista = (await resposta.json()) as { lat: string; lon: string; display_name: string }[];
      const primeiro = lista[0];
      if (!primeiro) {
        toast.error("Endereço não encontrado.");
        return;
      }
      setResultados(lista);
    } catch {
      toast.error("Não foi possível pesquisar o endereço agora.");
    } finally {
      setBuscando(false);
    }
  }

  const editavel = !somenteLeitura;

  return (
    <div className="space-y-3">
      {editavel && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant={modo === "navegar" ? "default" : "outline"} onClick={() => { modoRef.current = "navegar"; setModo("navegar"); mapaRef.current?.doubleClickZoom.enable(); }}><Hand className="mr-2 h-4 w-4" />Selecionar itens</Button>
          <Button
            type="button"
            size="sm"
            variant={modo === "percurso" ? "default" : "outline"}
            onClick={() => trocarModo("percurso")}
          >
            <RotaIcone className="mr-2 h-4 w-4" aria-hidden="true" />
            {modo === "percurso" ? "Clique no mapa para marcar" : "Adicionar percurso"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={modo === "ponto" ? "default" : "outline"}
            onClick={() => trocarModo("ponto")}
          >
            <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
            Marcar ponto / local
          </Button>
          {permitirInterdicoes && (
            <Button
              type="button"
              size="sm"
              variant={modo === "interdicao" ? "destructive" : "outline"}
              onClick={() => trocarModo("interdicao")}
            >
              <Ban className="mr-2 h-4 w-4" aria-hidden="true" />
              Marcar rua interditada
            </Button>
          )}
          {onMapaImagemChange && (
            <Button
              type="button"
              size="sm"
              variant={modo === "recorte" ? "default" : "outline"}
              onClick={() => trocarModo("recorte")}
            >
              <Crop className="mr-2 h-4 w-4" aria-hidden="true" />
              Recortar área para O.S.
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={indiceHistorico <= 0}
            onClick={() => restaurarHistorico(indiceHistorico - 1)}
          >
            <Undo2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Desfazer
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={indiceHistorico >= historicoRef.current.length - 1} onClick={() => restaurarHistorico(indiceHistorico + 1)}><Redo2 className="mr-2 h-4 w-4" />Refazer</Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!percurso.pontos.length && !percurso.marcadores.length}
            onClick={() => atualizar({ pontos: [], marcadores: [] })}
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Excluir percurso
          </Button>
        </div>
      )}

      {editavel && <div className="flex flex-wrap items-center gap-3 border-y py-2">
        <Label htmlFor="cor-marcador">Cor do marcador</Label><Input id="cor-marcador" type="color" className="h-8 w-12 p-1" value={percurso.estilo?.corMarcador ?? "#b45309"} onChange={(e) => mudarEstilo("corMarcador", e.target.value)} />
        <Label htmlFor="cor-linha">Cor da linha</Label><Input id="cor-linha" type="color" className="h-8 w-12 p-1" value={percurso.estilo?.corLinha ?? "#1d4ed8"} onChange={(e) => mudarEstilo("corLinha", e.target.value)} />
        <Label htmlFor="espessura-linha">Espessura</Label><Input id="espessura-linha" type="range" className="w-32" min="1" max="14" value={percurso.estilo?.espessura ?? 5} onChange={(e) => mudarEstilo("espessura", Number(e.target.value))} /><span className="text-xs">{percurso.estilo?.espessura ?? 5} px</span>
      </div>}

      <div className="flex gap-2">
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void pesquisar();
            }
          }}
          placeholder="Pesquisar rua ou endereço em Paranavaí"
          aria-label="Pesquisar endereço no mapa"
        />
        <Button type="button" variant="outline" disabled={buscando} onClick={() => void pesquisar()}>
          <Search className="mr-2 h-4 w-4" aria-hidden="true" />
          Pesquisar
        </Button>
      </div>
      {sugestoes.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Ruas da base oficial">
          {sugestoes.map((rua) => <Button key={rua.id} type="button" size="sm" variant="secondary" onClick={() => { setBusca(rua.nome_completo); const geo = rua.geometria as { lat?: number; lng?: number }[] | null; const p = geo?.[0]; if (p?.lat !== undefined && p.lng !== undefined) mapaRef.current?.setView([p.lat, p.lng], 17); }}>{rua.nome_completo}{rua.bairros?.nome ? ` · ${rua.bairros.nome}` : ""}</Button>)}
        </div>
      )}
      {resultados.length > 0 && <div className="grid gap-1" aria-label="Resultados da pesquisa de endereço">{resultados.map((item, i) => <Button key={i} type="button" variant="outline" className="h-auto justify-start whitespace-normal text-left" onClick={() => { mapaRef.current?.setView([Number(item.lat), Number(item.lon)], 17); setBusca(item.display_name); setResultados([]); }}>{item.display_name}</Button>)}</div>}


      <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Controles de visualização do mapa">
        <Button type="button" size="icon" variant="outline" title="Ampliar mapa" aria-label="Ampliar mapa" disabled={!pronto || zoomAtual >= 19} onClick={() => mapaRef.current?.zoomIn()}><Plus className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" title="Reduzir mapa" aria-label="Reduzir mapa" disabled={!pronto || zoomAtual <= 2} onClick={() => mapaRef.current?.zoomOut()}><Minus className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" title="Centralizar visualização" aria-label="Centralizar visualização" disabled={!pronto} onClick={centralizar}><Scan className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" title="Centralizar em Paranavaí" aria-label="Centralizar em Paranavaí" disabled={!pronto} onClick={() => mapaRef.current?.setView(CENTRO_PARANAVAI, ZOOM_PADRAO)}><LocateFixed className="h-4 w-4" /></Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button type="button" size="icon" variant="outline" title="Camadas do mapa" aria-label="Camadas do mapa" disabled={!pronto}><Layers className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Camadas do mapa</DropdownMenuLabel>
            {([{ id: "base", nome: "OpenStreetMap" }, { id: "percurso", nome: "Percurso e etapas" }, { id: "pontos", nome: "Pontos e locais" }, { id: "interdicoes", nome: "Interdições" }] as const).map(({ id, nome }) => <DropdownMenuCheckboxItem key={id} checked={camadasVisiveis[id]} onSelect={(e) => e.preventDefault()} onCheckedChange={(checked) => setCamadasVisiveis((atual) => ({ ...atual, [id]: checked === true }))}>{nome}</DropdownMenuCheckboxItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite">Zoom {zoomAtual}</span>
      </div>

      <div
        ref={containerRef}
        style={{ height: altura }}
        className="w-full overflow-hidden rounded-md border"
        role="application"
        aria-label="Mapa do percurso da ordem de serviço"
      />

      {modo === "recorte" && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-3">
          <p className="mr-auto text-sm text-foreground">
            Clique e arraste no mapa para desenhar a área do documento.
          </p>
          <Button type="button" size="sm" variant="outline" disabled={!enquadramento || gerandoRecorte} onClick={() => void gerarRecorte(false)}>
            {gerandoRecorte ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
            Pré-visualizar
          </Button>
          <Button type="button" size="sm" disabled={!enquadramento || gerandoRecorte} onClick={() => void gerarRecorte(true)}>
            <Check className="mr-2 h-4 w-4" /> Confirmar recorte
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={cancelarRecorte}>
            <RotateCcw className="mr-2 h-4 w-4" /> Redefinir / Cancelar
          </Button>
        </div>
      )}

      {preVisualizacao && modo === "recorte" && <EditorMapaImagem imagem={preVisualizacao} onConfirmar={(imagem) => { onMapaImagemChange?.(imagem); cancelarRecorte(); toast.success("Imagem editada definida para a O.S."); }} onCancelar={() => setPreVisualizacao(null)} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold">Etapas do percurso</p>
          {percurso.pontos.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">Nenhum ponto marcado no mapa.</p>
          ) : (
            <ol className="mt-2 space-y-2">
              {percurso.pontos.map((p, i) => (
                <li key={`${p.lat}-${p.lng}-${i}`} className="flex items-center gap-2">
                  <span className="w-6 text-xs text-muted-foreground">{i + 1}.</span>
                  {editavel ? (
                    <div className="min-w-0 flex-1"><EditorTexto compacto value={p.rotulo ?? ""} rotulo={`Nome da etapa ${i + 1}`} onChange={(valor) => atualizar({ pontos: percurso.pontos.map((atual, indice) => indice === i ? { ...atual, rotulo: valor } : atual) })} /></div>
                  ) : (
                    <span className="text-sm"><TextoFormatado valor={rotuloEtapa(i, percurso.pontos.length, p.rotulo)} /></span>
                  )}
                  <span className="hidden text-xs text-muted-foreground xl:inline">
                    {coordenadaTexto(p)}
                  </span>
                  {editavel && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Remover etapa ${i + 1}`}
                      onClick={() =>
                        atualizar({ pontos: percurso.pontos.filter((_, indice) => indice !== i) })
                      }
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>

        {permitirInterdicoes && (
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Ruas interditadas</p>
              {editavel && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onInterdicoesChange?.([
                      ...interdicoes,
                      {
                        rua: "",
                        trecho_inicial: "",
                        trecho_final: "",
                        observacao: "",
                        geometria: null,
                      },
                    ])
                  }
                >
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Adicionar
                </Button>
              )}
            </div>
            {interdicoes.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">Nenhuma rua interditada.</p>
            ) : (
              <div className="mt-2 space-y-3">
                {interdicoes.map((item, i) => (
                  <div key={i} className="space-y-2 rounded-md border p-3">
                    {editavel ? (
                      <>
                        <div>
                          <Label htmlFor={`rua-${i}`}>Rua</Label>
                          <Input
                            id={`rua-${i}`}
                            value={item.rua}
                            onChange={(e) =>
                              onInterdicoesChange?.(
                                interdicoes.map((atual, indice) =>
                                  indice === i ? { ...atual, rua: e.target.value } : atual,
                                ),
                              )
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Trecho inicial"
                            aria-label="Trecho inicial"
                            value={item.trecho_inicial}
                            onChange={(e) =>
                              onInterdicoesChange?.(
                                interdicoes.map((atual, indice) =>
                                  indice === i
                                    ? { ...atual, trecho_inicial: e.target.value }
                                    : atual,
                                ),
                              )
                            }
                          />
                          <Input
                            placeholder="Trecho final"
                            aria-label="Trecho final"
                            value={item.trecho_final}
                            onChange={(e) =>
                              onInterdicoesChange?.(
                                interdicoes.map((atual, indice) =>
                                  indice === i ? { ...atual, trecho_final: e.target.value } : atual,
                                ),
                              )
                            }
                          />
                        </div>
                        <Input
                          placeholder="Observação"
                          aria-label="Observação da interdição"
                          value={item.observacao}
                          onChange={(e) =>
                            onInterdicoesChange?.(
                              interdicoes.map((atual, indice) =>
                                indice === i ? { ...atual, observacao: e.target.value } : atual,
                              ),
                            )
                          }
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {item.geometria?.length
                              ? "Trecho marcado no mapa"
                              : "Sem trecho marcado no mapa"}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              onInterdicoesChange?.(interdicoes.filter((_, indice) => indice !== i))
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                            Remover
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm">
                        <strong>{item.rua || "Rua não informada"}</strong>
                        {item.trecho_inicial || item.trecho_final
                          ? ` — de ${item.trecho_inicial || "?"} até ${item.trecho_final || "?"}`
                          : ""}
                        {item.observacao ? ` — ${item.observacao}` : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
