import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { FormularioOS } from "@/components/os/FormularioOS";
import { ExcluirOSButton } from "@/components/os/ExcluirOSButton";
import { useSessao } from "@/hooks/useSessao";
import { temAcesso } from "@/lib/permissoes";
import { obterOrdem } from "@/lib/os-api";

export const Route = createFileRoute("/_authenticated/ordens-servico/editar/$id")({
  head: () => ({
    meta: [
      { title: "Editar Ordem de Serviço | SESTRAN Paranavaí" },
      {
        name: "description",
        content: "Edição de ordem de serviço da Secretaria de Trânsito de Paranavaí.",
      },
      { property: "og:title", content: "Editar Ordem de Serviço | SESTRAN Paranavaí" },
      {
        property: "og:description",
        content: "Edição de ordem de serviço da SESTRAN Paranavaí.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditarOS,
});

function EditarOS() {
  const { id } = Route.useParams();
  const { data: sessao } = useSessao();
  const podeOperar = temAcesso(sessao, "OS", "OPERADOR");
  const podeAlterarArquivada = temAcesso(sessao, "OS", "EXCLUIR");
  const ordemQ = useQuery({ queryKey: ["ordem-servico", id], queryFn: () => obterOrdem(id) });

  if (ordemQ.isLoading) {
    return <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />;
  }
  if (ordemQ.isError || !ordemQ.data) {
    return <p className="text-sm text-destructive">Ordem de serviço não encontrada.</p>;
  }
  if (!podeOperar) {
    return (
      <p className="text-sm text-muted-foreground">
        Seu perfil permite apenas consulta. Não é possível editar ordens de serviço.
      </p>
    );
  }
  const arquivada = Boolean((ordemQ.data.ordem as Record<string, unknown>)["arquivada"]);
  if (arquivada && !podeAlterarArquivada) {
    return (
      <p className="text-sm text-muted-foreground">
        Esta ordem está arquivada. Solicite ao administrador a liberação para alterá-la.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            Editar O.S. {(ordemQ.data.ordem as Record<string, unknown>)["numero"] as string}
          </h1>
          <p className="text-sm text-muted-foreground">
            As alterações ficam registradas no histórico da ordem.
          </p>
        </div>
        <ExcluirOSButton
          id={id}
          numero={String((ordemQ.data.ordem as Record<string, unknown>)["numero"] ?? "")}
        />
      </div>
      <FormularioOS modo="editar" inicial={ordemQ.data} id={id} />
    </div>
  );
}
