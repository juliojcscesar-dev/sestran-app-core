import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, FileDown, FileText, Loader2, Pencil, Printer } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapaOS } from "@/components/os/MapaOS";
import { ExcluirOSButton } from "@/components/os/ExcluirOSButton";
import { useSessao, temPapel } from "@/hooks/useSessao";
import {
  ACAO_HISTORICO_LABEL,
  CAMPO_LABEL,
  STATUS_OS,
  STATUS_OS_CLASSE,
  STATUS_OS_LABEL,
  formatarDataBr,
  periodoHorario,
  type StatusOS,
} from "@/lib/os";
import { lerPercurso } from "@/lib/mapa";
import { alterarStatusOrdem, historicoOrdem, obterOrdem } from "@/lib/os-api";
import { baixarDocumentoOS } from "@/lib/os-docs";

export const Route = createFileRoute("/_authenticated/ordens-servico/visualizar/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes da Ordem de Serviço | SESTRAN Paranavaí" },
      {
        name: "description",
        content:
          "Visualização completa da ordem de serviço, com serviços, equipe, percurso e histórico.",
      },
      { property: "og:title", content: "Detalhes da Ordem de Serviço | SESTRAN Paranavaí" },
      {
        property: "og:description",
        content: "Visualização completa da ordem de serviço da SESTRAN Paranavaí.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VisualizarOS,
});

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="text-sm">{valor || "—"}</p>
    </div>
  );
}

function VisualizarOS() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: sessao } = useSessao();
  const podeOperar = temPapel(sessao?.papeis, ["ADMINISTRADOR", "GESTOR", "OPERADOR"]);
  const [gerando, setGerando] = useState<string | null>(null);

  const ordemQ = useQuery({ queryKey: ["ordem-servico", id], queryFn: () => obterOrdem(id) });
  const historicoQ = useQuery({
    queryKey: ["ordem-servico-historico", id],
    queryFn: () => historicoOrdem(id),
  });

  const mudarStatus = useMutation({
    mutationFn: (status: StatusOS) => alterarStatusOrdem(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordem-servico", id] });
      queryClient.invalidateQueries({ queryKey: ["ordem-servico-historico", id] });
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      toast.success("Situação atualizada.");
    },
    onError: () => toast.error("Você não tem permissão para alterar a situação desta ordem."),
  });

  async function gerar(formato: "pdf" | "docx") {
    setGerando(formato);
    try {
      await baixarDocumentoOS(id, formato);
      toast.success(`Documento ${formato.toUpperCase()} gerado.`);
    } catch {
      toast.error("Não foi possível gerar o documento.");
    } finally {
      setGerando(null);
    }
  }

  if (ordemQ.isLoading) return <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />;
  if (ordemQ.isError || !ordemQ.data)
    return <p className="text-sm text-destructive">Ordem de serviço não encontrada.</p>;

  const dados = ordemQ.data;
  const o = dados.ordem as Record<string, unknown> & {
    eventos?: { titulo?: string } | null;
    solicitantes?: { nome?: string } | null;
  };
  const status = (o["status"] as StatusOS) ?? "AGENDADA";
  const percurso = lerPercurso(o["percurso"]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            Ordem de Serviço {o["numero"] as string}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline" className={STATUS_OS_CLASSE[status] ?? ""}>
              {STATUS_OS_LABEL[status] ?? status}
            </Badge>
            {Boolean(o["arquivada"]) && <Badge variant="outline">Arquivada</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
            Imprimir
          </Button>
          <Button variant="outline" disabled={gerando === "pdf"} onClick={() => gerar("pdf")}>
            {gerando === "pdf" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            Gerar PDF
          </Button>
          <Button variant="outline" disabled={gerando === "docx"} onClick={() => gerar("docx")}>
            {gerando === "docx" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            Gerar DOCX
          </Button>
          {podeOperar && (
            <>
              <Button asChild variant="outline">
                <Link to="/ordens-servico/duplicar/$id" params={{ id }}>
                  <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                  Duplicar
                </Link>
              </Button>
              <Button asChild>
                <Link to="/ordens-servico/editar/$id" params={{ id }}>
                  <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                  Editar
                </Link>
              </Button>
            </>
          )}
          <ExcluirOSButton id={id} numero={String(o["numero"] ?? "")} />
        </div>
      </div>

      {podeOperar && (
        <Card className="print:hidden">
          <CardContent className="flex flex-wrap items-center gap-3 pt-6">
            <span className="text-sm font-medium">Alterar situação:</span>
            <Select value={status} onValueChange={(v) => mudarStatus.mutate(v as StatusOS)}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_OS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mudarStatus.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identificação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Campo rotulo="Número" valor={String(o["numero"] ?? "")} />
          <Campo rotulo="Data de emissão" valor={formatarDataBr(o["data_emissao"] as string)} />
          <Campo rotulo="IPM" valor={String(o["ipm"] ?? "")} />
          <Campo rotulo="De" valor={String(o["remetente"] ?? "")} />
          <Campo rotulo="Para" valor={String(o["destinatario"] ?? "")} />
          <Campo rotulo="Situação" valor={STATUS_OS_LABEL[status] ?? status} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do serviço</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-3">
            <Campo rotulo="Natureza" valor={String(o["natureza"] ?? "")} />
          </div>
          <Campo rotulo="Solicitante" valor={o.solicitantes?.nome ?? ""} />
          <Campo rotulo="Evento" valor={o.eventos?.titulo ?? ""} />
          <Campo rotulo="Local" valor={String(o["local"] ?? "")} />
          <Campo rotulo="Data" valor={formatarDataBr(o["data_servico"] as string)} />
          <Campo
            rotulo="Horário"
            valor={periodoHorario(o["hora_inicio"] as string, o["hora_fim"] as string)}
          />
          <div className="md:col-span-3">
            <Campo rotulo="Trajeto / Percurso" valor={String(o["trajeto"] ?? "")} />
          </div>
          <div className="md:col-span-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Serviços</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {dados.servicos.length === 0 && <span className="text-sm">—</span>}
              {dados.servicos.map((s, i) => (
                <Badge key={i} variant="secondary">
                  {s.tipos_servico?.nome ?? "Serviço"}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equipe designada</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Agentes de trânsito</p>
            {dados.agentes.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum agente designado.</p>
            )}
            <ul className="space-y-1 text-sm">
              {dados.agentes.map((a, i) => (
                <li key={i}>
                  {a.agentes?.nome ?? "Agente"}
                  {a.funcao ? ` — ${a.funcao}` : ""}
                  {a.hora_chegada ? ` — chegada ${String(a.hora_chegada).slice(0, 5)}` : ""}
                  {a.observacao ? ` (${a.observacao})` : ""}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Orientadores</p>
            {dados.orientadores.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum orientador designado.</p>
            )}
            <ul className="space-y-1 text-sm">
              {dados.orientadores.map((r, i) => (
                <li key={i}>
                  {r.orientadores?.nome ?? "Orientador"}
                  {r.observacao ? ` (${r.observacao})` : ""}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mapa e percurso</CardTitle>
        </CardHeader>
        <CardContent>
          <MapaOS percurso={percurso} interdicoes={dados.interdicoes} somenteLeitura />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{String(o["observacoes"] ?? "") || "—"}</p>
        </CardContent>
      </Card>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-base">Histórico de alterações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {historicoQ.isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {(historicoQ.data ?? []).length === 0 && !historicoQ.isLoading && (
            <p className="text-sm text-muted-foreground">Sem registros.</p>
          )}
          {(historicoQ.data ?? []).map((h) => (
            <div key={h.id} className="rounded-md border p-3 text-sm">
              <p className="font-medium">
                {ACAO_HISTORICO_LABEL[h.acao] ?? h.acao} —{" "}
                {new Date(h.created_at).toLocaleString("pt-BR")}
              </p>
              {h.alteracoes && typeof h.alteracoes === "object" && (
                <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                  {Object.entries(h.alteracoes as Record<string, unknown>).map(([campo, val]) => (
                    <li key={campo}>
                      {CAMPO_LABEL[campo] ?? campo}
                      {val && typeof val === "object" && "de" in (val as object)
                        ? `: ${String((val as Record<string, unknown>)["de"] ?? "—")} → ${String(
                            (val as Record<string, unknown>)["para"] ?? "—",
                          )}`
                        : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
