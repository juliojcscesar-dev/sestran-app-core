import * as XLSX from "xlsx";
import type { DadosVeiculo } from "@/lib/veiculos-api";
import type { SituacaoVeiculo } from "@/lib/veiculos";

export type LinhaImportacao = {
  numero: string;
  dados: DadosVeiculo;
  resumo: string;
  aviso?: string;
};

/** Converte data do Excel (número serial, Date ou texto dd/mm/aaaa) para ISO. */
function dataIso(valor: unknown): string | null {
  if (valor == null || valor === "") return null;
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    const m = String(valor.getMonth() + 1).padStart(2, "0");
    const d = String(valor.getDate()).padStart(2, "0");
    return `${valor.getFullYear()}-${m}-${d}`;
  }
  if (typeof valor === "number" && valor > 20000 && valor < 80000) {
    const base = new Date(Date.UTC(1899, 11, 30));
    const dt = new Date(base.getTime() + valor * 86_400_000);
    const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dt.getUTCDate()).padStart(2, "0");
    return `${dt.getUTCFullYear()}-${m}-${d}`;
  }
  const texto = String(valor).trim();
  const m = texto.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (m) {
    const ano = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${ano}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return null;
}

/** Separa "VW/GOL - DEH 4775" em marca, modelo e placa. */
function separarVeiculo(texto: string): { marca: string | null; modelo: string | null; placa: string | null } {
  const limpo = texto.replace(/\s+/g, " ").trim();
  const placaMatch = limpo.match(/[A-Z]{3}\s?-?\s?[0-9][A-Z0-9][0-9]{2}/i);
  const placa = placaMatch ? placaMatch[0].toUpperCase().replace(/[\s-]+/g, "").replace(/^([A-Z]{3})(.+)$/, "$1-$2") : null;
  const semPlaca = placaMatch ? limpo.replace(placaMatch[0], "").replace(/[-–—\s]+$/, "").trim() : limpo;
  const partes = semPlaca.split("/").map((p) => p.trim()).filter(Boolean);
  const marca = partes[0] ?? null;
  const modelo = partes.length > 1 ? partes.slice(1).join(" / ") : null;
  return { marca, modelo, placa };
}

/** Interpreta a coluna de situação da planilha. */
function situacaoDe(texto: string): { situacao: SituacaoVeiculo | null; observacao: string | null } {
  const t = texto.toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  if (t.startsWith("RETIRADO")) return { situacao: "RETIRADO", observacao: null };
  if (t.startsWith("RECOLHIDO")) return { situacao: "RECOLHIDO", observacao: null };
  if (t.startsWith("RECOLHER")) return { situacao: "NOTIFICADO", observacao: null }; // prazo vencido → "A recolher" automático
  if (t.startsWith("RETORNO")) return { situacao: "OUTROS", observacao: "Retorno" };
  if (t.startsWith("NOTIFICADO")) return { situacao: "NOTIFICADO", observacao: null };
  if (t.startsWith("NAO ESTA ABANDONADO")) return { situacao: "NAO_ABANDONADO", observacao: null };
  if (t.startsWith("DENTRO DE TERRENO")) return { situacao: "TERRENO", observacao: null };
  if (!t) return { situacao: null, observacao: null };
  return { situacao: "OUTROS", observacao: texto.trim() };
}

function textoCelula(valor: unknown): string {
  if (valor == null) return "";
  return String(valor).replace(/\s+/g, " ").trim();
}

/**
 * Lê a planilha de veículos abandonados (modelo da Secretaria) e devolve as
 * linhas prontas para prévia e cadastro. O arquivo não é armazenado.
 */
export async function lerPlanilhaVeiculos(arquivo: File): Promise<LinhaImportacao[]> {
  const buffer = await arquivo.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const grade = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null });

  // Localiza a linha de cabeçalho pela célula "Nº" e mapeia as colunas pelo título.
  let cabecalho = -1;
  let col: Record<string, number> = {};
  for (let i = 0; i < Math.min(grade.length, 20); i++) {
    const linha = (grade[i] ?? []).map((c) => textoCelula(c).toUpperCase());
    const idxNum = linha.findIndex((c) => c === "Nº" || c === "NO" || c === "N°");
    if (idxNum >= 0) {
      cabecalho = i;
      col = {
        numero: idxNum,
        verificacao: linha.findIndex((c) => c.includes("VERIFICA")),
        notificacao: linha.findIndex((c) => c.includes("NOTIFICA")),
        recolhimento: linha.findIndex((c) => c.includes("RECOLHIMENTO")),
        bairro: linha.findIndex((c) => c === "BAIRRO" || c.startsWith("BAIRRO")),
        endereco: linha.findIndex((c) => c.startsWith("ENDERE")),
        veiculo: linha.findIndex((c) => c.includes("MARCA") || c.includes("MODELO") || c.includes("CHASSI")),
        situacao: linha.findIndex((c) => c.includes("RECOLHIDO/DATA") || c.includes("SITUA")),
      };
      break;
    }
  }
  if (cabecalho < 0 || col.veiculo == null || col.veiculo < 0) {
    throw new Error("Não encontrei o cabeçalho da planilha. Use o modelo com as colunas Nº, Data de verificação, Bairro, Endereço e Marca/Modelo/Placa/Chassi.");
  }

  const linhas: LinhaImportacao[] = [];
  for (let i = cabecalho + 1; i < grade.length; i++) {
    const r = grade[i] ?? [];
    const pegar = (c: number | undefined) => (c != null && c >= 0 ? r[c] : null);
    const endereco = textoCelula(pegar(col.endereco));
    const veiculoTxt = textoCelula(pegar(col.veiculo));
    const bairro = textoCelula(pegar(col.bairro));
    if (!endereco && !veiculoTxt && !bairro) continue; // linha em branco

    const { marca, modelo, placa } = separarVeiculo(veiculoTxt);
    const verificacao = dataIso(pegar(col.verificacao));
    const notificacao = dataIso(pegar(col.notificacao));
    const recolhimento = dataIso(pegar(col.recolhimento));
    const { situacao, observacao } = situacaoDe(textoCelula(pegar(col.situacao)));

    const aviso = !endereco ? "Sem endereço" : !verificacao ? "Sem data de verificação" : undefined;
    linhas.push({
      numero: textoCelula(pegar(col.numero)) || String(linhas.length + 1),
      dados: {
        situacao,
        placa,
        chassi: null,
        marca,
        modelo,
        cor: null,
        endereco: endereco || "Endereço não informado",
        bairro: bairro || null,
        tipo_denuncia: "INFORMAL",
        numero_denuncia: null,
        data_constatacao: verificacao ?? notificacao ?? new Date().toISOString().slice(0, 10),
        data_verificacao: verificacao,
        data_notificacao: notificacao,
        data_recolhimento: situacao === "RECOLHIDO" ? recolhimento : null,
        data_retirada: null,
        observacoes: observacao,
        latitude: null,
        longitude: null,
        bairro_id: null,
        rua_id: null,
      },
      resumo: `${veiculoTxt || "Veículo não identificado"} — ${endereco || "sem endereço"}`,
      aviso,
    });
  }
  if (linhas.length === 0) throw new Error("A planilha não tem nenhum veículo preenchido.");
  return linhas;
}
