import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, Copy, FileDown, Search, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { temAcesso } from "@/lib/permissoes";
import { exibirTelefone } from "@/lib/mascaras";
import {
  FILTROS_INICIAIS, ROTULO_GRUPO, ROTULO_VALIDADE, atendeSituacao, csvHistorico, filtrarHistorico, idade, statusValidade,
  type ColunaOrdem, type CredencialHistorica, type FiltrosHistorico, type GrupoHistorico, type StatusValidade,
} from "@/lib/credenciais-historico";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/credenciais-consulta")({
  head: () => ({
    meta: [
      { title: "Consulta de Credenciais Idoso e PcD — SESTRAN" },
      { name: "description", content: "Pesquisa das credenciais de estacionamento de idosos e pessoas com deficiência já emitidas." },
      { property: "og:title", content: "Consulta de Credenciais Idoso e PcD — SESTRAN" },
      { property: "og:description", content: "Pesquisa das credenciais de estacionamento já emitidas pela SESTRAN." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConsultaCredenciais,
});

const POR_PAGINA = 50;
const TODOS = "todos";

const COR_VALIDADE: Record<StatusValidade, string> = {
  ok: "bg-success/15 text-success",
  soon: "bg-warning/25 text-warning-foreground",
  exp: "bg-destructive/15 text-destructive",
  indet: "bg-primary/10 text-primary",
  none: "bg-muted text-muted-foreground",
};
const COR_GRUPO: Record<GrupoHistorico, string> = {
  IDOSO: "bg-primary/10 text-primary",
  PCD: "bg-accent/25 text-accent-foreground",
};

const br = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "");

async function carregarTudo(): Promise<CredencialHistorica[]> {
  const todos: CredencialHistorica[] = [];
  for (let inicio = 0; ; inicio += 1000) {
    const { data, error } = await supabase.from("credenciais_historico").select("*").order("id").range(inicio, inicio + 999);
    if (error) throw error;
    todos.push(...data);
    if (data.length < 1000) return todos;
  }
}

function ConsultaCredenciais() {
  const { data: sessao } = useSessao();
  const podeExportar = temAcesso(sessao, "CREDENCIAIS", "RELATORIO");
  const consulta = useQuery({ queryKey: ["credenciais-historico"], queryFn: carregarTudo, staleTime: Infinity });
  const [f, setF] = useState<FiltrosHistorico>(FILTROS_INICIAIS);
  const [texto, setTexto] = useState("");
  const [pagina, setPagina] = useState(0);
  const [aberto, setAberto] = useState<CredencialHistorica | null>(null);
  const hoje = useMemo(() => new Date(), []);

  useEffect(() => {
    const t = setTimeout(() => { setF((a) => ({ ...a, busca: texto })); setPagina(0); }, 150);
    return () => clearTimeout(t);
  }, [texto]);

  const dados = consulta.data ?? [];
  const lista = useMemo(() => filtrarHistorico(dados, f, hoje), [dados, f, hoje]);
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const pag = Math.min(pagina, paginas - 1);
  const fatia = lista.slice(pag * POR_PAGINA, pag * POR_PAGINA + POR_PAGINA);

  const kpis = useMemo(() => {
    const c = (fn: (r: CredencialHistorica) => boolean) => dados.filter(fn).length;
    const k: { rotulo: string; valor: number; aplicar: Partial<FiltrosHistorico>; ativo: boolean }[] = [
      { rotulo: "Total de cadastros", valor: dados.length, aplicar: { grupo: "", validade: "", situacao: "" }, ativo: !f.grupo && !f.validade && !f.situacao },
      { rotulo: "Idosos", valor: c((r) => r.grupo === "IDOSO"), aplicar: { grupo: "IDOSO", validade: "", situacao: "" }, ativo: f.grupo === "IDOSO" && !f.validade && !f.situacao },
      { rotulo: "PcD", valor: c((r) => r.grupo === "PCD"), aplicar: { grupo: "PCD", validade: "", situacao: "" }, ativo: f.grupo === "PCD" && !f.validade && !f.situacao },
      { rotulo: "Válidas", valor: c((r) => statusValidade(r, hoje) === "ok"), aplicar: { validade: "ok" }, ativo: f.validade === "ok" },
      { rotulo: "Vencem em 90 dias", valor: c((r) => statusValidade(r, hoje) === "soon"), aplicar: { validade: "soon" }, ativo: f.validade === "soon" },
      { rotulo: "Vencidas", valor: c((r) => statusValidade(r, hoje) === "exp"), aplicar: { validade: "exp" }, ativo: f.validade === "exp" },
      { rotulo: "Com ocorrência", valor: c((r) => atendeSituacao(r, "com")), aplicar: { situacao: "com" }, ativo: f.situacao === "com" },
      { rotulo: "Nº sem nome", valor: c((r) => !r.nome), aplicar: { situacao: "sn" }, ativo: f.situacao === "sn" },
    ];
    return k;
  }, [dados, f, hoje]);

  function aplicar(p: Partial<FiltrosHistorico>) { setF((a) => ({ ...a, ...p })); setPagina(0); }
  function ordenar(col: ColunaOrdem) { setF((a) => ({ ...a, ordem: col, direcao: a.ordem === col ? (a.direcao === 1 ? -1 : 1) : 1 })); }
  function limpar() { setTexto(""); setF(FILTROS_INICIAIS); setPagina(0); }
  function exportar() {
    const blob = new Blob([csvHistorico(lista, hoje)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "consulta_credenciais.csv"; a.click(); URL.revokeObjectURL(a.href);
  }

  const colunas: { k: ColunaOrdem; t: string }[] = [
    { k: "grupo", t: "Tipo" }, { k: "numero", t: "Nº" }, { k: "nome", t: "Nome" }, { k: "documento", t: "CPF / RG" },
    { k: "telefone", t: "Telefone" }, { k: "validade", t: "Validade" }, { k: "situacao", t: "Situação" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold">Credenciais de Estacionamento – Idoso e PcD</h1>
          <p className="text-sm text-muted-foreground">Consulta das credenciais já existentes por nome, número da credencial, CPF, RG ou CNPJ.</p>
        </div>
        <Button variant="outline" asChild><Link to="/credenciais"><ArrowLeft className="mr-2 h-4 w-4" />Voltar às Credenciais</Link></Button>
      </div>

      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-8" aria-label="Resumo">
        {kpis.map((k) => (
          <button key={k.rotulo} type="button" onClick={() => aplicar(k.aplicar)}
            className={cn("rounded-lg border bg-card px-3.5 py-3 text-left shadow-sm transition-colors hover:border-primary", k.ativo && "border-primary bg-primary/5")}>
            <b className="block font-display text-2xl leading-tight">{consulta.isPending ? "…" : k.valor.toLocaleString("pt-BR")}</b>
            <span className="text-xs text-muted-foreground">{k.rotulo}</span>
          </button>
        ))}
      </section>

      <Card className="flex flex-wrap items-center gap-2.5 p-3">
        <div className="relative min-w-0 flex-[1_1_320px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" autoComplete="off" className="h-11 pl-9 text-base" placeholder="Digite nome, nº da credencial, CPF, RG ou CNPJ…"
            aria-label="Pesquisar credenciais" value={texto} onChange={(e) => setTexto(e.target.value)} />
        </div>
        <div className="flex overflow-hidden rounded-md border" role="group" aria-label="Tipo de credencial">
          {([["", "Todos"], ["IDOSO", "Idosos"], ["PCD", "PcD"]] as const).map(([v, t]) => (
            <button key={t} type="button" onClick={() => aplicar({ grupo: v })} aria-pressed={f.grupo === v}
              className={cn("px-3.5 py-2 text-sm", f.grupo === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>{t}</button>
          ))}
        </div>
        <Select value={f.validade || TODOS} onValueChange={(v) => aplicar({ validade: v === TODOS ? "" : (v as StatusValidade) })}>
          <SelectTrigger className="w-auto min-w-44" aria-label="Validade"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Qualquer validade</SelectItem><SelectItem value="ok">Válidas</SelectItem><SelectItem value="soon">Vencem em 90 dias</SelectItem>
            <SelectItem value="exp">Vencidas</SelectItem><SelectItem value="indet">Indeterminada</SelectItem><SelectItem value="none">Sem data</SelectItem>
          </SelectContent>
        </Select>
        <Select value={f.situacao || TODOS} onValueChange={(v) => aplicar({ situacao: v === TODOS ? "" : (v as FiltrosHistorico["situacao"]) })}>
          <SelectTrigger className="w-auto min-w-44" aria-label="Situação"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Qualquer situação</SelectItem><SelectItem value="com">Com ocorrência</SelectItem><SelectItem value="sem">Sem ocorrência</SelectItem>
            <SelectItem value="sn">Sem nome (nº sem cadastro)</SelectItem><SelectItem value="ne">Não entregue</SelectItem><SelectItem value="ex">Extraviada / cancelada</SelectItem>
          </SelectContent>
        </Select>
        {podeExportar && <Button variant="outline" onClick={exportar} disabled={!lista.length}><FileDown className="mr-2 h-4 w-4" />Exportar CSV</Button>}
        <Button variant="outline" onClick={limpar}><X className="mr-2 h-4 w-4" />Limpar</Button>
        <p className="w-full text-xs text-muted-foreground">Dica: números com ou sem pontos e traços funcionam (ex.: 04734309914 ou 047.343.099-14).</p>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span aria-live="polite">{consulta.isPending ? "Carregando credenciais…" : `${lista.length.toLocaleString("pt-BR")} resultado${lista.length === 1 ? "" : "s"}`}</span>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" aria-label="Página anterior" disabled={pag === 0} onClick={() => setPagina(pag - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span>{pag + 1} / {paginas}</span>
          <Button size="icon" variant="outline" aria-label="Próxima página" disabled={pag >= paginas - 1} onClick={() => setPagina(pag + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              {colunas.map((c) => (
                <th key={c.k} className="px-3 py-2.5 font-semibold">
                  <button type="button" onClick={() => ordenar(c.k)} className="inline-flex items-center gap-1 hover:text-primary">
                    {c.t}{f.ordem === c.k && <span aria-hidden="true">{f.direcao === 1 ? "▲" : "▼"}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {consulta.isError && <tr><td colSpan={7} className="p-6 text-center text-destructive">Não foi possível carregar as credenciais.</td></tr>}
            {fatia.map((r) => {
              const st = statusValidade(r, hoje);
              return (
                <tr key={r.id} className="cursor-pointer border-b last:border-0 hover:bg-muted/40" onClick={() => setAberto(r)}>
                  <td className="px-3 py-2"><span className={cn("rounded px-2 py-0.5 text-xs font-semibold", COR_GRUPO[r.grupo as GrupoHistorico])}>{ROTULO_GRUPO[r.grupo as GrupoHistorico] ?? r.grupo}</span></td>
                  <td className="px-3 py-2 font-mono">{r.numero}</td>
                  <td className="px-3 py-2 font-medium">{r.nome ?? <i className="font-normal text-muted-foreground">sem nome cadastrado</i>}</td>
                  <td className="px-3 py-2 font-mono">{r.documento || "—"}</td>
                  <td className="px-3 py-2 font-mono">{r.telefone ? exibirTelefone(r.telefone) : "—"}</td>
                  <td className="px-3 py-2"><span className={cn("whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold", COR_VALIDADE[st])}>{r.validade_indeterminada ? "Indeterminada" : br(r.validade) || "Sem data"}</span></td>
                  <td className="px-3 py-2 text-xs">{r.situacao}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!consulta.isPending && !consulta.isError && lista.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nenhum resultado encontrado.</p>}
      </Card>

      <Detalhe r={aberto} hoje={hoje} onClose={() => setAberto(null)} />
    </div>
  );
}

function Detalhe({ r, hoje, onClose }: { r: CredencialHistorica | null; hoje: Date; onClose: () => void }) {
  if (!r) return null;
  const st = statusValidade(r, hoje);
  const anos = idade(r.nascimento, hoje);
  const campo = (rotulo: string, valor: string | null | undefined, copiar = false, largo = false) => (
    <div className={cn("rounded-md border bg-muted/30 p-2.5", largo && "sm:col-span-2")}>
      <small className="block text-xs text-muted-foreground">{rotulo}</small>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 break-words font-medium">{valor || "—"}</span>
        {copiar && valor && <Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label={`Copiar ${rotulo}`}
          onClick={() => { void navigator.clipboard.writeText(valor).then(() => toast.success("Copiado.")); }}><Copy className="h-3.5 w-3.5" /></Button>}
      </div>
    </div>
  );
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex flex-wrap gap-2">
            <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", COR_GRUPO[r.grupo as GrupoHistorico])}>{ROTULO_GRUPO[r.grupo as GrupoHistorico] ?? r.grupo}</span>
            <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", COR_VALIDADE[st])}>{ROTULO_VALIDADE[st]}</span>
          </div>
          <DialogTitle>{r.nome ?? "Sem nome cadastrado"}</DialogTitle>
          <DialogDescription>Credencial registrada na base de credenciais já existentes.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 sm:grid-cols-2">
          {campo("Nº da credencial", String(r.numero), true)}
          {campo("CPF / RG", r.documento, true)}
          {campo("Nascimento", r.nascimento ? `${br(r.nascimento)}${anos !== null ? ` (${anos} anos)` : ""}` : null)}
          {campo("Validade", r.validade_indeterminada ? "Indeterminada" : br(r.validade))}
          {campo("Telefone", r.telefone ? exibirTelefone(r.telefone) : null, true)}
          {campo("Situação", r.situacao)}
          {r.grupo === "PCD" && campo("CID", r.cid)}
          {r.grupo === "PCD" && campo("Determinação", r.determinacao)}
          {r.observacoes && campo("Observações", r.observacoes, false, true)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
