export type PontoMapa = { lat: number; lng: number; rotulo?: string };

export type PercursoMapa = {
  pontos: PontoMapa[];
  marcadores: PontoMapa[];
  centro: [number, number];
  zoom: number;
};

export type InterdicaoMapa = {
  id?: string;
  rua: string;
  trecho_inicial: string;
  trecho_final: string;
  observacao: string;
  geometria: PontoMapa[] | null;
};

export const CENTRO_PARANAVAI: [number, number] = [-23.0731, -52.465];
export const ZOOM_PADRAO = 14;

export const PERCURSO_VAZIO: PercursoMapa = {
  pontos: [],
  marcadores: [],
  centro: CENTRO_PARANAVAI,
  zoom: ZOOM_PADRAO,
};

function numero(valor: unknown): number | null {
  const n = typeof valor === "string" ? Number(valor) : typeof valor === "number" ? valor : NaN;
  return Number.isFinite(n) ? n : null;
}

function lerPontos(valor: unknown): PontoMapa[] {
  if (!Array.isArray(valor)) return [];
  const saida: PontoMapa[] = [];
  for (const item of valor) {
    if (!item || typeof item !== "object") continue;
    const registro = item as Record<string, unknown>;
    const lat = numero(registro["lat"]);
    const lng = numero(registro["lng"]);
    if (lat === null || lng === null) continue;
    const rotulo = typeof registro["rotulo"] === "string" ? registro["rotulo"] : undefined;
    saida.push(rotulo ? { lat, lng, rotulo } : { lat, lng });
  }
  return saida;
}

/** Converte o valor salvo no banco (jsonb) em um percurso válido. */
export function lerPercurso(valor: unknown): PercursoMapa {
  if (!valor || typeof valor !== "object") return { ...PERCURSO_VAZIO };
  const registro = valor as Record<string, unknown>;
  const centro = Array.isArray(registro["centro"]) ? (registro["centro"] as unknown[]) : null;
  const lat = centro ? numero(centro[0]) : null;
  const lng = centro ? numero(centro[1]) : null;
  const zoom = numero(registro["zoom"]);
  return {
    pontos: lerPontos(registro["pontos"]),
    marcadores: lerPontos(registro["marcadores"]),
    centro: lat !== null && lng !== null ? [lat, lng] : CENTRO_PARANAVAI,
    zoom: zoom !== null ? zoom : ZOOM_PADRAO,
  };
}

export function percursoVazio(percurso: PercursoMapa | null | undefined) {
  if (!percurso) return true;
  return percurso.pontos.length === 0 && percurso.marcadores.length === 0;
}

export function coordenadaTexto(ponto: PontoMapa) {
  return `${ponto.lat.toFixed(6)}, ${ponto.lng.toFixed(6)}`;
}

export function rotuloEtapa(indice: number, total: number, rotulo?: string) {
  if (rotulo && rotulo.trim()) return rotulo.trim();
  if (indice === 0) return "Ponto inicial";
  if (indice === total - 1) return "Ponto final";
  return `Etapa ${indice}`;
}

/** Descrição textual do percurso, usada nos documentos PDF/DOCX. */
export function descreverPercurso(percurso: PercursoMapa | null | undefined) {
  if (!percurso || !percurso.pontos.length) return "";
  return percurso.pontos
    .map((p, i) => `${rotuloEtapa(i, percurso.pontos.length, p.rotulo)} (${coordenadaTexto(p)})`)
    .join(" → ");
}

export function descreverInterdicoes(interdicoes: InterdicaoMapa[]) {
  return interdicoes
    .filter((i) => i.rua.trim())
    .map((i) => {
      const trecho = [i.trecho_inicial, i.trecho_final].filter((t) => t && t.trim()).join(" até ");
      const partes = [i.rua.trim()];
      if (trecho) partes.push(trecho);
      if (i.observacao?.trim()) partes.push(i.observacao.trim());
      return partes.join(" — ");
    });
}
