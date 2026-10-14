import { lerTextoFormatado, juntarTextosFormatados, salvarTextoFormatado, type TrechoTexto } from "@/lib/texto-formatado";
import { formatarDataBr, formatarHora, periodoHorario, STATUS_OS_LABEL, type StatusOS } from "@/lib/os";
import type { OrdemCompleta } from "@/lib/os-api";
import { descreverInterdicoes, descreverPercurso, lerPercurso } from "@/lib/mapa";
import type { ImagemRelatorio } from "@/lib/relatorio-imagens";


export type IdentificacaoOrgao = { orgao: string; secretaria: string; logo_url: string; autoridade?: string; cargo_autoridade?: string };
const LOGO_INSTITUCIONAL = "/assets/logo-header.png";

type Linha = { rotulo: string; valor: string };

function texto(valor: unknown) {
  const v = typeof valor === "string" ? valor.trim() : valor == null ? "" : String(valor);
  return v.length ? v : "—";
}

export function montarConteudo(dados: OrdemCompleta) {
  const o = dados.ordem as Record<string, unknown> & {
    numero: string;
    status: string;
    eventos?: { titulo?: string } | null;
    solicitantes?: { nome?: string } | null;
  };

  const cabecalho: Linha[] = [
    { rotulo: "Número da O.S.", valor: texto(o["numero"]) },
    { rotulo: "Ano", valor: texto(o["ano"]) },
    { rotulo: "Data de emissão", valor: formatarDataBr(o["data_emissao"] as string) },
    { rotulo: "IPM", valor: texto(o["ipm"]) },
    { rotulo: "Situação", valor: STATUS_OS_LABEL[o.status as StatusOS] ?? texto(o.status) },
  ];

  const corpo: Linha[] = [
    { rotulo: "De", valor: texto(o["remetente"]) },
    { rotulo: "Para", valor: texto(o["destinatario"]) },
    { rotulo: "Natureza", valor: texto(o["natureza"]) },
    { rotulo: "Solicitante", valor: texto(o.solicitantes?.nome) },
    { rotulo: "Evento", valor: texto(o.eventos?.titulo) },
    { rotulo: "Local", valor: texto(o["local"]) },
    { rotulo: "Data", valor: formatarDataBr(o["data_servico"] as string) },
    {
      rotulo: "Horário",
      valor: periodoHorario(o["hora_inicio"] as string, o["hora_fim"] as string),
    },
    {
      rotulo: "Serviços",
      valor:
        dados.servicos
          .map((s) => {
            const nome = (s as { tipos_servico?: { nome?: string } }).tipos_servico?.nome ?? "";
            return s.detalhe ? `${nome} (${s.detalhe})` : nome;
          })
          .filter(Boolean)
          .join(", ") || "—",
    },
    { rotulo: "Trajeto / Percurso", valor: texto(o["trajeto"]) },
    { rotulo: "Percurso no mapa", valor: texto(descreverPercurso(lerPercurso(o["percurso"]))) },
    {
      rotulo: "Ruas interditadas",
      valor: texto(descreverInterdicoes(dados.interdicoes ?? []).join("; ")),
    },
  ].filter((item) => item.valor !== "—");


  const agentes = dados.agentes.map((a) => {
    const nome = (a as { agentes?: { nome?: string; matricula?: string | null } }).agentes;
    return {
      nome: texto(nome?.nome),
      matricula: texto(nome?.matricula),
      funcao: texto(a.funcao),
      chegada: a.hora_chegada ? formatarHora(a.hora_chegada) : "—",
      observacao: texto(a.observacao),
    };
  });

  const orientadores = dados.orientadores.map((r) => {
    const nome = (r as { orientadores?: { nome?: string; matricula?: string | null } }).orientadores;
    return {
      nome: texto(nome?.nome),
      matricula: texto(nome?.matricula),
      observacao: texto(r.observacao),
    };
  });

  return {
    numero: o.numero,
    cabecalho,
    corpo,
    agentes,
    orientadores,
    observacoes: texto(o["observacoes"]),
    percurso: lerPercurso(o["percurso"]),
    interdicoes: dados.interdicoes ?? [],
    /* Captura já salva do mapa; quando ausente, é gerada automaticamente. */
    mapaImagem: typeof o["mapa_imagem"] === "string" ? (o["mapa_imagem"] as string) : null,
    /* Relatório preenchido pelo operador; texto e fotos são opcionais. */
    relatorio: {
      texto: typeof o["relatorio_texto"] === "string" ? o["relatorio_texto"] : "",
      imagens: Array.isArray(o["relatorio_imagens"]) ? (o["relatorio_imagens"] as ImagemRelatorio[]) : [],
    },
  };
}

/** Captura do mapa: usa a imagem salva ou desenha automaticamente o trajeto. */
async function obterImagemMapa(conteudo: ReturnType<typeof montarConteudo>) {
  if (conteudo.mapaImagem?.startsWith("data:image")) return conteudo.mapaImagem;
  const { gerarImagemMapa } = await import("@/lib/mapa-imagem");
  try {
    return await gerarImagemMapa(conteudo.percurso, conteudo.interdicoes);
  } catch {
    return null;
  }
}

function dataUrlParaBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}



async function carregarLogo(url: string) {
  if (!url) return null;
  try {
    const resposta = await fetch(url);
    if (!resposta.ok) return null;
    const blob = await resposta.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(String(leitor.result));
      leitor.onerror = reject;
      leitor.readAsDataURL(blob);
    });
    const arrayBuffer = await blob.arrayBuffer();
    return { base64, arrayBuffer, tipo: blob.type };
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

function nomeArquivo(numero: string, extensao: string) {
  return `OS-${numero.replace("/", "-")}.${extensao}`;
}

/* ------------------------------ PDF ------------------------------ */
// Document palette mirrors the institutional print tokens in styles.css.
const PALETA = { azul: "#075783", tinta: "#083f69", claro: "#eaf5fc", painel: "#f5fbff", borda: "#9bc9e8", branco: "#ffffff" };
function camposDocumento(dados: OrdemCompleta) {
  const o = dados.ordem;
  const campo = (rotulo: string, valor: string | null | undefined): Linha => ({ rotulo, valor: valor?.trim() ?? "" });
  return [
    [campo("De", o.remetente), campo("Para", o.destinatario)],
    [campo("Natureza", o.natureza), campo("Solicitante", o.solicitantes?.nome)],
    [campo("Local", o.local)],
    [campo("Data do Serviço", formatarDataBr(o.data_servico)), campo("Horário", o.hora_inicio ? formatarHora(o.hora_inicio) : ""), campo("Encerramento", o.hora_fim ? formatarHora(o.hora_fim) : "")],
    [campo("Evento", o.eventos?.titulo)],
  ].map((linha) => linha.filter((c) => c.valor)).filter((linha) => linha.length);
}
function textosDocumento(dados: OrdemCompleta) {
  return {
    servico: juntarTextosFormatados(dados.servicos.map((s) => juntarTextosFormatados([s.tipos_servico?.nome ?? "", s.detalhe ?? ""].filter(Boolean), " — ")), "\n"),
    percurso: juntarTextosFormatados([dados.ordem.trajeto ?? "", salvarTextoFormatado(lerTextoFormatado(descreverPercurso(lerPercurso(dados.ordem.percurso))).map(t => ({ ...t, texto: t.texto.replaceAll("→", " até ") }))), ...descreverInterdicoes(dados.interdicoes)].filter(Boolean), "\n"),
  };
}
export async function gerarPdf(dados: OrdemCompleta, ident: IdentificacaoOrgao) {
  const { jsPDF } = await import("jspdf");
  const conteudo = montarConteudo(dados); const textos = textosDocumento(dados);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await carregarLogo(LOGO_INSTITUCIONAL);
  const mapa = await obterImagemMapa(conteudo);
  const x = 12, largura = 186; let y = 55;
  function assinatura() {
    doc.setDrawColor(PALETA.azul); doc.line(64, 276, 146, 276);
    doc.setTextColor(PALETA.tinta); doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(ident.autoridade ?? "Carlos Hideki de Souza Fujimori", 105, 281, { align: "center" });
    doc.setFont("helvetica", "bold"); doc.text(ident.cargo_autoridade ?? "Diretor de Trânsito", 105, 286, { align: "center" });
  }
  function cabecalho() {
    doc.setDrawColor(PALETA.azul); doc.setLineWidth(.5); doc.roundedRect(8, 8, 194, 282, 2, 2);
    if (logo) doc.addImage(logo.base64, "PNG", x, 23, 122, 18.5);
    doc.setFillColor(PALETA.claro); doc.setDrawColor(PALETA.borda); doc.roundedRect(141, 20, 57, 23, 2, 2, "FD");
    const campos = [["Nº", dados.ordem.numero], ["Data", formatarDataBr(dados.ordem.data_emissao)], ...(dados.ordem.ipm ? [["IPM", dados.ordem.ipm]] : [])];
    campos.forEach(([label, valor], i) => { const yy = 26 + i * 6; doc.setFontSize(9); doc.setTextColor(PALETA.tinta); doc.setFont("helvetica", "bold"); doc.text(`${label}:`, 144, yy); doc.setFont("helvetica", "normal"); doc.text(valor ?? "", 195, yy, { align: "right" }); doc.line(160, yy + 1, 195, yy + 1); });
    doc.setFillColor(PALETA.azul); doc.roundedRect(x, 46, largura, 7, 2, 2, "F"); doc.setTextColor(PALETA.branco); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text("ORDEM DE SERVIÇO", 105, 51, { align: "center" });
    assinatura(); y = 56;
  }
  function garantir(h: number) { if (y + h > 269) { doc.addPage(); cabecalho(); } }
  function caixa(txt: string, titulo?: string) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    const linhas: TrechoTexto[][] = [[]]; let usado = 0;
    for (const trecho of lerTextoFormatado(txt)) {
      for (const palavra of trecho.texto.split(/(\n|[^\S\n]+)/).filter(Boolean)) {
        if (palavra === "\n") { linhas.push([]); usado = 0; continue; }
        doc.setFont("helvetica", trecho.negrito ? (trecho.italico ? "bolditalic" : "bold") : trecho.italico ? "italic" : "normal");
        // Character fallback also wraps long unbroken words within the document.
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
      garantir(20); const capacidade = Math.max(1, Math.floor((269 - y - (titulo ? 12 : 7)) / 4.2));
      const parte = linhas.splice(0, capacidade); const h = parte.length * 4.2 + (titulo ? 12 : 7);
      doc.setDrawColor(PALETA.borda); doc.setFillColor(PALETA.painel); doc.roundedRect(x, y, largura, h, 2, 2, "FD");
      if (titulo) { doc.setFont("helvetica", "bold"); doc.setTextColor(PALETA.tinta); doc.text(titulo, x + 3, y + 5); }
      const yy = y + (titulo ? 8 : 2); doc.setFillColor(PALETA.branco); doc.roundedRect(x + 2, yy, largura - 4, h - (titulo ? 10 : 4), 1, 1, "FD");
      doc.setTextColor(PALETA.tinta);
      parte.forEach((linha, i) => {
        let xx = x + 5; const baseline = yy + 4 + i * 4.2;
        linha.forEach(t => {
          doc.setFont("helvetica", t.negrito ? (t.italico ? "bolditalic" : "bold") : t.italico ? "italic" : "normal");
          doc.setFontSize(9); doc.text(t.texto, xx, baseline); const w = doc.getTextWidth(t.texto);
          if (t.sublinhado) { doc.setDrawColor(PALETA.tinta); doc.setLineWidth(.15); doc.line(xx, baseline + .6, xx + w, baseline + .6); }
          xx += w;
        });
      }); y += h + 2;
    }
  }
  cabecalho();
  for (const linha of camposDocumento(dados)) {
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    const w = largura / linha.length;
    const linhas = linha.map((c) => doc.splitTextToSize(`${c.rotulo}: ${c.valor}`, w - 8) as string[]);
    const h = Math.max(...linhas.map((l) => l.length)) * 4.2 + 5; garantir(h);
    linha.forEach((_, i) => { doc.setFillColor(PALETA.painel); doc.setDrawColor(PALETA.borda); doc.roundedRect(x + i * w, y, w - 1, h, 1, 1, "FD"); doc.setTextColor(PALETA.tinta); doc.text(linhas[i] ?? [], x + i * w + 3, y + 5); }); y += h + 2;
  }
  if (textos.servico) caixa(textos.servico, "1 - Serviço");
  if (textos.percurso) caixa(textos.percurso, "2 - Percurso");
  const equipe = [
    ...conteudo.agentes.map((a) => [a.nome + (a.matricula !== "—" ? ` — Matrícula ${a.matricula}` : ""), [a.chegada, a.funcao, a.observacao].filter((v) => v !== "—").join(" — ")]),
    ...conteudo.orientadores.map((a) => [`${a.nome} (Orientador)` + (a.matricula !== "—" ? ` — Matrícula ${a.matricula}` : ""), a.observacao !== "—" ? a.observacao : ""]),
  ];
  function headerEquipe() { garantir(8); doc.setFillColor(PALETA.claro); doc.setDrawColor(PALETA.borda); doc.rect(x, y, largura, 7, "FD"); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(PALETA.tinta); doc.text(conteudo.agentes.length ? "Agentes de Trânsito" : "Orientadores de Trânsito", x + largura / 4, y + 5, { align: "center" }); doc.text("Horário no Local", x + largura * .75, y + 5, { align: "center" }); y += 7; }
  if (equipe.length) {
    headerEquipe();
    for (const [nome, horario] of equipe) {
      doc.setFont("helvetica", "normal"); const l = doc.splitTextToSize(nome ?? "", 87) as string[]; const r = doc.splitTextToSize(horario ?? "", 87) as string[];
      while (l.length || r.length) {
        if (y + 10 > 269) { doc.addPage(); cabecalho(); headerEquipe(); }
        const max = Math.max(1, Math.floor((269 - y - 4) / 4.2)); const ll = l.splice(0, max); const rr = r.splice(0, max); const h = Math.max(ll.length, rr.length, 1) * 4.2 + 4;
        doc.setDrawColor(PALETA.borda); doc.rect(x, y, largura / 2, h); doc.rect(x + largura / 2, y, largura / 2, h); doc.setTextColor(PALETA.tinta); doc.text(ll, x + 3, y + 5); doc.text(rr, x + largura / 2 + 3, y + 5); y += h;
      }
    } y += 2;
  }
  if (conteudo.observacoes !== "—") caixa(conteudo.observacoes, "Observações");
  if (mapa) {
    const props = doc.getImageProperties(mapa);
    const ideal = Math.min(105, largura * props.height / props.width);
    const disponivel = 265 - y;
    const h = disponivel >= 65 ? Math.min(ideal, disponivel) : ideal;
    garantir(h + 4);
    doc.setDrawColor(PALETA.borda); doc.rect(x, y, largura, h);
    const w = h * props.width / props.height;
    doc.addImage(mapa, "PNG", x + (largura - w) / 2, y, w, h);
  }
  if (conteudo.relatorio.texto || conteudo.relatorio.imagens.length) {
    if (conteudo.relatorio.texto) caixa(conteudo.relatorio.texto, "Relatório");
    for (const foto of conteudo.relatorio.imagens) {
      if (!foto.src.startsWith("data:image")) continue;
      const props = doc.getImageProperties(foto.src);
      let w = Math.max(20, (largura * (foto.largura || 100)) / 100);
      let h = (w * props.height) / props.width;
      if (h > 230) { h = 230; w = (h * props.width) / props.height; }
      garantir(h + 4);
      doc.setDrawColor(PALETA.borda); doc.rect(x + (largura - w) / 2, y, w, h);
      doc.addImage(foto.src, foto.src.startsWith("data:image/png") ? "PNG" : "JPEG", x + (largura - w) / 2, y, w, h);
      y += h;
      if (foto.legenda?.trim()) { garantir(7); doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor(PALETA.tinta); doc.text(foto.legenda.trim(), 105, y + 3.5, { align: "center" }); y += 5; }
      y += 2;
    }
  }
  baixar(doc.output("blob"), nomeArquivo(conteudo.numero, "pdf"));
}

/* ------------------------------ DOCX ------------------------------ */
export async function gerarDocx(dados: OrdemCompleta, ident: IdentificacaoOrgao) {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, ImageRun, Header, Footer, TableLayoutType } = await import("docx");
  const c = montarConteudo(dados); const textos = textosDocumento(dados);
  const logo = await carregarLogo(LOGO_INSTITUCIONAL); const mapa = await obterImagemMapa(c);
  const width = 10545; const borda = { style: BorderStyle.SINGLE, size: 5, color: "9BC9E8" }; const borders = { top: borda, bottom: borda, left: borda, right: borda };
  const p = (text: string, bold = false, color = "083F69", center = false) => new Paragraph({ alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT, spacing: { after: 70 }, children: lerTextoFormatado(text).flatMap(t => t.texto.split("\n").map((linha, i) => new TextRun({ text: linha, ...(i ? { break: 1 } : {}), bold: Boolean(bold || t.negrito), italics: Boolean(t.italico), ...(t.sublinhado ? { underline: {} } : {}), color, size: 19 }))) });
  const cell = (children: InstanceType<typeof Paragraph>[], w: number, fill = "FFFFFF") => new TableCell({ width: { size: w, type: WidthType.DXA }, borders, shading: { fill }, margins: { top: 90, bottom: 90, left: 100, right: 100 }, children });
  function tabela(linhas: { valores: string[]; titulo?: boolean }[]) {
    const colunas = linhas[0]?.valores.length ?? 1;
    return new Table({ width: { size: width, type: WidthType.DXA }, layout: TableLayoutType.FIXED, columnWidths: Array(colunas).fill(Math.floor(width / colunas)), rows: linhas.map((l) => new TableRow({ tableHeader: Boolean(l.titulo), cantSplit: true, children: l.valores.map((v) => cell([p(v, l.titulo)], Math.floor(width / colunas), l.titulo ? "E5F2FB" : "F5FBFF")) })) });
  }
  const espaco = () => new Paragraph({ spacing: { after: 70 }, children: [] });
  const headLogo = new Paragraph({ children: logo ? [new ImageRun({ type: "png", data: logo.arrayBuffer, transformation: { width: 435, height: 66 } })] : [new TextRun(ident.orgao)] });
  const header = new Table({ width: { size: width, type: WidthType.DXA }, columnWidths: [7300, 3245], rows: [new TableRow({ children: [cell([headLogo], 7300), cell([p(`Nº: ${c.numero}`, true), p(`Data: ${formatarDataBr(dados.ordem.data_emissao)}`), ...(dados.ordem.ipm ? [p(`IPM: ${dados.ordem.ipm}`)] : [])], 3245, "EAF5FC")] })] });
  const titulo = new Table({ width: { size: width, type: WidthType.DXA }, rows: [new TableRow({ children: [cell([p("ORDEM DE SERVIÇO", true, "FFFFFF", true)], width, "075783")] })] });
  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [];
  for (const linha of camposDocumento(dados)) { children.push(tabela([{ valores: linha.map((c) => `${c.rotulo}: ${c.valor}`) }]), espaco()); }
  for (const [titulo, txt] of [["1 - Serviço", textos.servico], ["2 - Percurso", textos.percurso]]) { if (txt) children.push(tabela([{ valores: [titulo ?? ""], titulo: true }, { valores: [txt] }]), espaco()); }
  const equipe = [...c.agentes.map((a) => [a.nome + (a.matricula !== "—" ? ` — Matrícula ${a.matricula}` : ""), [a.chegada, a.funcao, a.observacao].filter((v) => v !== "—").join(" — ")]), ...c.orientadores.map((a) => [`${a.nome} (Orientador)` + (a.matricula !== "—" ? ` — Matrícula ${a.matricula}` : ""), a.observacao === "—" ? "" : a.observacao])];
  if (equipe.length) children.push(tabela([{ valores: [c.agentes.length ? "Agentes de Trânsito" : "Orientadores de Trânsito", "Horário no Local"], titulo: true }, ...equipe.map((valores) => ({ valores }))]), espaco());
  if (c.observacoes !== "—") children.push(tabela([{ valores: ["Observações"], titulo: true }, { valores: [c.observacoes] }]), espaco());
  if (mapa) {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = mapa; });
    const w = Math.min(690, 397 * img.width / img.height); const h = w * img.height / img.width;
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: "png", data: dataUrlParaBytes(mapa), transformation: { width: w, height: h } })] }));
  }
  if (c.relatorio.texto || c.relatorio.imagens.length) {
    children.push(tabela([{ valores: ["Relatório"], titulo: true }, ...(c.relatorio.texto ? [{ valores: [c.relatorio.texto] }] : [])]), espaco());
    for (const foto of c.relatorio.imagens) {
      if (!foto.src.startsWith("data:image")) continue;
      const el = await new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = foto.src; });
      const w = Math.min(690, (690 * (foto.largura || 100)) / 100); const h = (w * el.height) / el.width;
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: foto.src.startsWith("data:image/png") ? "png" : "jpg", data: dataUrlParaBytes(foto.src), transformation: { width: w, height: h } })] }));
      if (foto.legenda?.trim()) children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: foto.legenda.trim(), italics: true, size: 17, color: "083F69" })] }));
    }
  }
  const assinatura = new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 6, color: "0B5D8F" } }, indent: { left: 2948, right: 2948 }, children: [] });
  const doc = new Document({ styles: { default: { document: { run: { font: "Arial", size: 19 } } } }, sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 3250, right: 680, bottom: 1500, left: 680, header: 1134, footer: 560 } } }, headers: { default: new Header({ children: [header, espaco(), titulo] }) }, footers: { default: new Footer({ children: [assinatura, p(ident.autoridade ?? "Carlos Hideki de Souza Fujimori", false, "083F69", true), p(ident.cargo_autoridade ?? "Diretor de Trânsito", true, "083F69", true)] }) }, children }] });
  baixar(await Packer.toBlob(doc), nomeArquivo(c.numero, "docx"));
}
