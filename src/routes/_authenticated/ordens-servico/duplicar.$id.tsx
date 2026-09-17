import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { FormularioOS } from "@/components/os/FormularioOS";
import { useSessao, temPapel } from "@/hooks/useSessao";
import { obterOrdem } from "@/lib/os-api";

export const Route = createFileRoute("/_authenticated/ordens-servico/duplicar/$id")({
  head: () => ({
    meta: [
      { title: "Duplicar Ordem de Serviço | SESTRAN Paranavaí" },
      {
        name: "description",
        content: "Cópia editável de ordem de serviço da SESTRAN Paranavaí, com novo número ao salvar.",
      },
      { property: "og:title", content: "Duplicar Ordem de Serviço | SESTRAN Paranavaí" },
      {
        property: "og:description",
        content: "Cópia editável de ordem de serviço com nova numeração automática.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DuplicarOS,
});

function DuplicarOS() {
  const { id } = Route.useParams();
  const { data: sessao } = useSessao();
  const podeOperar = temPapel(sessao?.papeis, ["ADMINISTRADOR", "GESTOR", "OPERADOR"]);
  const ordemQ = useQuery({ queryKey: ["ordem-servico", id], queryFn: () => obterOrdem(id) });

  if (ordemQ.isLoading) {
    return <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />;
  }
  if (ordemQ.isError || !ordemQ.data) {
    return <p className="text-sm text-destructive">Ordem de serviço não encontrada.</p>;
  }
  if (sessao && !podeOperar) {
    return (
      <p className="text-sm text-muted-foreground">
        Seu perfil permite apenas consulta. Não é possível duplicar ordens de serviço.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">
          Duplicar O.S. {(ordemQ.data.ordem as Record<string, unknown>)["numero"] as string}
        </h1>
        <p className="text-sm text-muted-foreground">
          Revise os dados. Um novo número anual é sugerido e o registro só será criado ao salvar.
        </p>
      </div>
      <FormularioOS modo="duplicar" inicial={ordemQ.data} />
    </div>
  );
}
