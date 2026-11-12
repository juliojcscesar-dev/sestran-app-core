/* Documento da O.S. de Sinalização Viária — segue o modelo oficial (A4, bordas arredondadas em azul-claro).
   O mesmo modelo é usado na visualização (HTML), no PDF e no DOCX. Observações/imagens só aparecem quando usadas. */

export type DadosSinalizacao = {
  pedido: string; numero: string; numero_pedido: string | null; data: string; status: string; natureza: string; endereco: string; servico: string;
  funcionario: string | null; observacao: string | null; preenchido: string | null; chefe_imediato: string | null; cargo: string | null; imagens: string[];
};

const LOGO = "/assets/logo-header.png";
const AZUL_BORDA = "#71c5df";
const AZUL_TITULO = "#335b8f";
const TEXTO = "#1d1d1f";

export function dataModelo(s: string) {
  const [y, m, d] = (s ?? "").split("-");
  return y && m && d ? `${d} / ${m} / ${y}` : "";
}
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
export const temObservacoes = (o: DadosSinalizacao) => !!(o.observacao?.trim() || o.imagens.length);

function nomeArquivo(o: DadosSinalizacao) {
  return `os_sinalizacao_${(o.numero || "sem_numero").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_")}`;
}
function baixar(blob: Blob, nome: string) {
  const a = document.createElement("a"); const u = URL.createObjectURL(blob);
  a.href = u; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 1500);
}

/* ---------------- Visualização / impressão (HTML A4) ---------------- */
export function htmlSinalizacao(o: DadosSinalizacao) {
  const caixa = (rotulo: string, valor: string, estilo: string, centro = false) =>
    `<div class="box" style="${estilo}"><div class="l">${esc(rotulo)}</div><div class="v${centro ? " c" : ""}">${esc(valor)}</div></div>`;
  const fotos = o.imagens.map((s) => `<img src="${s}" alt="">`).join("");
  const obs = temObservacoes(o)
    ? `<div class="box obs"><div class="l" style="text-align:center;margin:0">OBSERVAÇÕES / IMAGENS</div>${o.observacao?.trim() ? `<div class="v c" style="margin-top:20pt">${esc(o.observacao)}</div>` : ""}${fotos ? `<div class="fotos n${o.imagens.length}">${fotos}</div>` : ""}</div>`
    : "";
  const assinatura = o.chefe_imediato || o.cargo
    ? `<div class="ass"><div class="linha"></div>${o.chefe_imediato ? `<div>${esc(o.chefe_imediato)}</div>` : ""}${o.cargo ? `<div><b>${esc(o.cargo)}</b></div>` : ""}</div>` : "";
  const linha1 = o.numero_pedido?.trim()
    ? `<div class="row">${caixa("PEDIDO:", o.pedido, "width:24%", true)}${caixa("Nº DO PEDIDO:", o.numero_pedido, "width:24%", true)}${caixa("Nº DA O. S.", o.numero, "width:24%", true)}${caixa("DATA:", dataModelo(o.data), "width:24%", true)}</div>`
    : `<div class="row">${caixa("PEDIDO:", o.pedido, "width:33%", true)}${caixa("Nº DA O. S.", o.numero, "width:30%", true)}${caixa("DATA:", dataModelo(o.data), "width:30%", true)}</div>`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Ordem de Serviço ${esc(o.numero)}</title><style>
@page{size:A4;margin:0}*{box-sizing:border-box}html,body{margin:0;background:#e9edf2}
body{font-family:"Open Sans",Arial,Helvetica,sans-serif;color:${TEXTO}}
.folha{width:210mm;min-height:297mm;margin:12px auto;background:#fff;padding:6.5mm 7mm;box-shadow:0 2px 10px rgba(0,0,0,.15)}
.moldura{border:1.5pt solid ${AZUL_BORDA};border-radius:12pt;min-height:284mm;padding:14pt 14pt 10pt;display:flex;flex-direction:column}
.topo{text-align:center}.topo img{width:420pt;max-width:100%}
.d1{font:bold 8.5pt Arial,sans-serif;margin-top:6pt}.d2{font:8.5pt Arial,sans-serif}
.sep{border-top:1.5pt solid ${AZUL_BORDA};margin:8pt -14pt}
h1{font:bold 13pt Arial,sans-serif;color:${AZUL_TITULO};margin:6pt 0 4pt;text-align:center}
.row{display:flex;justify-content:space-between;align-items:stretch;margin-bottom:10pt;gap:14pt}
.box{border:1.5pt solid ${AZUL_BORDA};border-radius:7pt;padding:4pt 8pt 5pt;min-height:41pt}
.l{font:bold 7pt Arial,sans-serif;margin-left:4pt}.v{font-size:11pt;margin-top:2pt;white-space:pre-wrap;word-break:break-word}.c{text-align:center}
.full{width:100%}.obs{width:100%;min-height:250pt;margin-bottom:18pt}
.fotos{display:flex;flex-wrap:wrap;gap:8pt;justify-content:center;margin-top:8pt}.fotos img{object-fit:contain;max-height:180pt;max-width:48%}.fotos.n3 img,.fotos.n4 img{max-width:23%;max-height:140pt}.fotos.n1 img{max-width:80%;max-height:230pt}
.espaco{flex:1}.ass{text-align:center;font:8.5pt Arial,sans-serif;margin-top:30pt}.linha{border-top:1pt solid #333;width:228pt;margin:0 auto 4pt}
.pre{font:7.5pt Arial,sans-serif;margin:14pt 0 0 6pt}
.acoes{text-align:center;margin:10px}.acoes button{padding:9px 16px;font-size:14px}
@media print{html,body{background:#fff}.folha{margin:0;box-shadow:none}.acoes{display:none}}
</style></head><body>
<div class="acoes"><button onclick="window.print()">Imprimir / Salvar PDF</button></div>
<div class="folha"><div class="moldura">
<div class="topo"><img src="${LOGO}" alt="Prefeitura de Paranavaí — Secretaria Municipal de Segurança e Trânsito"><div class="d1">DITRAN - DIRETORIA DE TRÂNSITO</div><div class="d2">DEPARTAMENTO TÉCNICO DE SINALIZAÇÃO VIÁRIA</div></div><div class="sep"></div><h1>ORDEM DE SERVIÇO - ${esc(o.numero)}</h1><div class="sep" style="margin-bottom:12pt"></div>
${linha1}
<div class="row">${caixa("FUNCINÁRIO(S):", o.funcionario || "", "width:29%", true)}${caixa("NATUREZA:", o.natureza, "width:38%", true)}${caixa("SITUAÇÃO:", o.status, "width:26%", true)}</div>
<div class="row">${caixa("ENDEREÇO:", o.endereco, "", true).replace('class="box"', 'class="box full"')}</div>
<div class="row"><div class="box full"><span class="l">SERVIÇO:</span> <span class="v">${esc(o.servico)}</span></div></div>
${obs ? `<div class="sep" style="margin:6pt -14pt 12pt"></div>${obs}` : ""}<div class="espaco"></div>${assinatura}
<div class="pre">Preenchimento: <b>${esc(o.preenchido || "")}</b></div>
</div></div></body></html>`;
}

/* ---------------- PDF (jsPDF, A4 em pontos) ---------------- */
async function bytes(url: string) {
  const r = await fetch(url); if (!r.ok) throw new Error("Logo indisponível.");
  return new Uint8Array(await r.arrayBuffer());
}

export async function gerarPdfSinalizacao(o: DadosSinalizacao) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = 595.28, H = 841.89, X = 33, LARG = 533;
  const borda = () => { doc.setDrawColor(AZUL_BORDA); doc.setLineWidth(1.5); };
  borda(); doc.roundedRect(19, 18, W - 38, H - 36, 12, 12, "S");
  try { doc.addImage(await bytes(LOGO), "PNG", (W - 420) / 2, 34, 420, 420 * 152 / 1001); } catch { /* segue sem logo */ }
  doc.setTextColor(TEXTO);
  doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.text("DITRAN - DIRETORIA DE TRÂNSITO", W / 2, 117, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.text("DEPARTAMENTO TÉCNICO DE SINALIZAÇÃO VIÁRIA", W / 2, 128, { align: "center" });
  const sep = (yy: number) => { borda(); doc.line(19, yy, W - 19, yy); };
  sep(138);
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(AZUL_TITULO);
  doc.text(`ORDEM DE SERVIÇO - ${o.numero}`, W / 2, 157, { align: "center" });
  sep(168);

  const caixa = (rotulo: string, valor: string, x: number, y: number, w: number, centro = false, hMin = 41) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    const linhas = doc.splitTextToSize(valor || "", w - 20) as string[];
    const h = Math.max(hMin, 24 + linhas.length * 13);
    borda(); doc.roundedRect(x, y, w, h, 7, 7, "S");
    doc.setTextColor(TEXTO); doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.text(rotulo, x + 12, y + 11);
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    linhas.forEach((l, i) => doc.text(l, centro ? x + w / 2 : x + 10, y + 26 + i * 13, { align: centro ? "center" : "left" }));
    return y + h;
  };
  let y = (o.numero_pedido?.trim()
    ? Math.max(caixa("PEDIDO:", o.pedido, X, 182, 122, true), caixa("Nº DO PEDIDO:", o.numero_pedido, 169, 182, 122, true), caixa("Nº DA O. S.", o.numero, 305, 182, 122, true), caixa("DATA:", dataModelo(o.data), 441, 182, 122, true))
    : Math.max(caixa("PEDIDO:", o.pedido, X, 182, 175, true), caixa("Nº DA O. S.", o.numero, 222, 182, 160, true), caixa("DATA:", dataModelo(o.data), 398, 182, 168, true))) + 10;
  y = Math.max(caixa("FUNCINÁRIO(S):", o.funcionario || "", X, y, 155, true), caixa("NATUREZA:", o.natureza, 200, y, 205, true), caixa("SITUAÇÃO:", o.status, 421, y, 145, true)) + 10;
  y = caixa("ENDEREÇO:", o.endereco, X, y, LARG, true) + 10;
  { doc.setFont("helvetica", "bold"); doc.setFontSize(7); const wl = doc.getTextWidth("SERVIÇO: ");
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    const ls = doc.splitTextToSize(o.servico || "", LARG - 24 - wl) as string[];
    const h = Math.max(48, 18 + ls.length * 14);
    borda(); doc.roundedRect(X, y, LARG, h, 7, 7, "S"); doc.setTextColor(TEXTO);
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.text("SERVIÇO:", X + 8, y + 15);
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    ls.forEach((l, i) => doc.text(l, X + 10 + wl, y + 16 + i * 14));
    y += h + 10; }

  if (temObservacoes(o)) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    const linhas = o.observacao?.trim() ? (doc.splitTextToSize(o.observacao.trim(), LARG - 24) as string[]) : [];
    const n = o.imagens.length;
    const maxH = n === 1 ? 230 : n === 2 ? 180 : 140;
    const cel = n ? (LARG - 30 - (n - 1) * 8) / n : 0;
    const dims = o.imagens.map((s) => {
      try { const p = doc.getImageProperties(s); const k = Math.min(cel / p.width, maxH / p.height); return { w: p.width * k, h: p.height * k }; }
      catch { return { w: 0, h: 0 }; }
    });
    const altImgs = n ? Math.max(...dims.map((d) => d.h)) + 10 : 0;
    sep(y); y += 12;
    const h = Math.max(250, 44 + linhas.length * 13 + altImgs + 8);
    borda(); doc.roundedRect(X, y, LARG, h, 7, 7, "S");
    doc.setTextColor(TEXTO); doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.text("OBSERVAÇÕES / IMAGENS", X + LARG / 2, y + 13, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    linhas.forEach((l, i) => doc.text(l, X + LARG / 2, y + 44 + i * 13, { align: "center" }));
    const yImg = y + 40 + linhas.length * 13 + 6;
    const total = dims.reduce((s, d) => s + d.w, 0) + (n - 1) * 8;
    let xi = X + (LARG - total) / 2;
    o.imagens.forEach((s, i) => {
      const d = dims[i]; if (!d?.w) return;
      try { doc.addImage(s, s.startsWith("data:image/png") ? "PNG" : "JPEG", xi, yImg, d.w, d.h); } catch { /* imagem inválida */ }
      xi += d.w + 8;
    });
    y += h;
  }

  doc.setTextColor(TEXTO); doc.setFontSize(8.5);
  if (o.chefe_imediato || o.cargo) {
    const ya = Math.max(760, y + 40);
    doc.setDrawColor("#333333"); doc.setLineWidth(0.8); doc.line(177, ya, 405, ya);
    if (o.chefe_imediato) { doc.setFont("helvetica", "normal"); doc.text(o.chefe_imediato, W / 2, ya + 12, { align: "center" }); }
    if (o.cargo) { doc.setFont("helvetica", "bold"); doc.text(o.cargo, W / 2, ya + 24, { align: "center" }); }
  }
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.text("Preenchimento:", 38, 806);
  doc.setFont("helvetica", "bold"); doc.text(o.preenchido || "", 38 + doc.getTextWidth("Preenchimento: "), 806);
  doc.save(`${nomeArquivo(o)}.pdf`);
}

/* ---------------- DOCX ---------------- */
function dataUrlBytes(s: string) {
  const b = atob(s.split(",")[1] ?? ""); const u = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u;
}
function tamanhoImagem(s: string) {
  return new Promise<{ w: number; h: number }>((res) => {
    const i = new Image(); i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight }); i.onerror = () => res({ w: 0, h: 0 }); i.src = s;
  });
}

export async function gerarDocxSinalizacao(o: DadosSinalizacao) {
  const d = await import("docx");
  const cor = AZUL_BORDA.slice(1).toUpperCase();
  const B = { style: d.BorderStyle.SINGLE, size: 12, color: cor };
  const N = { style: d.BorderStyle.NIL, size: 0, color: "FFFFFF" };
  const comBorda = { top: B, bottom: B, left: B, right: B };
  const semBorda = { top: N, bottom: N, left: N, right: N };
  const t = (text: string, o2: { bold?: boolean; size?: number; color?: string } = {}) =>
    new d.TextRun({ text, font: "Arial", size: Math.round((o2.size ?? 11) * 2), ...(o2.bold ? { bold: true } : {}), ...(o2.color ? { color: o2.color } : {}) });
  const p = (runs: InstanceType<typeof d.TextRun>[] | InstanceType<typeof d.ImageRun>[], al: (typeof d.AlignmentType)[keyof typeof d.AlignmentType] = d.AlignmentType.LEFT, after = 0) =>
    new d.Paragraph({ alignment: al, spacing: { before: 0, after }, children: runs });
  const multilinha = (texto: string, centro = false) =>
    (texto || " ").split("\n").map((l) => p([t(l || " ")], centro ? d.AlignmentType.CENTER : d.AlignmentType.LEFT));
  const celula = (rotulo: string, valor: string, largura: number, centro = false, extras: InstanceType<typeof d.Paragraph>[] = []) =>
    new d.TableCell({ width: { size: largura, type: d.WidthType.DXA }, borders: comBorda, margins: { top: 60, bottom: 100, left: 140, right: 140 },
      children: [p([t(rotulo, { bold: true, size: 7 })]), ...multilinha(valor, centro), ...extras] });
  const vazio = (largura: number) => new d.TableCell({ width: { size: largura, type: d.WidthType.DXA }, borders: semBorda, children: [p([t("")])] });
  const tabela = (celulas: InstanceType<typeof d.TableCell>[]) => new d.Table({ width: { size: 10600, type: d.WidthType.DXA }, borders: { ...semBorda, insideHorizontal: N, insideVertical: N },
    layout: d.TableLayoutType.FIXED, rows: [new d.TableRow({ children: celulas })] });
  const espaco = (pt: number) => new d.Paragraph({ spacing: { before: 0, after: 0, line: pt * 20, lineRule: d.LineRuleType.EXACT }, children: [] });

  const filhos: (InstanceType<typeof d.Paragraph> | InstanceType<typeof d.Table>)[] = [];
  try {
    const logo = await bytes(LOGO);
    filhos.push(p([new d.ImageRun({ type: "png", data: logo, transformation: { width: 560, height: Math.round(560 * 152 / 1001) } })], d.AlignmentType.CENTER, 80));
  } catch { /* sem logo */ }
  filhos.push(p([t("DITRAN - DIRETORIA DE TRÂNSITO", { bold: true, size: 8.5 })], d.AlignmentType.CENTER));
  const linhaSep = (antes: number, depois: number) => new d.Paragraph({ spacing: { before: antes, after: depois }, border: { bottom: { style: d.BorderStyle.SINGLE, size: 12, color: cor, space: 1 } }, children: [] });
  filhos.push(p([t("DEPARTAMENTO TÉCNICO DE SINALIZAÇÃO VIÁRIA", { size: 8.5 })], d.AlignmentType.CENTER));
  filhos.push(linhaSep(60, 120));
  filhos.push(p([t(`ORDEM DE SERVIÇO - ${o.numero}`, { bold: true, size: 13, color: AZUL_TITULO.slice(1) })], d.AlignmentType.CENTER));
  filhos.push(linhaSep(0, 240));
  filhos.push(o.numero_pedido?.trim()
    ? tabela([celula("PEDIDO:", o.pedido, 2462, true), vazio(250), celula("Nº DO PEDIDO:", o.numero_pedido, 2462, true), vazio(250), celula("Nº DA O. S.", o.numero, 2462, true), vazio(250), celula("DATA:", dataModelo(o.data), 2464, true)])
    : tabela([celula("PEDIDO:", o.pedido, 3500, true), vazio(250), celula("Nº DA O. S.", o.numero, 3250, true), vazio(250), celula("DATA:", dataModelo(o.data), 3350, true)]), espaco(10));
  filhos.push(tabela([celula("FUNCINÁRIO(S):", o.funcionario || "", 3000, true), vazio(250), celula("NATUREZA:", o.natureza, 4300, true), vazio(250), celula("SITUAÇÃO:", o.status, 2800, true)]), espaco(10));
  filhos.push(tabela([celula("ENDEREÇO:", o.endereco, 10600, true)]), espaco(10));
  filhos.push(tabela([new d.TableCell({ width: { size: 10600, type: d.WidthType.DXA }, borders: comBorda, margins: { top: 80, bottom: 160, left: 140, right: 140 },
    children: (o.servico || " ").split("\n").map((l, i) => p(i ? [t(l || " ")] : [t("SERVIÇO:  ", { bold: true, size: 7 }), t(l || " ")])) })]), espaco(10));

  if (temObservacoes(o)) {
    const extras: InstanceType<typeof d.Paragraph>[] = [];
    const n = o.imagens.length;
    if (n) {
      const maxW = n === 1 ? 420 : n === 2 ? 320 : 155, maxH = n === 1 ? 300 : n === 2 ? 240 : 185;
      const runs: InstanceType<typeof d.ImageRun>[] = [];
      for (const s of o.imagens) {
        const { w, h } = await tamanhoImagem(s); if (!w) continue;
        const k = Math.min(maxW / w, maxH / h);
        runs.push(new d.ImageRun({ type: s.startsWith("data:image/png") ? "png" : "jpg", data: dataUrlBytes(s), transformation: { width: Math.round(w * k), height: Math.round(h * k) } }));
      }
      extras.push(new d.Paragraph({ alignment: d.AlignmentType.CENTER, spacing: { before: 120 }, children: runs.flatMap((r, i) => (i ? [new d.TextRun("   "), r] : [r])) }));
    }
    filhos.push(linhaSep(0, 200));
    const cel = new d.TableCell({ width: { size: 10600, type: d.WidthType.DXA }, borders: comBorda, margins: { top: 60, bottom: 160, left: 140, right: 140 },
      children: [p([t("OBSERVAÇÕES / IMAGENS", { bold: true, size: 7 })], d.AlignmentType.CENTER, 300), ...(o.observacao?.trim() ? multilinha(o.observacao.trim(), true) : []), ...extras] });
    filhos.push(new d.Table({ width: { size: 10600, type: d.WidthType.DXA }, layout: d.TableLayoutType.FIXED, rows: [new d.TableRow({ height: { value: 5000, rule: d.HeightRule.ATLEAST }, children: [cel] })] }));
  }
  if (o.chefe_imediato || o.cargo) {
    filhos.push(new d.Paragraph({ alignment: d.AlignmentType.CENTER, spacing: { before: 900, after: 0 }, children: [t("_______________________________________________", { size: 8.5 })] }));
    if (o.chefe_imediato) filhos.push(p([t(o.chefe_imediato, { size: 8.5 })], d.AlignmentType.CENTER));
    if (o.cargo) filhos.push(p([t(o.cargo, { bold: true, size: 8.5 })], d.AlignmentType.CENTER));
  }
  filhos.push(new d.Paragraph({ spacing: { before: 300 }, children: [t("Preenchimento: ", { size: 7.5 }), t(o.preenchido || "", { bold: true, size: 7.5 })] }));

  const bordaPagina = { style: d.BorderStyle.SINGLE, size: 12, color: cor, space: 14 };
  const documento = new d.Document({ sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 700, right: 650, bottom: 600, left: 650, header: 0, footer: 0 },
      borders: { pageBorders: { display: d.PageBorderDisplay.ALL_PAGES, offsetFrom: d.PageBorderOffsetFrom.PAGE, zOrder: d.PageBorderZOrder.FRONT },
        pageBorderTop: { ...bordaPagina, space: 20 }, pageBorderBottom: { ...bordaPagina, space: 20 }, pageBorderLeft: { ...bordaPagina, space: 20 }, pageBorderRight: { ...bordaPagina, space: 20 } } } },
    children: filhos,
  }] });
  baixar(await d.Packer.toBlob(documento), `${nomeArquivo(o)}.docx`);
}
