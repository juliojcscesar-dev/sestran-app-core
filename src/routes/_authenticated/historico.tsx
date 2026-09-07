import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({
    meta: [
      { title: "Histórico | SESTRAN Paranavaí" },
      { name: "description", content: "Consulta ao histórico de atividades registradas no sistema." },
      { property: "og:title", content: "Histórico | SESTRAN Paranavaí" },
      { property: "og:description", content: "Consulta ao histórico de atividades registradas no sistema." },
    ],
  }),
  component: () => (
    <EmBreve
      titulo="Histórico"
      descricao="Consulta ao histórico de atividades registradas no sistema."
      itens={["Registro de criações, alterações e exclusões", "Filtro por módulo, usuário e período", "Acesso restrito a administradores e gestores"]}
    />
  ),
});
