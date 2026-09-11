import { formatarDataBr, formatarHora, periodoHorario, STATUS_OS_LABEL, type StatusOS } from "@/lib/os";
import type { OrdemCompleta } from "@/lib/os-api";
import { descreverInterdicoes, descreverPercurso, lerPercurso } from "@/lib/mapa";


export type IdentificacaoOrgao = { orgao: string; secretaria: string; logo_url: string };

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
  ];


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
    /* Preparado para exportar a imagem do mapa nos documentos. */
    mapaImagem: typeof o["mapa_imagem"] === "string" ? (o["mapa_imagem"] as string) : null,
  };
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

export async function gerarPdf(dados: OrdemCompleta, ident: IdentificacaoOrgao) {
  const { jsPDF } = await import("jspdf");
  const conteudo = montarConteudo(dados);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margem = 18;
  const largura = 210 - margem * 2;
  let y = margem;

  const logo = await carregarLogo(ident.logo_url);
  if (logo?.base64) {
    try {
      doc.addImage(logo.base64, margem, y, 20, 20);
    } catch {
      /* logotipo inválido: segue sem imagem */
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(ident.orgao, 105, y + 6, { align: "center" });
  doc.setFontSize(11);
  doc.text(ident.secretaria, 105, y + 12, { align: "center" });
  doc.setFontSize(14);
  doc.text(`ORDEM DE SERVIÇO Nº ${conteudo.numero}`, 105, y + 22, { align: "center" });
  y += 28;
  doc.setLineWidth(0.4);
  doc.line(margem, y, margem + largura, y);
  y += 8;

  function quebrar(texto: string, largura2: number) {
    return doc.splitTextToSize(texto, largura2) as string[];
  }

  function novaPaginaSePreciso(altura: number) {
    if (y + altura > 297 - margem) {
      doc.addPage();
      y = margem;
    }
  }

  function linhas(itens: Linha[]) {
    doc.setFontSize(10);
    for (const item of itens) {
      const valor = quebrar(item.valor, largura - 45);
      novaPaginaSePreciso(valor.length * 5 + 2);
      doc.setFont("helvetica", "bold");
      doc.text(`${item.rotulo}:`, margem, y);
      doc.setFont("helvetica", "normal");
      doc.text(valor, margem + 45, y);
      y += valor.length * 5 + 2;
    }
    y += 3;
  }

  function titulo(txt: string) {
    novaPaginaSePreciso(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(txt, margem, y);
    y += 2;
    doc.setLineWidth(0.2);
    doc.line(margem, y, margem + largura, y);
    y += 6;
  }

  titulo("Identificação");
  linhas(conteudo.cabecalho);
  titulo("Dados do serviço");
  linhas(conteudo.corpo);

  titulo("Agentes de trânsito");
  if (!conteudo.agentes.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Nenhum agente designado.", margem, y);
    y += 8;
  } else {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Agente", margem, y);
    doc.text("Matrícula", margem + 70, y);
    doc.text("Função", margem + 100, y);
    doc.text("Chegada", margem + 135, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    for (const a of conteudo.agentes) {
      novaPaginaSePreciso(10);
      doc.text(quebrar(a.nome, 68), margem, y);
      doc.text(a.matricula, margem + 70, y);
      doc.text(quebrar(a.funcao, 33), margem + 100, y);
      doc.text(a.chegada, margem + 135, y);
      y += 5;
      if (a.observacao !== "—") {
        const obs = quebrar(`Obs.: ${a.observacao}`, largura - 4);
        novaPaginaSePreciso(obs.length * 4 + 2);
        doc.setTextColor(90);
        doc.text(obs, margem + 4, y);
        doc.setTextColor(0);
        y += obs.length * 4 + 1;
      }
    }
    y += 5;
  }

  titulo("Orientadores");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (!conteudo.orientadores.length) {
    doc.text("Nenhum orientador designado.", margem, y);
    y += 8;
  } else {
    for (const r of conteudo.orientadores) {
      novaPaginaSePreciso(8);
      const linha = `${r.nome}${r.matricula !== "—" ? ` — matrícula ${r.matricula}` : ""}${
        r.observacao !== "—" ? ` — ${r.observacao}` : ""
      }`;
      const partes = quebrar(linha, largura);
      doc.text(partes, margem, y);
      y += partes.length * 5;
    }
    y += 5;
  }

  titulo("Observações");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const obs = quebrar(conteudo.observacoes, largura);
  novaPaginaSePreciso(obs.length * 5);
  doc.text(obs, margem, y);
  y += obs.length * 5 + 20;

  novaPaginaSePreciso(30);
  doc.line(margem + 20, y, margem + 90, y);
  doc.line(margem + 100, y, margem + largura - 5, y);
  y += 5;
  doc.setFontSize(9);
  doc.text("Responsável pela emissão", margem + 22, y);
  doc.text("Autoridade de trânsito", margem + 110, y);

  baixar(doc.output("blob"), nomeArquivo(conteudo.numero, "pdf"));
}

/* ------------------------------ DOCX ------------------------------ */

export async function gerarDocx(dados: OrdemCompleta, ident: IdentificacaoOrgao) {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    AlignmentType,
    WidthType,
    BorderStyle,
    ShadingType,
    ImageRun,
  } = await import("docx");

  const conteudo = montarConteudo(dados);
  const larguraTotal = 9026;
  const borda = { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" };
  const bordas = { top: borda, bottom: borda, left: borda, right: borda };
  const margensCelula = { top: 80, bottom: 80, left: 120, right: 120 };

  function paragrafo(txt: string, negrito = false) {
    return new Paragraph({ children: [new TextRun({ text: txt, bold: negrito })] });
  }

  function tabelaCampos(itens: Linha[]) {
    return new Table({
      width: { size: larguraTotal, type: WidthType.DXA },
      columnWidths: [2600, 6426],
      rows: itens.map(
        (item) =>
          new TableRow({
            children: [
              new TableCell({
                borders: bordas,
                margins: margensCelula,
                width: { size: 2600, type: WidthType.DXA },
                shading: { fill: "EEF2F7", type: ShadingType.CLEAR },
                children: [paragrafo(item.rotulo, true)],
              }),
              new TableCell({
                borders: bordas,
                margins: margensCelula,
                width: { size: 6426, type: WidthType.DXA },
                children: item.valor.split("\n").map((l) => paragrafo(l)),
              }),
            ],
          }),
      ),
    });
  }

  function secao(txt: string) {
    return new Paragraph({
      spacing: { before: 260, after: 140 },
      children: [new TextRun({ text: txt.toUpperCase(), bold: true, size: 22 })],
    });
  }

  const logo = await carregarLogo(ident.logo_url);
  const cabecalhoLogo: InstanceType<typeof Paragraph>[] = [];
  if (logo?.arrayBuffer) {
    const tipo = logo.tipo.includes("png") ? "png" : logo.tipo.includes("gif") ? "gif" : "jpg";
    cabecalhoLogo.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: tipo as "png" | "jpg" | "gif",
            data: logo.arrayBuffer,
            transformation: { width: 70, height: 70 },
            altText: { title: "Logotipo", description: ident.orgao, name: "logotipo" },
          }),
        ],
      }),
    );
  }

  const larguraAgentes = [3000, 1400, 2200, 1200, 1226];
  const tabelaAgentes = conteudo.agentes.length
    ? new Table({
        width: { size: larguraTotal, type: WidthType.DXA },
        columnWidths: larguraAgentes,
        rows: [
          new TableRow({
            children: ["Agente", "Matrícula", "Função", "Chegada", "Observação"].map(
              (t, i) =>
                new TableCell({
                  borders: bordas,
                  margins: margensCelula,
                  width: { size: larguraAgentes[i]!, type: WidthType.DXA },
                  shading: { fill: "EEF2F7", type: ShadingType.CLEAR },
                  children: [paragrafo(t, true)],
                }),
            ),
          }),
          ...conteudo.agentes.map(
            (a) =>
              new TableRow({
                children: [a.nome, a.matricula, a.funcao, a.chegada, a.observacao].map(
                  (t, i) =>
                    new TableCell({
                      borders: bordas,
                      margins: margensCelula,
                      width: { size: larguraAgentes[i]!, type: WidthType.DXA },
                      children: [paragrafo(t)],
                    }),
                ),
              }),
          ),
        ],
      })
    : paragrafo("Nenhum agente designado.");

  const larguraOrient = [4000, 1800, 3226];
  const tabelaOrientadores = conteudo.orientadores.length
    ? new Table({
        width: { size: larguraTotal, type: WidthType.DXA },
        columnWidths: larguraOrient,
        rows: [
          new TableRow({
            children: ["Orientador", "Matrícula", "Observação"].map(
              (t, i) =>
                new TableCell({
                  borders: bordas,
                  margins: margensCelula,
                  width: { size: larguraOrient[i]!, type: WidthType.DXA },
                  shading: { fill: "EEF2F7", type: ShadingType.CLEAR },
                  children: [paragrafo(t, true)],
                }),
            ),
          }),
          ...conteudo.orientadores.map(
            (r) =>
              new TableRow({
                children: [r.nome, r.matricula, r.observacao].map(
                  (t, i) =>
                    new TableCell({
                      borders: bordas,
                      margins: margensCelula,
                      width: { size: larguraOrient[i]!, type: WidthType.DXA },
                      children: [paragrafo(t)],
                    }),
                ),
              }),
          ),
        ],
      })
    : paragrafo("Nenhum orientador designado.");

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 20 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          ...cabecalhoLogo,
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: ident.orgao, bold: true, size: 26 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: ident.secretaria, size: 22 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 240 },
            children: [
              new TextRun({
                text: `ORDEM DE SERVIÇO Nº ${conteudo.numero}`,
                bold: true,
                size: 28,
              }),
            ],
          }),
          secao("Identificação"),
          tabelaCampos(conteudo.cabecalho),
          secao("Dados do serviço"),
          tabelaCampos(conteudo.corpo),
          secao("Agentes de trânsito"),
          tabelaAgentes,
          secao("Orientadores"),
          tabelaOrientadores,
          secao("Observações"),
          ...conteudo.observacoes.split("\n").map((l) => paragrafo(l)),
          new Paragraph({ spacing: { before: 900 }, children: [] }),
          new Table({
            width: { size: larguraTotal, type: WidthType.DXA },
            columnWidths: [4513, 4513],
            rows: [
              new TableRow({
                children: ["Responsável pela emissão", "Autoridade de trânsito"].map(
                  (t) =>
                    new TableCell({
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                      },
                      margins: margensCelula,
                      width: { size: 4513, type: WidthType.DXA },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: t, size: 18 })],
                        }),
                      ],
                    }),
                ),
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  baixar(blob, nomeArquivo(conteudo.numero, "docx"));
}
