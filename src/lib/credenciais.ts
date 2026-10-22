import modeloPcd from "@/assets/credencial-pcd-modelo.jpg.asset.json";
import modeloIdoso from "@/assets/credencial-idoso-modelo.jpg.asset.json";

/* Credenciais de estacionamento em vaga especial (Idoso / PCD).
   O documento final usa o modelo oficial enviado como fundo da página (Carta, 612×792 pt)
   e escreve somente os campos variáveis nas posições medidas do modelo. */

export const TIPOS_CREDENCIAL = {
  IDOSO: "Credencial para pessoa idosa",
  PCD: "Credencial para pessoa com deficiência (PCD)",
  RENOVACAO_IDOSO: "Renovação de credencial para pessoa idosa",
  RENOVACAO_PCD: "Renovação de credencial para pessoa com deficiência (PCD)",
  TEMPORARIA_PCD: "Credencial Temporária PCD",
} as const;
export type TipoCredencial = keyof typeof TIPOS_CREDENCIAL;

export const DOCUMENTOS_CONFERENCIA: Record<"IDOSO" | "PCD", string[]> = {
  IDOSO: ["Documento de identificação oficial com foto", "Comprovante de endereço atualizado", "Formulário de solicitação assinado"],
  PCD: [
    "Documento de identificação oficial com foto",
    "Comprovante de endereço atualizado",
    "Formulário de solicitação assinado",
    "Laudo médico atualizado constando a deficiência e o comprometimento de mobilidade, preferencialmente contendo o CID (Código Internacional de Doenças)",
    "Para menor ou dependente: cópia de documento do responsável",
  ],
};

export function ehPcd(tipo: string) {
  return tipo === "PCD" || tipo === "RENOVACAO_PCD" || tipo === "TEMPORARIA_PCD";
}
export const TIPOS_GRUPO = { IDOSO: ["IDOSO", "RENOVACAO_IDOSO"], PCD: ["PCD", "RENOVACAO_PCD", "TEMPORARIA_PCD"] } as const;

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function somarAnos(data: string, anos: number) {
  const [y, m, d] = data.split("-").map(Number);
  if (!y || !m || !d) return "";
  const r = new Date(y, m - 1, d, 12);
  r.setFullYear(r.getFullYear() + anos);
  if (r.getMonth() !== m - 1) r.setDate(0);
  return iso(r);
}
/** Interpreta "6 meses", "1 ano", "30 dias", "2 semanas". Retorna "" se não reconhecer. */
export function somarPeriodo(data: string, periodo: string) {
  const m = periodo.trim().toLocaleLowerCase("pt-BR").match(/^(\d+)\s*(dias?|d|semanas?|sem|m[eê]s|meses|m|anos?|a)$/);
  const [y, mo, d] = data.split("-").map(Number);
  if (!m || !y || !mo || !d) return "";
  const n = Number(m[1]);
  if (!n) return "";
  const u = m[2] ?? "";
  if (/^a/.test(u)) return somarAnos(data, n);
  const r = new Date(y, mo - 1, d, 12);
  if (/^d/.test(u)) r.setDate(r.getDate() + n);
  else if (/^s/.test(u)) r.setDate(r.getDate() + n * 7);
  else {
    r.setDate(1);
    r.setMonth(r.getMonth() + n);
    r.setDate(Math.min(d, new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate()));
  }
  return iso(r);
}
export function validadeAutomatica(tipo: string, emissao: string, tempo: string) {
  if (!emissao) return "";
  return tipo === "TEMPORARIA_PCD" ? somarPeriodo(emissao, tempo) : somarAnos(emissao, 5);
}

export type DadosCredencial = { tipo: string; nome: string; numero_registro: string | null; data_emissao: string; data_validade: string | null };

/** `largura` = largura (pt) reservada ao campo no documento Word. */
type Campo = { texto: string; x: number; y: number; tamanho: number; centro?: boolean; largura: number };

/** Tamanho (pt) dos textos do modelo (Arial 12 negrito). */
export const TAMANHO_ROTULO = 12;
/** Datas de emissão e validade: 4 pt maiores que os textos do modelo (Arial 12 → 16). */
export const TAMANHO_DATA = TAMANHO_ROTULO + 4;
/** Espaço livre para o nome, do fim de "NOME:" até a borda do quadro. */
const LARGURA_NOME = 385;

function dataBr(iso: string | null | undefined) {
  const [a = "", m = "", d = ""] = (iso ?? "").split("-");
  return a && m && d ? `${d}/${m}/${a}` : "";
}
/** Reduz a letra do nome somente quando ele não cabe na linha (largura média de maiúsculas em negrito). */
export function tamanhoNome(nome: string) {
  const n = nome.trim().length;
  if (!n) return TAMANHO_ROTULO;
  return Math.max(8, Math.min(TAMANHO_ROTULO, Math.floor((LARGURA_NOME / (n * 0.72)) * 2) / 2));
}

/** Próximo número de registro a partir dos números já digitados (mantém zeros à esquerda). */
export function proximoNumeroRegistro(numeros: (string | null | undefined)[]) {
  let maior = -1, largura = 0;
  for (const n of numeros) {
    const m = (n ?? "").trim().match(/^\d+/);
    if (!m) continue;
    const v = Number(m[0]);
    if (v > maior) { maior = v; largura = m[0].length; }
  }
  return maior < 0 ? "" : String(maior + 1).padStart(largura, "0");
}

/** Campos variáveis em pontos (origem no canto superior esquerdo; y = linha de base), medidos nos modelos de 2026. */
export function camposCredencial(c: DadosCredencial): Campo[] {
  const pcd = ehPcd(c.tipo);
  const ano = (c.data_emissao ?? "").split("-")[0] || String(new Date().getFullYear());
  const nome = (c.nome ?? "").toLocaleUpperCase("pt-BR");
  const p = pcd
    ? { reg: 357.8, ano: 379.4, yNome: 218.3, xNome: 164.5, yData: 252.0, xEmissao: 242.5, xValidade: 413.7 }
    : { reg: 349.3, ano: 379.3, yNome: 218.9, xNome: 164.9, yData: 252.6, xEmissao: 242.8, xValidade: 414.0 };
  return [
    { texto: c.numero_registro ?? "", x: p.reg, y: 179.6, tamanho: TAMANHO_ROTULO, centro: true, largura: 46 },
    { texto: ano, x: p.ano, y: 179.6, tamanho: TAMANHO_ROTULO, largura: 32 },
    { texto: nome, x: p.xNome, y: p.yNome, tamanho: tamanhoNome(nome), largura: LARGURA_NOME },
    { texto: dataBr(c.data_emissao), x: p.xEmissao, y: p.yData, tamanho: TAMANHO_DATA, largura: 86 },
    { texto: dataBr(c.data_validade), x: p.xValidade, y: p.yData, tamanho: TAMANHO_DATA, largura: 100 },
  ].filter((c) => c.texto);
}

export function urlModelo(tipo: string) {
  return ehPcd(tipo) ? modeloPcd.url : modeloIdoso.url;
}
async function bytesModelo(tipo: string) {
  const r = await fetch(urlModelo(tipo));
  if (!r.ok) throw new Error("Modelo da credencial indisponível.");
  return new Uint8Array(await r.arrayBuffer());
}
function nomeArquivo(c: DadosCredencial) {
  const base = (c.nome || "credencial").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 50);
  return `credencial_${ehPcd(c.tipo) ? "pcd" : "idoso"}_${base}`;
}

export async function gerarCredencialPdf(c: DadosCredencial) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  doc.addImage(await bytesModelo(c.tipo), "JPEG", 0, 0, 612, 792);
  doc.setFont("helvetica", "bold");
  for (const f of camposCredencial(c)) {
    doc.setFontSize(f.tamanho);
    doc.text(f.texto, f.x, f.y, { align: f.centro ? "center" : "left" });
  }
  doc.save(`${nomeArquivo(c)}.pdf`);
}

export async function gerarCredencialDocx(c: DadosCredencial) {
  const d = await import("docx");
  const tw = (pt: number) => Math.round(pt * 20);
  const fundo = new d.Paragraph({
    children: [new d.ImageRun({
      type: "jpg", data: await bytesModelo(c.tipo), transformation: { width: 816, height: 1056 },
      altText: { title: "Modelo da credencial", description: "Modelo oficial da credencial", name: "modelo" },
      floating: { horizontalPosition: { relative: d.HorizontalPositionRelativeFrom.PAGE, offset: 0 }, verticalPosition: { relative: d.VerticalPositionRelativeFrom.PAGE, offset: 0 }, behindDocument: true, allowOverlap: true },
    })],
  });
  const campos = camposCredencial(c).map((f) => {
    const largura = f.largura;
    const x = f.centro ? f.x - largura / 2 : f.x;
    return new d.Paragraph({
      frame: { type: "absolute", position: { x: tw(x), y: tw(f.y - f.tamanho * 0.95) }, width: tw(largura), height: tw(f.tamanho * 1.25), anchor: { horizontal: d.FrameAnchorType.PAGE, vertical: d.FrameAnchorType.PAGE } },
      alignment: f.centro ? d.AlignmentType.CENTER : d.AlignmentType.LEFT,
      spacing: { before: 0, after: 0, line: tw(f.tamanho * 1.2), lineRule: d.LineRuleType.EXACT },
      children: [new d.TextRun({ text: f.texto, bold: true, font: "Arial", size: Math.round(f.tamanho * 2) })],
    });
  });
  const documento = new d.Document({
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0 } } }, children: [fundo, ...campos] }],
  });
  const blob = await d.Packer.toBlob(documento);
  const a = document.createElement("a");
  const u = URL.createObjectURL(blob);
  a.href = u; a.download = `${nomeArquivo(c)}.docx`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 1500);
}
