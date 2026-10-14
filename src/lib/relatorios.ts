import { formatarDataBr } from "@/lib/os";

/* Relatórios de listagem por período, compartilhados pelos três módulos. */

export type TipoPeriodo = "dia" | "mes" | "ano" | "geral";

export const TIPO_PERIODO_LABEL: Record<TipoPeriodo, string> = {
  dia: "Dia",
  mes: "Mês",
  ano: "Ano",
  geral: "Geral",
};

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** Converte a escolha da janela de relatório em intervalo de datas e rótulo. */
export function intervaloPeriodo(
  tipo: TipoPeriodo,
  referencia: string,
): { de?: string; ate?: string; rotulo: string } {
  if (tipo === "dia") {
    return { de: referencia, ate: referencia, rotulo: formatarDataBr(referencia) };
  }
  if (tipo === "mes") {
    const [ano = 2000, mes = 1] = referencia.split("-").map(Number);
    const ultimo = new Date(ano, mes, 0).getDate();
    return {
      de: `${referencia}-01`,
      ate: `${referencia}-${String(ultimo).padStart(2, "0")}`,
      rotulo: `${MESES[(mes || 1) - 1]} de ${ano}`,
    };
  }
  if (tipo === "ano") {
    return { de: `${referencia}-01-01`, ate: `${referencia}-12-31`, rotulo: `Ano de ${referencia}` };
  }
  return { rotulo: "Todos os registros" };
}

export type DadosRelatorio = {
  titulo: string;
  periodo: string;
  colunas: string[];
  linhas: string[][];
  arquivo: string;
};

const LOGO_INSTITUCIONAL = "/assets/logo-header.png";
const PALETA = { azul: "#075783", tinta: "#083f69", claro: "#eaf5fc", borda: "#9bc9e8", branco: "#ffffff" };

async function carregarLogo() {
  try {
    const resposta = await fetch(LOGO_INSTITUCIONAL);
    if (!resposta.ok) return null;
    const blob = await resposta.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(String(leitor.result));
      leitor.onerror = reject;
      leitor.readAsDataURL(blob);
    });
    return { base64, arrayBuffer: await blob.arrayBuffer() };
  } catch {
    return null;
  }
}

function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Gera o PDF do relatório de listagem com cabeçalho institucional e tabela. */
export async function gerarRelatorioPdf({ titulo, periodo, colunas, linhas, arquivo }: DadosRelatorio) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await carregarLogo();
  const x = 12, largura = 186;
  const larguras = colunas.map(() => largura / colunas.length);
  let y = 0;

  function cabecalho() {
    doc.setDrawColor(PALETA.azul); doc.setLineWidth(0.5); doc.roundedRect(8, 8, 194, 282, 2, 2);
    if (logo) doc.addImage(logo.base64, "PNG", x, 14, 100, 15.2);
    doc.setFillColor(PALETA.azul); doc.roundedRect(x, 34, largura, 8, 2, 2, "F");
    doc.setTextColor(PALETA.branco); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text(titulo.toUpperCase(), 105, 39.5, { align: "center" });
    doc.setTextColor(PALETA.tinta); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(`Período: ${periodo}  |  ${linhas.length} registro(s)`, 105, 48, { align: "center" });
    y = 54;
    cabecalhoTabela();
  }

  function cabecalhoTabela() {
    doc.setFillColor(PALETA.claro); doc.setDrawColor(PALETA.borda);
    doc.rect(x, y, largura, 7, "FD");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(PALETA.tinta);
    colunas.forEach((coluna, i) => {
      const xx = x + larguras.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(coluna, xx + 2, y + 5, { maxWidth: (larguras[i] ?? 0) - 4 });
    });
    y += 7;
  }

  cabecalho();
  doc.setFont("helvetica", "normal");
  if (!linhas.length) {
    doc.setFontSize(10); doc.setTextColor(PALETA.tinta);
    doc.text("Nenhum registro encontrado no período selecionado.", 105, y + 10, { align: "center" });
  }
  linhas.forEach((linha, indice) => {
    doc.setFontSize(8);
    const quebradas = linha.map((celula, i) => doc.splitTextToSize(celula || "—", (larguras[i] ?? 0) - 4) as string[]);
    const h = Math.max(...quebradas.map((q) => q.length)) * 3.6 + 4;
    if (y + h > 282) { doc.addPage(); cabecalho(); }
    if (indice % 2 === 0) { doc.setFillColor(245, 251, 255); doc.rect(x, y, largura, h, "F"); }
    doc.setDrawColor(PALETA.borda); doc.rect(x, y, largura, h);
    doc.setTextColor(PALETA.tinta);
    quebradas.forEach((q, i) => {
      const xx = x + larguras.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(q, xx + 2, y + 4);
    });
    y += h;
  });

  baixar(doc.output("blob"), `${arquivo}.pdf`);
}

/** Gera o DOCX do relatório de listagem com cabeçalho institucional e tabela. */
export async function gerarRelatorioDocx({ titulo, periodo, colunas, linhas, arquivo }: DadosRelatorio) {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, ImageRun, Header, TableLayoutType } = await import("docx");
  const logo = await carregarLogo();
  const width = 10545;
  const borda = { style: BorderStyle.SINGLE, size: 5, color: "9BC9E8" };
  const borders = { top: borda, bottom: borda, left: borda, right: borda };
  const coluna = Math.floor(width / colunas.length);
  const p = (text: string, bold = false, center = false) => new Paragraph({
    alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { after: 70 },
    children: [new TextRun({ text, bold, color: "083F69", size: 19 })],
  });
  const cell = (texto: string, tituloLinha: boolean) => new TableCell({
    width: { size: coluna, type: WidthType.DXA },
    borders,
    shading: { fill: tituloLinha ? "E5F2FB" : "FFFFFF" },
    margins: { top: 70, bottom: 70, left: 90, right: 90 },
    children: [p(texto || "—", tituloLinha)],
  });
  const tabela = new Table({
    width: { size: width, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: colunas.map(() => coluna),
    rows: [
      new TableRow({ tableHeader: true, children: colunas.map((c) => cell(c, true)) }),
      ...linhas.map((linha) => new TableRow({ cantSplit: true, children: linha.map((c) => cell(c, false)) })),
    ],
  });
  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 19 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 2000, right: 680, bottom: 1200, left: 680, header: 600 } } },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.LEFT,
            children: logo ? [new ImageRun({ type: "png", data: logo.arrayBuffer, transformation: { width: 300, height: 46 } })] : [new TextRun("SESTRAN Paranavaí")],
          })],
        }),
      },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: titulo.toUpperCase(), bold: true, color: "075783", size: 26 })] }),
        p(`Período: ${periodo}  |  ${linhas.length} registro(s)`, false, true),
        new Paragraph({ spacing: { after: 120 }, children: [] }),
        tabela,
        ...(linhas.length ? [] : [p("Nenhum registro encontrado no período selecionado.", false, true)]),
      ],
    }],
  });
  baixar(await Packer.toBlob(doc), `${arquivo}.docx`);
}
