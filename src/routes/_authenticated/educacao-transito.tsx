import { TextoFormatado } from "@/components/TextoFormatado";
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, CalendarDays, Eye, Filter, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { ExcluirAcaoButton } from "@/components/educacao/ExcluirAcaoButton";
import { CalendarioAcoes } from "@/components/educacao/CalendarioAcoes";
import { FormularioAcao } from "@/components/educacao/FormularioAcao";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSessao } from "@/hooks/useSessao";
import { temAcesso } from "@/lib/permissoes";
import { CATEGORIAS_ACAO, CATEGORIA_ACAO_LABEL, dataLocalIso, intervaloDaVisao, STATUS_ACAO, STATUS_ACAO_CLASSE, STATUS_ACAO_LABEL, type CategoriaAcao, type StatusAcao, type VisaoCalendario } from "@/lib/educacao";
import { arquivarAcao, listarAcoes, listarReferenciasEducacao, type AcaoEducativa } from "@/lib/educacao-api";
import { formatarData } from "@/lib/sestran";
import { RelatorioModulo } from "@/components/relatorio/RelatorioModulo";
import { textoSimples } from "@/lib/texto-formatado";

export const Route = createFileRoute("/_authenticated/educacao-transito")({
  head: () => ({ meta: [
    { title: "Educação no Trânsito | SESTRAN Paranavaí" },
    { name: "description", content: "Calendário e gestão das ações de educação no trânsito em Paranavaí." },
    { property: "og:title", content: "Educação no Trânsito | SESTRAN Paranavaí" },
    { property: "og:description", content: "Calendário mensal, semanal e diário das ações educativas." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: EducacaoTransito,
});

const TODOS = "__todos__";

function EducacaoTransito() {
  const queryClient = useQueryClient();
  const { data: sessao } = useSessao();
  const podeOperar = temAcesso(sessao, "EDUCACAO", "OPERADOR");
  const podeArquivar = temAcesso(sessao, "EDUCACAO", "EXCLUIR");
  const [visao, setVisao] = useState<VisaoCalendario>("mes");
  const [referencia, setReferencia] = useState(new Date());
  const [status, setStatus] = useState(TODOS); const [categoria, setCategoria] = useState(TODOS);
  const [escolaId, setEscolaId] = useState(TODOS); const [orientadorId, setOrientadorId] = useState(TODOS);
  const [arquivadas, setArquivadas] = useState(false);
  const [formulario, setFormulario] = useState(false); const [editando, setEditando] = useState<AcaoEducativa | null>(null);
  const [detalhe, setDetalhe] = useState<AcaoEducativa | null>(null); const [confirmar, setConfirmar] = useState<AcaoEducativa | null>(null);
  const periodo = useMemo(() => intervaloDaVisao(referencia, visao), [referencia, visao]);
  const filtros = useMemo(() => ({ inicio: periodo.inicio, fim: periodo.fim, arquivadas, ...(status !== TODOS ? { status } : {}), ...(categoria !== TODOS ? { categoria } : {}), ...(escolaId !== TODOS ? { escolaId } : {}), ...(orientadorId !== TODOS ? { orientadorId } : {}) }), [periodo, arquivadas, status, categoria, escolaId, orientadorId]);
  const acoes = useQuery({ queryKey: ["educacao", "acoes", filtros], queryFn: () => listarAcoes(filtros) });
  const referencias = useQuery({ queryKey: ["educacao", "referencias"], queryFn: listarReferenciasEducacao });
  const arquivar = useMutation({ mutationFn: (a: AcaoEducativa) => arquivarAcao(a.id, !a.arquivada), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["educacao"] }); queryClient.invalidateQueries({ queryKey: ["painel"] }); setConfirmar(null); toast.success(arquivadas ? "Ação restaurada." : "Ação arquivada."); }, onError: () => toast.error("O administrador precisa autorizar o arquivamento ou restauração.") });
  const hoje = dataLocalIso(new Date()); const linhas = acoes.data ?? [];
  const resumos = [
    { titulo: "Atividades de hoje", valor: linhas.filter((a) => a.data_acao === hoje && a.status !== "CANCELADA").length, filtro: "dia" as VisaoCalendario },
    { titulo: "Futuras", valor: linhas.filter((a) => a.data_acao > hoje && a.status === "AGENDADA").length, filtro: "lista" as VisaoCalendario },
    { titulo: "Realizadas", valor: linhas.filter((a) => a.status === "REALIZADA").length, filtro: "lista" as VisaoCalendario },
  ];

  function editar(a: AcaoEducativa) { setDetalhe(null); setEditando(a); setFormulario(true); }
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-display text-2xl font-semibold">Educação no Trânsito</h1><p className="text-sm text-muted-foreground">Programação e acompanhamento das ações educativas.</p></div><div className="flex flex-wrap gap-2"><RelatorioModulo titulo="Educação no Trânsito" arquivo="relatorio-educacao-transito" colunas={["Data","Título da Ação","Local","Situação"]} buscar={async (inicio, fim) => (await listarAcoes({ ...(inicio ? { inicio } : {}), ...(fim ? { fim } : {}) })).map((a) => [formatarData(a.data_acao), textoSimples(a.titulo), a.local ?? a.escolas?.nome ?? "—", STATUS_ACAO_LABEL[a.status]])} /><Button type="button" variant="outline" onClick={() => setArquivadas((v) => !v)}><Archive className="mr-2 h-4 w-4" />{arquivadas ? "Ver ativas" : "Ver arquivadas"}</Button>{podeOperar && <Button type="button" onClick={() => { setEditando(null); setFormulario(true); }}><Plus className="mr-2 h-4 w-4" />Nova ação</Button>}</div></div>
    <section className="grid gap-3 sm:grid-cols-3">{resumos.map((r) => <Button key={r.titulo} variant="outline" className="h-auto justify-between px-4 py-3 text-left" onClick={() => { setVisao(r.filtro); if (r.filtro === "dia") setReferencia(new Date()); if (r.titulo === "Realizadas") setStatus("REALIZADA"); }}><span><span className="block text-xs text-muted-foreground">{r.titulo}</span><span className="font-display text-2xl font-semibold">{r.valor}</span></span><CalendarDays className="h-5 w-5 text-primary" /></Button>)}</section>
    <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Filter className="h-4 w-4" />Filtros</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-4">
      <div><Label htmlFor="f-status-acao">Situação</Label><Select value={status} onValueChange={setStatus}><SelectTrigger id="f-status-acao"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={TODOS}>Todas</SelectItem>{STATUS_ACAO.map((s) => <SelectItem key={s} value={s}>{STATUS_ACAO_LABEL[s]}</SelectItem>)}</SelectContent></Select></div>
      <div><Label htmlFor="f-categoria-acao">Categoria</Label><Select value={categoria} onValueChange={setCategoria}><SelectTrigger id="f-categoria-acao"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={TODOS}>Todas</SelectItem>{CATEGORIAS_ACAO.map((c) => <SelectItem key={c} value={c}>{CATEGORIA_ACAO_LABEL[c]}</SelectItem>)}</SelectContent></Select></div>
      <div><Label htmlFor="f-escola-acao">Escola</Label><Select value={escolaId} onValueChange={setEscolaId}><SelectTrigger id="f-escola-acao"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={TODOS}>Todas</SelectItem>{(referencias.data?.escolas ?? []).map((i) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent></Select></div>
      <div><Label htmlFor="f-orientador-acao">Orientador</Label><Select value={orientadorId} onValueChange={setOrientadorId}><SelectTrigger id="f-orientador-acao"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={TODOS}>Todos</SelectItem>{(referencias.data?.orientadores ?? []).map((i) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent></Select></div>
    </CardContent></Card>
    <Card><CardHeader className="flex flex-row items-center justify-between gap-3"><CardTitle className="text-base">Calendário</CardTitle><Tabs value={visao} onValueChange={(v) => setVisao(v as VisaoCalendario)}><TabsList>{([{ valor: "mes", rotulo: "Mês" }, { valor: "semana", rotulo: "Semana" }, { valor: "dia", rotulo: "Dia" }, { valor: "lista", rotulo: "Lista" }] as const).map((item) => <TabsTrigger key={item.valor} value={item.valor}>{item.rotulo}</TabsTrigger>)}</TabsList></Tabs></CardHeader><CardContent>{acoes.isLoading ? <div className="py-20 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div> : acoes.isError ? <p className="py-12 text-center text-sm text-destructive">Não foi possível carregar as ações.</p> : <CalendarioAcoes acoes={linhas} referencia={referencia} visao={visao} onReferenciaChange={setReferencia} onAbrir={setDetalhe} />}</CardContent></Card>

    <FormularioAcao aberto={formulario && podeOperar} onAbertoChange={setFormulario} acao={editando} />
    <Dialog open={Boolean(detalhe)} onOpenChange={(v) => !v && setDetalhe(null)}><DialogContent><DialogHeader><DialogTitle>{detalhe && <TextoFormatado valor={detalhe.titulo} />}</DialogTitle><DialogDescription>{detalhe && CATEGORIA_ACAO_LABEL[detalhe.categoria]}</DialogDescription></DialogHeader>{detalhe && <div className="grid gap-3 text-sm sm:grid-cols-2"><p><span className="text-muted-foreground">Data</span><br />{formatarData(detalhe.data_acao)} · {detalhe.horario_inicio?.slice(0,5) ?? "Horário livre"}</p><p><span className="text-muted-foreground">Situação</span><br /><Badge variant="outline" className={STATUS_ACAO_CLASSE[detalhe.status]}>{STATUS_ACAO_LABEL[detalhe.status]}</Badge></p><p><span className="text-muted-foreground">Escola / local</span><br />{detalhe.escolas?.nome ?? detalhe.local ?? "—"}</p><p><span className="text-muted-foreground">Orientador</span><br />{detalhe.orientadores?.nome ?? "—"}</p><p><span className="text-muted-foreground">Tema</span><br />{detalhe.temas_educativos?.nome ?? "—"}</p><p><span className="text-muted-foreground">Público / participantes</span><br />{detalhe.publico_alvo ?? "—"} · {detalhe.participantes ?? "—"}</p>{detalhe.descricao && <p className="sm:col-span-2"><span className="text-muted-foreground">Descrição</span><br /><TextoFormatado valor={detalhe.descricao} /></p>}</div>}<DialogFooter>{detalhe && <Button type="button" variant="outline" asChild><Link to="/agenda-educativa/$id" params={{ id: detalhe.id }}><Eye className="mr-2 h-4 w-4" />Visualizar</Link></Button>}{detalhe && <ExcluirAcaoButton id={detalhe.id} titulo={detalhe.titulo} onExcluida={() => setDetalhe(null)} />}{detalhe && podeArquivar && <Button type="button" variant="outline" onClick={() => { setConfirmar(detalhe); setDetalhe(null); }}><Archive className="mr-2 h-4 w-4" />{detalhe.arquivada ? "Restaurar" : "Arquivar"}</Button>}{detalhe && podeOperar && !detalhe.arquivada && <Button type="button" onClick={() => editar(detalhe)}><Pencil className="mr-2 h-4 w-4" />Editar</Button>}<Button type="button" variant="outline" onClick={() => setDetalhe(null)}><Eye className="mr-2 h-4 w-4" />Fechar</Button></DialogFooter></DialogContent></Dialog>
    <AlertDialog open={Boolean(confirmar)} onOpenChange={(v) => !v && setConfirmar(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirmar?.arquivada ? "Restaurar ação?" : "Arquivar ação?"}</AlertDialogTitle><AlertDialogDescription>O registro e seu histórico serão preservados.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => confirmar && arquivar.mutate(confirmar)}>Confirmar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}