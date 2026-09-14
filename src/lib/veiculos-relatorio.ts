import { jsPDF } from "jspdf";
import { descricaoVeiculo, statusEfetivo, STATUS_VEICULO_LABEL } from "@/lib/veiculos";
import type { VeiculoLista } from "@/lib/veiculos-api";

export function gerarRelatorioVeiculos(veiculos: VeiculoLista[], periodo: { de?: string; ate?: string }) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(14); pdf.text("PREFEITURA MUNICIPAL DE PARANAVAÍ", 15, 17);
  pdf.setFontSize(11); pdf.text("SESTRAN — Relatório de Veículos Abandonados", 15, 24);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.text(`Período: ${periodo.de || "início"} a ${periodo.ate || "hoje"}  |  Registros: ${veiculos.length}`, 15, 31);
  let y = 41;
  for (const v of veiculos) {
    if (y > 275) { pdf.addPage(); y = 18; }
    pdf.setFont("helvetica", "bold"); pdf.text(`${v.placa || "SEM PLACA"} — ${descricaoVeiculo(v)}`, 15, y);
    pdf.setFont("helvetica", "normal"); pdf.text(`${STATUS_VEICULO_LABEL[statusEfetivo(v)]} | ${v.endereco}${v.bairro ? ` — ${v.bairro}` : ""}`, 15, y + 5, { maxWidth: 180 });
    pdf.text(`Constatação: ${new Date(`${v.data_constatacao}T12:00:00`).toLocaleDateString("pt-BR")} | Prazo: ${v.prazo_recolhimento ? new Date(`${v.prazo_recolhimento}T12:00:00`).toLocaleDateString("pt-BR") : "—"}`, 15, y + 10);
    pdf.setDrawColor(210); pdf.line(15, y + 14, 195, y + 14); y += 19;
  }
  pdf.save(`veiculos-abandonados-${new Date().toISOString().slice(0,10)}.pdf`);
}