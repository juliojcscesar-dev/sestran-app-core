import {
  CENTRO_PARANAVAI,
  ZOOM_PADRAO,
  percursoVazio,
  type InterdicaoMapa,
  type PercursoMapa,
  type PontoMapa,
} from "@/lib/mapa";

const TAMANHO_TILE = 256;
const LARGURA = 900;
const ALTURA = 520;
const MARGEM = 60;
const ZOOM_MAX = 18;
const ZOOM_MIN = 3;

function xDeLng(lng: number, zoom: number) {
  return ((lng + 180) / 360) * Math.pow(2, zoom) * TAMANHO_TILE;
}

function yDeLat(lat: number, zoom: number) {
  const rad = (lat * Math.PI) / 180;
  const n = Math.log(Math.tan(rad) + 1 / Math.cos(rad));
  return ((1 - n / Math.PI) / 2) * Math.pow(2, zoom) * TAMANHO_TILE;
}

function carregarTile(url: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function pontosDoMapa(percurso: PercursoMapa | null, interdicoes: InterdicaoMapa[]): PontoMapa[] {
  const lista: PontoMapa[] = [];
  if (percurso) lista.push(...percurso.pontos, ...percurso.marcadores);
  for (const i of interdicoes) if (i.geometria) lista.push(...i.geometria);
  return lista;
}

function escolherZoom(pontos: PontoMapa[]) {
  if (pontos.length < 2) return ZOOM_PADRAO;
  const lats = pontos.map((p) => p.lat);
  const lngs = pontos.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  for (let zoom = ZOOM_MAX; zoom >= ZOOM_MIN; zoom--) {
    const largura = Math.abs(xDeLng(maxLng, zoom) - xDeLng(minLng, zoom));
    const altura = Math.abs(yDeLat(minLat, zoom) - yDeLat(maxLat, zoom));
    if (largura <= LARGURA - MARGEM && altura <= ALTURA - MARGEM) return zoom;
  }
  return ZOOM_MIN;
}

function centroDe(pontos: PontoMapa[]): [number, number] {
  if (!pontos.length) return CENTRO_PARANAVAI;
  const lats = pontos.map((p) => p.lat);
  const lngs = pontos.map((p) => p.lng);
  return [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2];
}

function desenharMarcador(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cor: string,
  rotulo: string,
) {
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fillStyle = cor;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(rotulo, x, y + 1);
}

/**
 * Gera automaticamente a captura do mapa (PNG em data URL) com o percurso salvo,
 * usando os tiles do OpenStreetMap. Retorna null quando não há percurso ou o
 * ambiente não suporta canvas (SSR).
 */
export async function gerarImagemMapa(
  percurso: PercursoMapa | null,
  interdicoes: InterdicaoMapa[] = [],
): Promise<string | null> {
  if (typeof document === "undefined") return null;
  const pontos = pontosDoMapa(percurso, interdicoes);
  if (!pontos.length || (percursoVazio(percurso) && !pontos.length)) return null;

  const zoom = escolherZoom(pontos);
  const [latCentro, lngCentro] = centroDe(pontos);
  const centroX = xDeLng(lngCentro, zoom);
  const centroY = yDeLat(latCentro, zoom);
  const origemX = centroX - LARGURA / 2;
  const origemY = centroY - ALTURA / 2;

  const canvas = document.createElement("canvas");
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#e8e8e8";
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  const tileInicialX = Math.floor(origemX / TAMANHO_TILE);
  const tileFinalX = Math.floor((origemX + LARGURA) / TAMANHO_TILE);
  const tileInicialY = Math.floor(origemY / TAMANHO_TILE);
  const tileFinalY = Math.floor((origemY + ALTURA) / TAMANHO_TILE);
  const limite = Math.pow(2, zoom);

  const pedidos: Promise<void>[] = [];
  for (let tx = tileInicialX; tx <= tileFinalX; tx++) {
    for (let ty = tileInicialY; ty <= tileFinalY; ty++) {
      if (ty < 0 || ty >= limite) continue;
      const txNorm = ((tx % limite) + limite) % limite;
      const url = `https://tile.openstreetmap.org/${zoom}/${txNorm}/${ty}.png`;
      const destinoX = tx * TAMANHO_TILE - origemX;
      const destinoY = ty * TAMANHO_TILE - origemY;
      pedidos.push(
        carregarTile(url).then((img) => {
          if (img) ctx.drawImage(img, destinoX, destinoY, TAMANHO_TILE, TAMANHO_TILE);
        }),
      );
    }
  }
  await Promise.all(pedidos);

  const paraTela = (p: PontoMapa): [number, number] => [
    xDeLng(p.lng, zoom) - origemX,
    yDeLat(p.lat, zoom) - origemY,
  ];

  // Ruas interditadas em vermelho tracejado
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const interdicao of interdicoes) {
    const geo = interdicao.geometria ?? [];
    if (geo.length < 2) continue;
    ctx.save();
    ctx.setLineDash([10, 8]);
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 5;
    ctx.beginPath();
    geo.forEach((p, i) => {
      const [x, y] = paraTela(p);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  }

  // Trajeto
  const trajeto = percurso?.pontos ?? [];
  if (trajeto.length > 1) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 8;
    ctx.beginPath();
    trajeto.forEach((p, i) => {
      const [x, y] = paraTela(p);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.strokeStyle = "#1d4ed8";
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  trajeto.forEach((p, i) => {
    const [x, y] = paraTela(p);
    const cor = i === 0 ? "#16a34a" : i === trajeto.length - 1 ? "#b91c1c" : "#1d4ed8";
    desenharMarcador(ctx, x, y, cor, String(i + 1));
  });

  (percurso?.marcadores ?? []).forEach((p) => {
    const [x, y] = paraTela(p);
    desenharMarcador(ctx, x, y, "#b45309", "•");
  });

  // Crédito obrigatório do OpenStreetMap
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillRect(LARGURA - 190, ALTURA - 20, 190, 20);
  ctx.fillStyle = "#333333";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("© OpenStreetMap contributors", LARGURA - 6, ALTURA - 10);

  try {
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export const DIMENSOES_IMAGEM_MAPA = { largura: LARGURA, altura: ALTURA };
