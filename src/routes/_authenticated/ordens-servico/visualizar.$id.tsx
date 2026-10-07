import { useEffect, useState } from "react";
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
  formatarHora,
  type StatusOS,
} from "@/lib/os";
import { descreverPercurso, lerPercurso } from "@/lib/mapa";
import { alterarStatusOrdem, historicoOrdem, obterOrdem, obterConfiguracoes } from "@/lib/os-api";
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

function LinhaDocumento({ rotulo, valor, inteira = false }: { rotulo: string; valor: string; inteira?: boolean }) {
  if (!valor.trim()) return null;
  return (
    <div className={`os-doc-inline${inteira ? " os-doc-full" : ""}`}>
      <span className="os-doc-label">{rotulo}:</span>
      <div className="os-doc-line">{valor || "—"}</div>
    </div>
  );
}

function VisualizarOS() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: sessao } = useSessao();
  const podeOperar = temPapel(sessao?.papeis, ["ADMINISTRADOR", "GESTOR", "OPERADOR"]);
  const [gerando, setGerando] = useState<string | null>(null);

  const configuracoesQ = useQuery({ queryKey: ["configuracoes-os"], queryFn: obterConfiguracoes });
  const [imagemAutomatica, setImagemAutomatica] = useState<string | null>(null);
  const ordemQ = useQuery({ queryKey: ["ordem-servico", id], queryFn: () => obterOrdem(id) });
  useEffect(() => {
    let ativo = true; setImagemAutomatica(null);
    const dados = ordemQ.data;
    if (dados && !dados.ordem.mapa_imagem) {
      import("@/lib/mapa-imagem").then(({ gerarImagemMapa }) => gerarImagemMapa(lerPercurso(dados.ordem.percurso), dados.interdicoes))
        .then((img) => { if (ativo) setImagemAutomatica(img); }).catch(() => {});
    }
    return () => { ativo = false; };
  }, [ordemQ.data]);
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
  const servicos = dados.servicos
    .map((s) => `${s.tipos_servico?.nome ?? "Serviço"}${s.detalhe ? ` — ${s.detalhe}` : ""}`)
    .join("\n");
  const percursoTexto = [
    String(o["trajeto"] ?? "").trim(),
    descreverPercurso(percurso),
    ...(dados.interdicoes ?? []).map((item) =>
      [item.rua, item.trecho_inicial && `de ${item.trecho_inicial}`, item.trecho_final && `até ${item.trecho_final}`, item.observacao]
        .filter(Boolean)
        .join(" — "),
    ),
  ].filter(Boolean).join("\n");
  const observacoes = String(o["observacoes"] ?? "").trim();
  const mapaImagem = typeof o["mapa_imagem"] === "string" && o["mapa_imagem"].startsWith("data:image")
    ? o["mapa_imagem"]
    : imagemAutomatica;

  return (
    <div className="os-view space-y-6">
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

      <article className="os-paper" aria-label={`Ordem de Serviço ${String(o["numero"] ?? "")}`}>
        <table className="os-a4-table">
          <thead>
            <tr><td>
              <div className="os-doc-header">
                <div className="os-doc-logo"><img src="/assets/logo-header.png" alt="Prefeitura de Paranavaí — Secretaria Municipal de Segurança e Trânsito" /></div>
                <div className="os-doc-ident">
                  <div><strong>Nº:</strong><span>{String(o["numero"] ?? "—")}</span></div>
                  <div><strong>Data:</strong><span>{formatarDataBr(o["data_emissao"] as string)}</span></div>
                  {Boolean(o["ipm"]) && <div><strong>IPM:</strong><span>{String(o["ipm"])}</span></div>}
                </div>
              </div>
              <div className="os-doc-title">ORDEM DE SERVIÇO</div>
            </td></tr>
          </thead>
          <tbody><tr><td>
            <section className="os-doc-box os-doc-fields">
              <LinhaDocumento rotulo="De" valor={String(o["remetente"] ?? "")} />
              <LinhaDocumento rotulo="Para" valor={String(o["destinatario"] ?? "")} />
              <LinhaDocumento rotulo="Natureza" valor={String(o["natureza"] ?? "")} />
              <LinhaDocumento rotulo="Solicitante" valor={o.solicitantes?.nome ?? ""} />
              <LinhaDocumento rotulo="Local" valor={String(o["local"] ?? "")} inteira />
              <div className="os-doc-date-row">
                <div><span className="os-doc-label">Data do Serviço:</span><div className="os-doc-line">{formatarDataBr(o["data_servico"] as string)}</div></div>
                {Boolean(o["hora_inicio"]) && <div><span className="os-doc-label">Horário:</span><div className="os-doc-line">{formatarHora(o["hora_inicio"] as string)}</div></div>}
                {Boolean(o["hora_fim"]) && <div><span className="os-doc-label">Encerramento:</span><div className="os-doc-line">{formatarHora(o["hora_fim"] as string)}</div></div>}
              </div>
              <LinhaDocumento rotulo="Evento" valor={o.eventos?.titulo ?? ""} inteira />
            </section>

            <section className="os-doc-box"><span className="os-doc-label">1 - Serviço</span><div className="os-doc-line os-doc-pre">{servicos || "—"}</div></section>
            {percursoTexto && <section className="os-doc-box"><span className="os-doc-label">2 - Percurso</span><div className="os-doc-line os-doc-pre">{percursoTexto}</div></section>}

            {(dados.agentes.length > 0 || dados.orientadores.length > 0) && <section className="os-agents-panel">
              <table><thead><tr><th>{dados.agentes.length ? "Agentes de Trânsito" : "Orientadores de Trânsito"}</th><th>Horário no Local</th></tr></thead>
                <tbody>
                  
                  {dados.agentes.map((a, i) => <tr key={`a-${i}`}><td>{a.agentes?.nome ?? "Agente"}{a.agentes?.matricula ? ` — Matrícula ${a.agentes.matricula}` : ""}</td><td>{[a.hora_chegada && formatarHora(a.hora_chegada), a.funcao, a.observacao].filter(Boolean).join(" — ") || "—"}</td></tr>)}
                  {dados.orientadores.map((r, i) => <tr key={`o-${i}`}><td>{r.orientadores?.nome ?? "Orientador"}{r.orientadores?.matricula ? ` — Matrícula ${r.orientadores.matricula}` : ""} <strong>(Orientador)</strong></td><td>{r.observacao || "—"}</td></tr>)}
                </tbody>
              </table>
            </section>}
            {observacoes && <section className="os-doc-box"><span className="os-doc-label">Observações</span><div className="os-doc-line os-doc-pre">{observacoes}</div></section>}
            {mapaImagem && <figure className="os-photo-box"><img src={mapaImagem} alt="Mapa e percurso da ordem de serviço" /></figure>}
          </td></tr></tbody>
          <tfoot><tr><td><div className="os-signature"><div className="os-signature-line" /><div>{configuracoesQ.data?.autoridade ?? "Carlos Hideki de Souza Fujimori"}</div><strong>{configuracoesQ.data?.cargo_autoridade ?? "Diretor de Trânsito"}</strong></div></td></tr></tfoot>
        </table>
      </article>

      <Card className="print:hidden">
        <CardHeader><CardTitle className="text-base">Mapa interativo</CardTitle></CardHeader>
        <CardContent><MapaOS percurso={percurso} interdicoes={dados.interdicoes} somenteLeitura /></CardContent>
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
