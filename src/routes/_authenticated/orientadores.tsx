import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/orientadores")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Orientadores | SESTRAN Paranavaí" },
      { name: "description", content: "Cadastro dos orientadores de trânsito e das equipes de apoio." },
      { property: "og:title", content: "Orientadores | SESTRAN Paranavaí" },
      { property: "og:description", content: "Cadastro dos orientadores de trânsito e das equipes de apoio." },
    ],
  }),
  component: () => (
    <EmBreve
      titulo="Orientadores"
      descricao="Cadastro dos orientadores de trânsito e das equipes de apoio."
      itens={["Cadastro com matrícula e contato", "Ativação e inativação", "Participação em ações educativas"]}
    />
  ),
});
