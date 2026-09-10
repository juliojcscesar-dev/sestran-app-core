import { obterConfiguracoes, obterOrdem } from "@/lib/os-api";
import { gerarDocx, gerarPdf } from "@/lib/os-documento";

/** Gera e baixa o documento da O.S. buscando os dados completos e a identificação do órgão. */
export async function baixarDocumentoOS(id: string, formato: "pdf" | "docx") {
  const [dados, ident] = await Promise.all([obterOrdem(id), obterConfiguracoes()]);
  if (formato === "pdf") await gerarPdf(dados, ident);
  else await gerarDocx(dados, ident);
}
