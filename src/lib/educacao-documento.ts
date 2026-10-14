import { lerTextoFormatado, type TrechoTexto } from "@/lib/texto-formatado";
import { CATEGORIA_ACAO_LABEL, STATUS_ACAO_LABEL, criarDataLocal } from "@/lib/educacao";
import type { AcaoEducativa } from "@/lib/educacao-api";

const LOGO_INSTITUCIONAL = "/assets/logo-header.png";
const PALETA = { azul: "#075783", tinta: "#083f69", claro: "#eaf5fc", painel: "#f5fbff", borda: "#9bc9e8", branco: "#ffffff" };

async function carregarLogo() {
  try {
    const resposta = await fetch(LOGO_INSTITUCIONAL);
    if (!resposta.ok) return null;
    const blob = await resposta.blob();
    return await new Promise<string>((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(String(leitor.result));
      leitor.onerror = reject;
      leitor.readAsDataURL(blob);
    });
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

/** Gera o PDF institucional da ação educativa, com relatório e fotos quando preenchidos. */
export async function gerarPdfAcao(acao: AcaoEducativa) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await carregarLogo();
  const x = 12, largura = 186;
  let y = 55;

  function cabecalho() {
    doc.setDrawColor(PALETA.azul); doc.setLineWidth(0.5); doc.roundedRect(8, 8, 194, 282, 2, 2);
    if (logo) doc.addImage(logo, "PNG", x, 18, 122, 18.5);
    doc.setFillColor(PALETA.claro); doc.setDrawColor(PALETA.borda); doc.roundedRect(141, 16, 57, 20, 2, 2, "FD");
    doc.setFontSize(9); doc.setTextColor(PALETA.tinta);
    doc.setFont("helvetica", "bold"); doc.text("Data:", 144, 23);
    doc.setFont("helvetica", "normal"); doc.text(criarDataLocal(acao.data_acao).toLocaleDateString("pt-BR"), 195, 23, { align: "right" });
    doc.setFont("helvetica", "bold"); doc.text("Situação:", 144, 29);
    doc.setFont("helvetica", "normal"); doc.text(STATUS_ACAO_LABEL[acao.status], 195, 29, { align: "right" });
    doc.setFillColor(PALETA.azul); doc.roundedRect(x, 42, largura, 9, 2, 2, "F");
    doc.setTextColor(PALETA.branco); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text("AGENDA ELETRÔNICA - EDUCAÇÃO NO TRÂNSITO", 105, 48, { align: "center" });
    y = 56;
  }
  function garantir(h: number) { if (y + h > 278) { doc.addPage(); cabecalho(); } }
  function caixa(txt: string, titulo?: string) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    const linhas: TrechoTexto[][] = [[]]; let usado = 0;
    for (const trecho of lerTextoFormatado(txt)) {
      for (const palavra of trecho.texto.split(/(\n|[^\S\n]+)/).filter(Boolean)) {
        if (palavra === "\n") { linhas.push([]); usado = 0; continue; }
        doc.setFont("helvetica", trecho.negrito ? (trecho.italico ? "bolditalic" : "bold") : trecho.italico ? "italic" : "normal");
        for (const letra of palavra) {
          const w = doc.getTextWidth(letra);
          if (usado + w > largura - 10) { linhas.push([]); usado = 0; }
          const linha = linhas.at(-1); if (!linha) continue;
          const anterior = linha.at(-1);
          if (anterior && anterior.negrito === trecho.negrito && anterior.italico === trecho.italico && anterior.sublinhado === trecho.sublinhado) anterior.texto += letra;
          else linha.push({ ...trecho, texto: letra });
          usado += w;
        }
      }
    }
    while (linhas.length) {
      garantir(20);
      const capacidade = Math.max(1, Math.floor((278 - y - (titulo ? 12 : 7)) / 4.2));
      const parte = linhas.splice(0, capacidade); const h = parte.length * 4.2 + (titulo ? 12 : 7);
      doc.setDrawColor(PALETA.borda); doc.setFillColor(PALETA.painel); doc.roundedRect(x, y, largura, h, 2, 2, "FD");
      if (titulo) { doc.setFont("helvetica", "bold"); doc.setTextColor(PALETA.tinta); doc.text(titulo, x + 3, y + 5); }
      const yy = y + (titulo ? 8 : 2); doc.setFillColor(PALETA.branco); doc.roundedRect(x + 2, yy, largura - 4, h - (titulo ? 10 : 4), 1, 1, "FD");
      doc.setTextColor(PALETA.tinta);
      parte.forEach((linha, i) => {
        let xx = x + 5; const baseline = yy + 4 + i * 4.2;
        linha.forEach((t) => {
          doc.setFont("helvetica", t.negrito ? (t.italico ? "bolditalic" : "bold") : t.italico ? "italic" : "normal");
          doc.setFontSize(9); doc.text(t.texto, xx, baseline); const w = doc.getTextWidth(t.texto);
          if (t.sublinhado) { doc.setDrawColor(PALETA.tinta); doc.setLineWidth(0.15); doc.line(xx, baseline + 0.6, xx + w, baseline + 0.6); }
          xx += w;
        });
      });
      y += h + 2;
    }
  }
  function campos(linhas: { rotulo: string; valor: string }[][]) {
    for (const linha of linhas) {
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      const w = largura / linha.length;
      const quebradas = linha.map((c) => doc.splitTextToSize(`${c.rotulo}: ${c.valor}`, w - 8) as string[]);
      const h = Math.max(...quebradas.map((l) => l.length)) * 4.2 + 5; garantir(h);
      linha.forEach((_, i) => {
        doc.setFillColor(PALETA.painel); doc.setDrawColor(PALETA.borda); doc.roundedRect(x + i * w, y, w - 1, h, 1, 1, "FD");
        doc.setTextColor(PALETA.tinta); doc.text(quebradas[i] ?? [], x + i * w + 3, y + 5);
      });
      y += h + 2;
    }
  }

  cabecalho();
  const campo = (rotulo: string, valor: string | null | undefined) => ({ rotulo, valor: valor?.trim() ?? "" });
  campos([
    [campo("Título da Ação", acao.titulo)],
    [campo("Tipo", acao.tipo_atividade || acao.categorias_educativas?.nome || CATEGORIA_ACAO_LABEL[acao.categoria] || acao.categoria), campo("Tema", acao.temas_educativos?.nome)],
    [campo("Local", acao.local || acao.escolas?.nome)],
    [campo("Endereço", [acao.endereco, acao.numero_endereco].filter(Boolean).join(", ") || null), campo("Bairro", acao.bairro)],
    [campo("Início", acao.horario_inicio?.slice(0, 5)), campo("Término", acao.horario_fim?.slice(0, 5))],
    [campo("Equipe", [acao.equipe, acao.orientadores?.nome].filter(Boolean).join(" · ") || null)],
    [campo("Público-alvo", acao.publico_alvo), campo("Participantes", acao.participantes != null ? String(acao.participantes) : null)],
  ].map((linha) => linha.filter((c) => c.valor)).filter((linha) => linha.length));

  if (acao.descricao) caixa(acao.descricao, "Atividade");
  if (acao.observacoes) caixa(acao.observacoes, "Observações");

  if (acao.relatorio_texto || acao.relatorio_imagens.length) {
    if (acao.relatorio_texto) caixa(acao.relatorio_texto, "Relatório");
    for (const foto of acao.relatorio_imagens) {
      if (!foto.src.startsWith("data:image")) continue;
      const props = doc.getImageProperties(foto.src);
      let w = Math.max(20, (largura * (foto.largura || 100)) / 100);
      let h = (w * props.height) / props.width;
      if (h > 230) { h = 230; w = (h * props.width) / props.height; }
      garantir(h + 4);
      doc.setDrawColor(PALETA.borda); doc.rect(x + (largura - w) / 2, y, w, h);
      doc.addImage(foto.src, foto.src.startsWith("data:image/png") ? "PNG" : "JPEG", x + (largura - w) / 2, y, w, h);
      y += h;
      if (foto.legenda?.trim()) {
        garantir(7); doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor(PALETA.tinta);
        doc.text(foto.legenda.trim(), 105, y + 3.5, { align: "center" }); y += 5;
      }
      y += 2;
    }
  }

  const nome = `acao-educativa-${criarDataLocal(acao.data_acao).toISOString().slice(0, 10)}.pdf`;
  baixar(doc.output("blob"), nome);
}

/** Documento editável da mesma ação, incluindo textos formatados e fotos. */
export async function gerarDocxAcao(acao: AcaoEducativa) {
  const { Document, Packer, Paragraph, TextRun, ImageRun, Header, AlignmentType } = await import("docx");
  const paragrafo = (texto: string) => new Paragraph({ spacing: { after: 140 }, children: lerTextoFormatado(texto).flatMap(t => t.texto.split("\n").map((linha, i) => new TextRun({ text: linha, bold: Boolean(t.negrito), italics: Boolean(t.italico), ...(t.sublinhado ? { underline: {} } : {}), ...(i ? { break: 1 } : {}) }))) });
  const children = [new Paragraph({ heading: "Heading1", alignment: AlignmentType.CENTER, children: [new TextRun("AGENDA ELETRÔNICA — EDUCAÇÃO NO TRÂNSITO")] })];
  const campos = [
    ["Data", criarDataLocal(acao.data_acao).toLocaleDateString("pt-BR")], ["Situação", STATUS_ACAO_LABEL[acao.status]],
    ["Título da Ação", acao.titulo], ["Categoria", acao.categorias_educativas?.nome ?? CATEGORIA_ACAO_LABEL[acao.categoria] ?? acao.categoria],
    ["Tipo", acao.tipo_atividade], ["Escola", acao.escolas?.nome], ["Tema", acao.temas_educativos?.nome], ["Local", acao.local],
    ["Endereço", [acao.endereco, acao.numero_endereco].filter(Boolean).join(", ")], ["Bairro", acao.bairro],
    ["Início", acao.horario_inicio?.slice(0, 5)], ["Término", acao.horario_fim?.slice(0, 5)],
    ["Equipe", [acao.equipe, acao.orientadores?.nome].filter(Boolean).join(" · ")], ["Público-alvo", acao.publico_alvo],
    ["Participantes", acao.participantes == null ? null : String(acao.participantes)],
    ["Atividade", acao.descricao], ["Observações", acao.observacoes], ["Relatório", acao.relatorio_texto],
  ];
  for (const [rotulo, valor] of campos) {
    if (!valor) continue;
    children.push(new Paragraph({ children: [new TextRun({ text: rotulo ?? "", bold: true })] }), paragrafo(valor));
  }
  for (const foto of acao.relatorio_imagens) {
    if (!/^data:image\/(jpeg|png|webp);base64,/.test(foto.src)) continue;
    const blob = await (await fetch(foto.src)).blob();
    const bitmap = await createImageBitmap(blob);
    const escala = Math.min(680 * Math.min(100, Math.max(20, foto.largura || 100)) / 100 / bitmap.width, 850 / bitmap.height);
    const width = Math.round(bitmap.width * escala), height = Math.round(bitmap.height * escala);
    const canvas = document.createElement("canvas"); canvas.width = bitmap.width; canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) { bitmap.close(); throw new Error("Não foi possível exportar a foto."); }
    ctx.drawImage(bitmap, 0, 0); bitmap.close();
    const imagem = await (await fetch(canvas.toDataURL("image/png"))).arrayBuffer();
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: "png", data: imagem, transformation: { width, height }, altText: { title: "Foto da atividade", description: foto.legenda || "Registro da ação educativa", name: foto.id } })] }));
    if (foto.legenda) children.push(paragrafo(foto.legenda));
  }
  const logo = await carregarLogo();
  const doc = new Document({ styles: { default: { document: { run: { font: "Arial", size: 20 } } } }, sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1800, right: 680, bottom: 850, left: 680, header: 500 } } },
    ...(logo ? { headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: "png", data: await (await fetch(logo)).arrayBuffer(), transformation: { width: 460, height: 70 } })] })] }) } } : {}),
    children,
  }] });
  baixar(await Packer.toBlob(doc), `acao-educativa-${acao.data_acao}.docx`);
}
