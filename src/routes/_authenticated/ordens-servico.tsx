import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/ordens-servico")({
  head: () => ({
    meta: [
      { title: "Ordens de Serviço | SESTRAN Paranavaí" },
      { name: "description", content: "Módulo de ordens de serviço da Secretaria de Trânsito de Paranavaí. Será liberado na Etapa 2." },
      { property: "og:title", content: "Ordens de Serviço | SESTRAN Paranavaí" },
      { property: "og:description", content: "Módulo de ordens de serviço da Secretaria de Trânsito de Paranavaí. Será liberado na Etapa 2." },
    ],
  }),
  component: () => (
    <EmBreve
      titulo="Ordens de Serviço"
      descricao="Módulo de ordens de serviço da Secretaria de Trânsito de Paranavaí. Será liberado na Etapa 2."
      itens={["Abertura de OS com número automático", "Vínculo com evento e solicitante", "Alocação de agentes e orientadores", "Acompanhamento de status e prioridade"]}
    />
  ),
});
