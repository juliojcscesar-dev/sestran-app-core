import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/educacao-transito")({
  head: () => ({
    meta: [
      { title: "Educação no Trânsito | SESTRAN Paranavaí" },
      { name: "description", content: "Planejamento e registro das ações de educação no trânsito." },
      { property: "og:title", content: "Educação no Trânsito | SESTRAN Paranavaí" },
      { property: "og:description", content: "Planejamento e registro das ações de educação no trânsito." },
    ],
  }),
  component: () => (
    <EmBreve
      titulo="Educação no Trânsito"
      descricao="Planejamento e registro das ações de educação no trânsito."
      itens={["Programação de ações por escola", "Orientador responsável e público-alvo", "Registro de participantes"]}
    />
  ),
});
