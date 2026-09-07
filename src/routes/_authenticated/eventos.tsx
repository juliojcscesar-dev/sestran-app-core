import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos | SESTRAN Paranavaí" },
      { name: "description", content: "Cadastro e acompanhamento dos eventos que exigem apoio de trânsito." },
      { property: "og:title", content: "Eventos | SESTRAN Paranavaí" },
      { property: "og:description", content: "Cadastro e acompanhamento dos eventos que exigem apoio de trânsito." },
    ],
  }),
  component: () => (
    <EmBreve
      titulo="Eventos"
      descricao="Cadastro e acompanhamento dos eventos que exigem apoio de trânsito."
      itens={["Cadastro de eventos com data, local e público estimado", "Vínculo com solicitante", "Situação do evento e ordens de serviço relacionadas"]}
    />
  ),
});
