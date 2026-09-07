import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/agentes")({
  head: () => ({
    meta: [
      { title: "Agentes de Trânsito | SESTRAN Paranavaí" },
      { name: "description", content: "Cadastro dos agentes de trânsito e controle de situação." },
      { property: "og:title", content: "Agentes de Trânsito | SESTRAN Paranavaí" },
      { property: "og:description", content: "Cadastro dos agentes de trânsito e controle de situação." },
    ],
  }),
  component: () => (
    <EmBreve
      titulo="Agentes de Trânsito"
      descricao="Cadastro dos agentes de trânsito e controle de situação."
      itens={["Cadastro com matrícula e contato", "Ativação e inativação", "Histórico de alocações"]}
    />
  ),
});
