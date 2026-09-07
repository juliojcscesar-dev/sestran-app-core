import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/solicitantes")({
  head: () => ({
    meta: [
      { title: "Solicitantes | SESTRAN Paranavaí" },
      { name: "description", content: "Cadastro de órgãos, empresas, entidades e cidadãos que solicitam serviços." },
      { property: "og:title", content: "Solicitantes | SESTRAN Paranavaí" },
      { property: "og:description", content: "Cadastro de órgãos, empresas, entidades e cidadãos que solicitam serviços." },
    ],
  }),
  component: () => (
    <EmBreve
      titulo="Solicitantes"
      descricao="Cadastro de órgãos, empresas, entidades e cidadãos que solicitam serviços."
      itens={["Cadastro por tipo de solicitante", "Documento e dados de contato", "Solicitações vinculadas"]}
    />
  ),
});
