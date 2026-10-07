import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Usuários e Acessos | SESTRAN Paranavaí" },
      { name: "description", content: "Gestão dos usuários do sistema e dos níveis de acesso." },
      { property: "og:title", content: "Usuários e Acessos | SESTRAN Paranavaí" },
      { property: "og:description", content: "Gestão dos usuários do sistema e dos níveis de acesso." },
    ],
  }),
  component: () => (
    <EmBreve
      titulo="Usuários e Acessos"
      descricao="Gestão dos usuários do sistema e dos níveis de acesso."
      itens={["Lista de servidores com perfil e situação", "Concessão dos níveis Administrador, Gestor, Operador e Consulta", "Ativação e inativação de contas"]}
    />
  ),
});
