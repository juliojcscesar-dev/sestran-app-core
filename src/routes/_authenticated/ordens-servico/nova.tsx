import { createFileRoute } from "@tanstack/react-router";
import { FormularioOS } from "@/components/os/FormularioOS";
import { useSessao, temPapel } from "@/hooks/useSessao";

export const Route = createFileRoute("/_authenticated/ordens-servico/nova")({
  head: () => ({
    meta: [
      { title: "Nova Ordem de Serviço | SESTRAN Paranavaí" },
      {
        name: "description",
        content: "Cadastro de nova ordem de serviço da Secretaria de Trânsito de Paranavaí.",
      },
      { property: "og:title", content: "Nova Ordem de Serviço | SESTRAN Paranavaí" },
      {
        property: "og:description",
        content: "Cadastro de nova ordem de serviço da SESTRAN Paranavaí.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NovaOS,
});

function NovaOS() {
  const { data: sessao } = useSessao();
  const podeOperar = temPapel(sessao?.papeis, ["ADMINISTRADOR", "GESTOR", "OPERADOR"]);

  if (sessao && !podeOperar) {
    return (
      <p className="text-sm text-muted-foreground">
        Seu perfil de acesso permite apenas consulta. Solicite permissão de operador para criar
        ordens de serviço.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Nova Ordem de Serviço</h1>
        <p className="text-sm text-muted-foreground">
          O número é gerado automaticamente ao salvar, em sequência anual.
        </p>
      </div>
      <FormularioOS modo="nova" />
    </div>
  );
}
