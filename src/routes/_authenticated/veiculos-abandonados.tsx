import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/veiculos-abandonados")({
  head: () => ({
    meta: [
      { title: "Veículos Abandonados | SESTRAN Paranavaí" },
      { name: "description", content: "Registro e acompanhamento de veículos abandonados em vias públicas." },
      { property: "og:title", content: "Veículos Abandonados | SESTRAN Paranavaí" },
      { property: "og:description", content: "Registro e acompanhamento de veículos abandonados em vias públicas." },
    ],
  }),
  component: () => (
    <EmBreve
      titulo="Veículos Abandonados"
      descricao="Registro e acompanhamento de veículos abandonados em vias públicas."
      itens={["Registro com placa, endereço e data da constatação", "Notificação e remoção", "Situação de cada ocorrência"]}
    />
  ),
});
