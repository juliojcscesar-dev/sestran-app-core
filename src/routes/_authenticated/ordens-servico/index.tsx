import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArchiveRestore,
  Copy,
  Eye,
  FileDown,
  FileText,
  Filter,
  Loader2,
  Pencil,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSessao } from "@/hooks/useSessao";
import { temAcesso } from "@/lib/permissoes";
import { ExcluirOSButton } from "@/components/os/ExcluirOSButton";
import { RelatorioModulo } from "@/components/relatorio/RelatorioModulo";
import {
  STATUS_OS,
  STATUS_OS_CLASSE,
  STATUS_OS_LABEL,
  formatarDataBr,
  periodoHorario,
  type StatusOS,
} from "@/lib/os";
import {
  arquivarOrdem,
  contarSituacoesOrdens,
  listarEventos,
  listarOrdens,
  listarSolicitantes,
  type FiltrosOS,
} from "@/lib/os-api";
import { baixarDocumentoOS } from "@/lib/os-docs";

export const Route = createFileRoute("/_authenticated/ordens-servico/")({
  head: () => ({
    meta: [
      { title: "Ordens de Serviço | SESTRAN Paranavaí" },
      {
        name: "description",
        content:
          "Consulte, filtre e gerencie as ordens de serviço da Secretaria de Trânsito de Paranavaí.",
      },
      { property: "og:title", content: "Ordens de Serviço | SESTRAN Paranavaí" },
      {
        property: "og:description",
        content: "Consulte, filtre e gerencie as ordens de serviço da SESTRAN Paranavaí.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ListaOS,
});

const TODOS = "__todos__";

function ListaOS() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: sessao } = useSessao();
  const podeOperar = temAcesso(sessao, "OS", "OPERADOR");
  const ehGestor = temAcesso(sessao, "OS", "EXCLUIR");
  const situacoesQ = useQuery({ queryKey: ["ordens-servico", "contagens"], queryFn: contarSituacoesOrdens });

  const [filtros, setFiltros] = useState<FiltrosOS>({ arquivadas: false });
  const [numero, setNumero] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [local, setLocal] = useState("");
  const [eventoId, setEventoId] = useState(TODOS);
  const [solicitanteId, setSolicitanteId] = useState(TODOS);
  const [status, setStatus] = useState(TODOS);
  const [confirmar, setConfirmar] = useState<{ id: string; numero: string } | null>(null);
  const [gerando, setGerando] = useState<string | null>(null);

  const ordensQ = useQuery({
    queryKey: ["ordens-servico", filtros],
    queryFn: () => listarOrdens(filtros),
  });
  const eventosQ = useQuery({ queryKey: ["eventos"], queryFn: () => listarEventos() });
  const solicitantesQ = useQuery({ queryKey: ["solicitantes"], queryFn: listarSolicitantes });

  const arquivar = useMutation({
    mutationFn: (params: { id: string; arquivar: boolean }) =>
      arquivarOrdem(params.id, params.arquivar),
    onSuccess: (_d, params) => {
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      queryClient.invalidateQueries({ queryKey: ["ordem-servico"] });
      toast.success(
        params.arquivar ? "Ordem de serviço arquivada." : "Ordem de serviço restaurada.",
      );
    },
    onError: () =>
      toast.error("O administrador precisa autorizar o arquivamento ou restauração."),
  });

  function aplicar() {
    setFiltros({
      arquivadas: filtros.arquivadas ?? false,
      ...(numero.trim() ? { numero: numero.trim() } : {}),
      ...(de ? { de } : {}),
      ...(ate ? { ate } : {}),
      ...(local.trim() ? { local: local.trim() } : {}),
      ...(eventoId !== TODOS ? { eventoId } : {}),
      ...(solicitanteId !== TODOS ? { solicitanteId } : {}),
      ...(status !== TODOS ? { status } : {}),
    });
  }

  function limpar() {
    setNumero("");
    setDe("");
    setAte("");
    setLocal("");
    setEventoId(TODOS);
    setSolicitanteId(TODOS);
    setStatus(TODOS);
    setFiltros({ arquivadas: filtros.arquivadas ?? false });
  }

  async function gerar(id: string, formato: "pdf" | "docx") {
    setGerando(`${id}-${formato}`);
    try {
      await baixarDocumentoOS(id, formato);
      toast.success(`Documento ${formato.toUpperCase()} gerado.`);
    } catch {
      toast.error("Não foi possível gerar o documento.");
    } finally {
      setGerando(null);
    }
  }

  const linhas = ordensQ.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Ordens de Serviço</h1>
          <p className="text-sm text-muted-foreground">
            {filtros.arquivadas
              ? "Ordens arquivadas da SESTRAN."
              : "Ordens ativas da Secretaria de Trânsito."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RelatorioModulo modulo="OS"
            titulo="Ordens de Serviço"
            arquivo="relatorio-ordens-servico"
            colunas={["Número", "Data", "Evento", "Local", "Situação"]}
            situacoes={STATUS_OS.map((s) => ({ valor: s, rotulo: STATUS_OS_LABEL[s] }))}
            buscar={async (de, ate, situacao) =>
              (((await listarOrdens({ ...(de ? { de } : {}), ...(ate ? { ate } : {}) })) ?? [])
                .filter((os) => !situacao || os.status === situacao)).map((os) => [
                os.numero ?? "—",
                formatarDataBr(os.data_servico),
                os.eventos?.titulo ?? "—",
                os.local ?? "—",
                STATUS_OS_LABEL[os.status as StatusOS] ?? os.status,
              ])
            }
          />
          <Button
            variant="outline"
            onClick={() => setFiltros((f) => ({ ...f, arquivadas: !f.arquivadas }))}
          >
            <Archive className="mr-2 h-4 w-4" aria-hidden="true" />
            {filtros.arquivadas ? "Ver ativas" : "Ver arquivadas"}
          </Button>
          {podeOperar && (
            <Button onClick={() => navigate({ to: "/ordens-servico/nova" })}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Nova O.S.
            </Button>
          )}
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2" aria-label="Resumo das Ordens de Serviço">
        <div className="border-b py-3"><p className="text-sm text-muted-foreground">Agendadas</p><p className="font-display text-2xl font-semibold">{situacoesQ.data?.agendadas ?? "—"}</p></div>
        <div className="border-b py-3"><p className="text-sm text-muted-foreground">Executadas</p><p className="font-display text-2xl font-semibold">{situacoesQ.data?.executadas ?? "—"}</p></div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          <div>
            <Label htmlFor="f-numero">Número</Label>
            <Input id="f-numero" value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="f-de">Período de</Label>
            <Input id="f-de" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="f-ate">Até</Label>
            <Input id="f-ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="f-local">Local</Label>
            <Input id="f-local" value={local} onChange={(e) => setLocal(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="f-evento">Evento</Label>
            <Select value={eventoId} onValueChange={setEventoId}>
              <SelectTrigger id="f-evento">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                {(eventosQ.data ?? []).map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="f-solicitante">Solicitante</Label>
            <Select value={solicitanteId} onValueChange={setSolicitanteId}>
              <SelectTrigger id="f-solicitante">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                {(solicitantesQ.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="f-status">Situação</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="f-status">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
                {STATUS_OS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_OS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button type="button" onClick={aplicar}>
              Aplicar
            </Button>
            <Button type="button" variant="outline" onClick={limpar}>
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordensQ.isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-hidden="true" />
                    </TableCell>
                  </TableRow>
                )}
                {!ordensQ.isLoading && linhas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      Nenhuma ordem de serviço encontrada com os filtros atuais.
                    </TableCell>
                  </TableRow>
                )}
                {linhas.map((os) => (
                  <TableRow key={os.id}>
                    <TableCell className="font-medium">{os.numero}</TableCell>
                    <TableCell>{formatarDataBr(os.data_servico)}</TableCell>
                    <TableCell>{os.eventos?.titulo ?? "—"}</TableCell>
                    <TableCell>{os.local ?? "—"}</TableCell>
                    <TableCell>{os.solicitantes?.nome ?? "—"}</TableCell>
                    <TableCell>{periodoHorario(os.hora_inicio, os.hora_fim)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_OS_CLASSE[os.status as StatusOS] ?? ""}
                      >
                        {STATUS_OS_LABEL[os.status as StatusOS] ?? os.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" aria-label="Visualizar">
                          <Link
                            to="/ordens-servico/visualizar/$id"
                            params={{ id: os.id }}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </Button>
                        {podeOperar && !os.arquivada && (
                          <Button asChild variant="ghost" size="icon" aria-label="Editar">
                            <Link
                              to="/ordens-servico/editar/$id"
                              params={{ id: os.id }}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </Link>
                          </Button>
                        )}
                        {podeOperar && (
                          <Button asChild variant="ghost" size="icon" aria-label="Duplicar">
                            <Link
                              to="/ordens-servico/duplicar/$id"
                              params={{ id: os.id }}
                              title="Duplicar"
                            >
                              <Copy className="h-4 w-4" aria-hidden="true" />
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Gerar PDF"
                          title="Gerar PDF"
                          disabled={gerando === `${os.id}-pdf`}
                          onClick={() => gerar(os.id, "pdf")}
                        >
                          {gerando === `${os.id}-pdf` ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <FileText className="h-4 w-4" aria-hidden="true" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Gerar DOCX"
                          title="Gerar DOCX"
                          disabled={gerando === `${os.id}-docx`}
                          onClick={() => gerar(os.id, "docx")}
                        >
                          {gerando === `${os.id}-docx` ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <FileDown className="h-4 w-4" aria-hidden="true" />
                          )}
                        </Button>
                        {ehGestor && !os.arquivada && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Arquivar"
                            title="Arquivar"
                            onClick={() => setConfirmar({ id: os.id, numero: os.numero })}
                          >
                            <Archive className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        )}
                        {ehGestor && os.arquivada && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Restaurar"
                            title="Restaurar"
                            onClick={() => arquivar.mutate({ id: os.id, arquivar: false })}
                          >
                            <ArchiveRestore className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        )}
                        <ExcluirOSButton id={os.id} numero={os.numero} somenteIcone />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmar} onOpenChange={(aberto) => !aberto && setConfirmar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar ordem de serviço {confirmar?.numero}?</AlertDialogTitle>
            <AlertDialogDescription>
              A ordem deixa de aparecer na lista de ativas, mas não é excluída. O arquivamento fica
              registrado no histórico e pode ser desfeito por gestores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmar) arquivar.mutate({ id: confirmar.id, arquivar: true });
                setConfirmar(null);
              }}
            >
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
