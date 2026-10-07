import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/escolas")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Escolas | SESTRAN Paranavaí" },
      { name: "description", content: "Cadastro das escolas atendidas pelas ações de educação no trânsito." },
      { property: "og:title", content: "Escolas | SESTRAN Paranavaí" },
      { property: "og:description", content: "Cadastro das escolas atendidas pelas ações de educação no trânsito." },
    ],
  }),
  component: () => (
    <EmBreve
      titulo="Escolas"
      descricao="Cadastro das escolas atendidas pelas ações de educação no trânsito."
      itens={["Cadastro por rede de ensino", "Endereço, direção e contato", "Ações educativas realizadas"]}
    />
  ),
});
