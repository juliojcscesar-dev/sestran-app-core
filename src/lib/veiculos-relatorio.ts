import { jsPDF } from "jspdf";
import { descricaoVeiculo, statusEfetivo, STATUS_VEICULO_LABEL } from "@/lib/veiculos";
import type { VeiculoLista } from "@/lib/veiculos-api";

async function carregarLogo() {
  const resposta = await fetch("/assets/logo-header.png");
  if (!resposta.ok) return null;
  const blob = await resposta.blob();
  return new Promise<string>((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = reject;
    leitor.readAsDataURL(blob);
  });
}

export async function gerarRelatorioVeiculos(veiculos: VeiculoLista[], periodo: { de?: string; ate?: string }) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await carregarLogo().catch(() => null);
  const desenharCabecalho = () => {
    if (logo) pdf.addImage(logo, "PNG", 72.5, 9, 65, 10);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(11); pdf.text("RELATÓRIO DE VEÍCULOS ABANDONADOS", 105, 26, { align: "center" });
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.text(`Período: ${periodo.de || "início"} a ${periodo.ate || "hoje"}  |  Registros: ${veiculos.length}`, 105, 32, { align: "center" });
    pdf.setDrawColor(120); pdf.line(15, 36, 195, 36);
  };
  desenharCabecalho();
  let y = 44;
  for (const v of veiculos) {
    if (y > 275) { pdf.addPage(); desenharCabecalho(); y = 44; }
    pdf.setFont("helvetica", "bold"); pdf.text(`${v.placa || "SEM PLACA"} — ${descricaoVeiculo(v)}`, 15, y);
    pdf.setFont("helvetica", "normal"); pdf.text(`${(STATUS_VEICULO_LABEL[statusEfetivo(v)] ?? String(statusEfetivo(v)))} | ${v.endereco}${v.bairro ? ` — ${v.bairro}` : ""}`, 15, y + 5, { maxWidth: 180 });
    pdf.text(`Constatação: ${new Date(`${v.data_constatacao}T12:00:00`).toLocaleDateString("pt-BR")} | Prazo: ${v.prazo_recolhimento ? new Date(`${v.prazo_recolhimento}T12:00:00`).toLocaleDateString("pt-BR") : "—"}`, 15, y + 10);
    pdf.setDrawColor(210); pdf.line(15, y + 14, 195, y + 14); y += 19;
  }
  pdf.save(`veiculos-abandonados-${new Date().toISOString().slice(0,10)}.pdf`);
}