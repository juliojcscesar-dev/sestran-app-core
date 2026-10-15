import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Car, ClipboardCheck, Pencil, Plus, Printer, Search, Timer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useSessao } from "@/hooks/useSessao";
import { temAcesso } from "@/lib/permissoes";
import { ImagensObservacoes } from "@/components/veiculos/ImagensObservacoes";
import { imagensRecolhido } from "@/lib/recolhidos-imagens";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Registro = Database["public"]["Tables"]["veiculos_recolhidos"]["Row"];
type ItemCheck = { item: string; presenca: string; estado: string; obs: string };

const ITENS = ["Faróis / lanternas / setas", "Pneus dianteiros", "Pneus traseiros", "Estepe", "Rodas / calotas", "Retrovisores", "Para-brisas / vigias", "Vidros laterais", "Limpadores de para-brisa dianteiros e traseiros", "Bateria", "Rádio / alto-falantes", "Volante", "Painel", "Bancos dianteiros e traseiros", "Cintos de segurança", "Macaco / chave de roda"];
const PRESENCA = ["Sim", "Não", "Não verificado"];
const ESTADO = ["Bom", "Regular", "Ruim", "Danificado", "Não se aplica"];
const SITUACOES = ["No pátio", "Aguardando vistoria", "Vistoria concluída", "Em análise administrativa", "Em processo de liberação", "Liberado", "Encaminhado para destinação"];
const CATEGORIAS = ["Automóvel", "Motocicleta", "Caminhonete", "Caminhão", "Ônibus", "Outro"];
const MOTIVOS = ["Abandono", "Conservação precária", "Abandono e conservação precária"];
const DOCS = ["CPF", "RG", "CNH", "CNPJ", "Desconhecido"];

export const Route = createFileRoute("/_authenticated/veiculos-recolhidos")({
  head: () => ({ meta: [
    { title: "Veículos Recolhidos | SESTRAN Paranavaí" },
    { name: "description", content: "Check-list de vistoria e controle dos veículos recolhidos ao pátio." },
    { property: "og:title", content: "Veículos Recolhidos | SESTRAN Paranavaí" },
    { property: "og:description", content: "Controle e vistoria dos veículos recolhidos em Paranavaí." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: VeiculosRecolhidos,
});

const dataBR = (s?: string | null) => (s ? new Date(`${s}T12:00:00`).toLocaleDateString("pt-BR") : "—");
function diasNoPatio(r: Registro) { const i = new Date(`${r.data_recolhimento}T00:00:00`); const h = new Date(); h.setHours(0, 0, 0, 0); return Math.max(0, Math.floor((h.getTime() - i.getTime()) / 86400000)); }
function checklistDe(r?: Partial<Registro> | null): ItemCheck[] { const l = (Array.isArray(r?.checklist) ? r?.checklist : []) as unknown as ItemCheck[]; return ITENS.map((item) => { const x = l.find((c) => c.item === item); return { item, presenca: x?.presenca ?? "", estado: x?.estado ?? "", obs: x?.obs ?? "" }; }); }
const checklistCompleto = (r: Registro) => checklistDe(r).every((c) => c.presenca && c.presenca !== "Não verificado" && c.estado);
function Selo({ r }: { r: Registro }) { const d = diasNoPatio(r); if (r.situacao === "Liberado") return <Badge variant="outline" className="border-green-600/40 text-green-700">Liberado</Badge>; if (d >= 90) return <Badge variant="destructive">90 dias ou mais</Badge>; if (d >= 75) return <Badge variant="outline" className="border-amber-500/50 text-amber-700">Prazo próximo</Badge>; return <Badge variant="secondary">{r.situacao}</Badge>; }

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
function imprimir(titulo: string, corpo: string) {
  const w = window.open("", "_blank"); if (!w) { toast.error("Permita janelas pop-up para imprimir."); return; }
  w.document.write(`<!doctype html><html><head><title>${esc(titulo)}</title><style>body{font:12px Arial,sans-serif;margin:24px;color:#111}header{text-align:center;margin-bottom:12px}header img{max-height:70px}h1{font-size:16px;margin:6px 0}h2{font-size:13px;margin:14px 0 6px;border-bottom:1px solid #999}table{border-collapse:collapse;width:100%}td,th{border:1px solid #bbb;padding:4px 6px;text-align:left;vertical-align:top}th{background:#eee}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:4px 12px}.ass{margin-top:40px;text-align:center}.observacoes{margin:12px 0;break-inside:avoid}.observacoes p{white-space:pre-wrap;overflow-wrap:anywhere}.observacoes-imagens{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:start;gap:3mm}.observacoes-imagens img{display:block;width:auto;height:auto;max-width:min(100%,7cm);max-height:9cm;object-fit:contain;margin:0 auto}@page{size:A4;margin:12mm}</style></head><body><header><img src="/assets/logo-header.png" alt=""/><h1>${esc(titulo)}</h1></header>${corpo}<script>window.onload=()=>{window.print()}<\/script></body></html>`);
  w.document.close();
}
function observacoesFicha(r: Registro) {
  const imagens = imagensRecolhido(r.observacoes_imagens);
  if (!r.observacoes && !imagens.length) return "";
  return `<section class="observacoes"><b>Observações:</b>${r.observacoes ? `<p>${esc(r.observacoes)}</p>` : ""}${imagens.length ? `<div class="observacoes-imagens">${imagens.map((src, i) => `<img src="${src}" alt="Imagem ${i + 1} das observações"/>`).join("")}</div>` : ""}</section>`;
}
function ficha(r: Registro) {
  const c = (l: string, v: unknown) => `<div><b>${l}:</b> ${esc(v || "—")}</div>`;
  return `<h2>1. Dados do veículo</h2><div class="g">${c("Marca", r.marca)}${c("Modelo", r.modelo)}${c("Placa", r.placa)}${c("Chassi", r.chassi)}${c("Cor", r.cor)}${c("Categoria", r.categoria)}${c("Notificação", dataBR(r.data_notificacao))}${c("Recolhimento", `${dataBR(r.data_recolhimento)} ${r.hora_recolhimento?.slice(0, 5) ?? ""}`)}${c("Dias no pátio", diasNoPatio(r))}${c("Local", r.local_encontrado)}${c("Motivo", r.motivo)}${c("Agente", r.agente)}${c("Nº auto/documento", r.documento)}${c("Situação", r.situacao)}</div>${observacoesFicha(r)}
  <h2>2. Proprietário</h2><div class="g">${c("Nome", r.proprietario)}${c(r.tipo_documento || "Documento", r.numero_documento)}${c("Telefone", r.telefone)}${c("Endereço", r.endereco)}</div>
  <h2>3. Checklist de vistoria</h2><table><thead><tr><th>Item</th><th>Presença</th><th>Estado</th><th>Observação</th></tr></thead><tbody>${checklistDe(r).map((i) => `<tr><td>${esc(i.item)}</td><td>${esc(i.presenca || "—")}</td><td>${esc(i.estado || "—")}</td><td>${esc(i.obs)}</td></tr>`).join("")}</tbody></table>
  ${r.obs_vistoria ? `<p><b>Observações da vistoria:</b> ${esc(r.obs_vistoria)}</p>` : ""}<div class="g">${c("Vistoriador", r.vistoriador)}${c("Data da vistoria", dataBR(r.data_vistoria))}</div><div class="ass">______________________________<br/>${esc(r.vistoriador || "Responsável pela vistoria")}</div>`;
}

type Form = Omit<Registro, "id" | "criado_por" | "criado_em" | "atualizado_em" | "checklist" | "observacoes_imagens"> & { checklist: ItemCheck[]; observacoes_imagens: string[] };
const vazio = (): Form => ({ marca: "", modelo: "", placa: "", chassi: "", cor: "", categoria: "", data_notificacao: "", data_recolhimento: new Date().toISOString().slice(0, 10), hora_recolhimento: "", local_encontrado: "", motivo: "Abandono", agente: "", documento: "", observacoes: "", observacoes_imagens: [], proprietario: "", tipo_documento: "", numero_documento: "", endereco: "", telefone: "", obs_vistoria: "", vistoriador: "", data_vistoria: "", situacao: "No pátio", checklist: checklistDe(null) });

function Sel({ v, on, ops, ph = "Selecione" }: { v: string; on: (s: string) => void; ops: string[]; ph?: string }) {
  return <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={v} onChange={(e) => on(e.target.value)}><option value="">{ph}</option>{ops.map((o) => <option key={o}>{o}</option>)}</select>;
}

function VeiculosRecolhidos() {
  const qc = useQueryClient();
  const { data: sessao } = useSessao();
  const opera = temAcesso(sessao, "VEICULOS", "OPERADOR");
  const exclui = temAcesso(sessao, "VEICULOS", "EXCLUIR");
  const [aba, setAba] = useState("painel");
  const [busca, setBusca] = useState(""); const [filtro, setFiltro] = useState("");
  const [rDe, setRDe] = useState(""); const [rAte, setRAte] = useState(""); const [rSit, setRSit] = useState("");
  const [aberto, setAberto] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [processandoImagens, setProcessandoImagens] = useState(false);
  const [f, setF] = useState<Form>(vazio()); const [excluir, setExcluir] = useState<Registro | null>(null);

  const q = useQuery({ queryKey: ["veiculos-recolhidos"], queryFn: async () => { const { data, error } = await supabase.from("veiculos_recolhidos").select("*").order("data_recolhimento", { ascending: false }); if (error) throw error; return data; } });
  const lista = q.data ?? [];
  const salvar = useMutation({
    mutationFn: async () => {
      if (!f.marca.trim() || !f.modelo.trim() || !f.data_recolhimento) throw new Error("Preencha marca, modelo e data do recolhimento.");
      const limpo = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, typeof v === "string" ? (v.trim() || null) : v])) as Record<string, unknown>;
      limpo["placa"] = typeof limpo["placa"] === "string" ? limpo["placa"].toUpperCase() : null;
      const payload = { ...limpo, marca: f.marca.trim(), modelo: f.modelo.trim(), situacao: f.situacao || "No pátio", checklist: f.checklist } as unknown as Database["public"]["Tables"]["veiculos_recolhidos"]["Insert"];
      const { error } = editId ? await supabase.from("veiculos_recolhidos").update(payload).eq("id", editId) : await supabase.from("veiculos_recolhidos").insert(payload);
      if (error) throw new Error("Não foi possível salvar. Verifique sua permissão.");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["veiculos-recolhidos"] }); setAberto(false); toast.success("Veículo salvo."); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remover = useMutation({
    mutationFn: async (id: string) => { const { data, error } = await supabase.from("veiculos_recolhidos").delete().eq("id", id).select("id"); if (error || !data?.length) throw new Error(); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["veiculos-recolhidos"] }); setExcluir(null); toast.success("Registro excluído."); },
    onError: () => toast.error("O administrador precisa autorizar a exclusão."),
  });

  const novo = () => { setEditId(null); setF(vazio()); setAberto(true); };
  const editar = (r: Registro) => { const { id, criado_por, criado_em, atualizado_em, ...resto } = r; void criado_por; void criado_em; void atualizado_em; setEditId(id); setF({ ...(Object.fromEntries(Object.entries(resto).map(([k, v]) => [k, v ?? ""])) as unknown as Form), hora_recolhimento: r.hora_recolhimento?.slice(0, 5) ?? "", observacoes_imagens: imagensRecolhido(r.observacoes_imagens), checklist: checklistDe(r) }); setAberto(true); };
  const set = (k: keyof Form) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const [buscando, setBuscando] = useState(false);
  const buscarAbandonado = async (origem: "placa" | "chassi") => {
    const termo = (origem === "placa" ? f.placa : f.chassi)?.trim();
    if (!termo || termo.length < 3 || buscando) return;
    setBuscando(true);
    try {
      const col = origem === "placa" ? "placa" : "chassi";
      const valor = origem === "placa" ? termo.toUpperCase() : termo;
      const { data, error } = await supabase.from("veiculos_abandonados").select("placa, chassi, marca, modelo, cor, endereco, bairro, data_notificacao, observacoes, situacao, status").ilike(col, valor).limit(5);
      if (error) throw error;
      const achados = data ?? [];
      if (!achados.length) { toast.info("Nenhum veículo abandonado encontrado com essa identificação."); return; }
      const a = achados[0];
      if (!a) return;
      setF((p) => ({
        ...p,
        placa: a.placa ?? p.placa,
        chassi: a.chassi ?? p.chassi,
        marca: a.marca ?? p.marca,
        modelo: a.modelo ?? p.modelo,
        cor: a.cor ?? p.cor,
        local_encontrado: p.local_encontrado || [a.endereco, a.bairro].filter(Boolean).join(" - "),
        data_notificacao: a.data_notificacao ?? p.data_notificacao,
        observacoes: p.observacoes || (a.observacoes ?? ""),
      }));
      toast.success(`Dados de ${a.placa ?? `${a.marca} ${a.modelo}`} preenchidos a partir de Veículos Abandonados.`);
    } catch { toast.error("Não foi possível consultar Veículos Abandonados."); }
    finally { setBuscando(false); }
  };
  const setItem = (i: number, k: keyof ItemCheck, v: string) => setF((p) => ({ ...p, checklist: p.checklist.map((c, j) => (j === i ? { ...c, [k]: v } : c)) }));

  const hoje = new Date();
  const metricas = [
    { t: "Total cadastrado", v: lista.length, i: Car, h: "Registros no sistema" },
    { t: "Vistorias concluídas", v: lista.filter(checklistCompleto).length, i: ClipboardCheck, h: "Checklist completo" },
    { t: "Entradas neste mês", v: lista.filter((r) => { const d = new Date(`${r.data_recolhimento}T12:00:00`); return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear(); }).length, i: CalendarDays, h: "Pela data de recolhimento" },
    { t: "Marco de 90 dias atingido", v: lista.filter((r) => r.situacao !== "Liberado" && diasNoPatio(r) >= 90).length, i: Timer, h: "Acompanhamento administrativo" },
  ];
  const filtrados = useMemo(() => { const b = busca.toLowerCase().trim(); return lista.filter((r) => (!b || [r.placa, r.marca, r.modelo, r.proprietario, r.chassi].some((x) => String(x ?? "").toLowerCase().includes(b))) && (!filtro || r.situacao === filtro)); }, [lista, busca, filtro]);
  const relatorio = lista.filter((r) => (!rDe || r.data_recolhimento >= rDe) && (!rAte || r.data_recolhimento <= rAte) && (!rSit || r.situacao === rSit));

  const tabela = (rows: Registro[], acoes: boolean) => rows.length ? (
    <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Placa</TableHead><TableHead>Marca / modelo</TableHead><TableHead>Proprietário</TableHead><TableHead>Recolhimento</TableHead><TableHead>Dias no pátio</TableHead><TableHead>Situação</TableHead>{acoes && <TableHead />}</TableRow></TableHeader>
      <TableBody>{rows.map((r) => <TableRow key={r.id}><TableCell className="font-semibold">{r.placa ?? "Sem placa"}</TableCell><TableCell>{r.marca} {r.modelo}</TableCell><TableCell>{r.proprietario ?? "Não informado"}</TableCell><TableCell>{dataBR(r.data_recolhimento)}</TableCell><TableCell>{diasNoPatio(r)}</TableCell><TableCell><Selo r={r} /></TableCell>
        {acoes && <TableCell><div className="flex"><Button variant="ghost" size="icon" aria-label="Imprimir ficha" onClick={() => imprimir(`Ficha de vistoria — ${r.placa ?? `${r.marca} ${r.modelo}`}`, ficha(r))}><Printer className="h-4 w-4" /></Button>{opera && <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => editar(r)}><Pencil className="h-4 w-4" /></Button>}{exclui && <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => setExcluir(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div></TableCell>}</TableRow>)}</TableBody></Table></div>
  ) : <p className="p-6 text-center text-sm text-muted-foreground">Nenhum registro encontrado.</p>;

  const campo = (rot: string, k: keyof Form, tipo = "text", cls = "") => <div className={`space-y-1 ${cls}`}><Label>{rot}</Label><Input type={tipo} value={(f[k] as string) ?? ""} onChange={(e) => set(k)(e.target.value)} /></div>;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-display text-2xl font-semibold">Veículos Recolhidos</h1><p className="text-sm text-muted-foreground">Check-list de vistoria e acompanhamento dos veículos no pátio.</p></div>{opera && <Button onClick={novo}><Plus className="mr-2 h-4 w-4" />Novo check-in</Button>}</div>
    <Tabs value={aba} onValueChange={setAba}>
      <TabsList><TabsTrigger value="painel">Dashboard</TabsTrigger><TabsTrigger value="lista">Veículos cadastrados</TabsTrigger><TabsTrigger value="relatorio">Relatórios</TabsTrigger></TabsList>
      <TabsContent value="painel" className="space-y-4">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metricas.map((m) => <Card key={m.t}><CardContent className="p-4"><m.i className="float-right h-5 w-5 text-muted-foreground" /><p className="text-xs text-muted-foreground">{m.t}</p><p className="font-display text-3xl font-semibold">{m.v}</p><p className="text-xs text-muted-foreground">{m.h}</p></CardContent></Card>)}</section>
        <Card><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Veículos recentes</CardTitle><Button size="sm" variant="outline" onClick={() => setAba("lista")}>Ver todos</Button></CardHeader><CardContent className="p-0">{q.isPending ? <p className="p-6 text-sm text-muted-foreground">Carregando…</p> : tabela([...lista].sort((a, b) => b.criado_em.localeCompare(a.criado_em)).slice(0, 5), false)}</CardContent></Card>
      </TabsContent>
      <TabsContent value="lista" className="space-y-4">
        <Card><CardContent className="grid gap-3 p-4 md:grid-cols-3"><div className="relative md:col-span-2"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Pesquisar por placa, modelo ou proprietário…" value={busca} onChange={(e) => setBusca(e.target.value)} /></div><Sel v={filtro} on={setFiltro} ops={SITUACOES} ph="Todas as situações" /></CardContent></Card>
        <Card><CardContent className="p-0">{tabela(filtrados, true)}</CardContent></Card>
      </TabsContent>
      <TabsContent value="relatorio" className="space-y-4">
        <Card><CardContent className="grid gap-3 p-4 md:grid-cols-4"><div className="space-y-1"><Label>Recolhimento a partir de</Label><Input type="date" value={rDe} onChange={(e) => setRDe(e.target.value)} /></div><div className="space-y-1"><Label>Recolhimento até</Label><Input type="date" value={rAte} onChange={(e) => setRAte(e.target.value)} /></div><div className="space-y-1"><Label>Situação</Label><Sel v={rSit} on={setRSit} ops={SITUACOES} ph="Todas" /></div>
          <div className="flex items-end"><Button className="w-full" disabled={!relatorio.length} onClick={() => imprimir("Relação de veículos recolhidos", `<p>${relatorio.length} veículo(s)${rDe || rAte ? ` · período ${dataBR(rDe)} a ${dataBR(rAte)}` : ""}${rSit ? ` · ${esc(rSit)}` : ""}</p><table><thead><tr><th>Placa</th><th>Veículo</th><th>Proprietário</th><th>Notificação</th><th>Recolhimento</th><th>Dias</th><th>Situação</th></tr></thead><tbody>${relatorio.map((r) => `<tr><td>${esc(r.placa ?? "Sem placa")}</td><td>${esc(`${r.marca} ${r.modelo}`)}</td><td>${esc(r.proprietario ?? "—")}</td><td>${dataBR(r.data_notificacao)}</td><td>${dataBR(r.data_recolhimento)}</td><td>${diasNoPatio(r)}</td><td>${esc(r.situacao)}</td></tr>`).join("")}</tbody></table>`)}><Printer className="mr-2 h-4 w-4" />Imprimir / Salvar PDF</Button></div></CardContent></Card>
        <Card><CardContent className="p-0">{tabela(relatorio, false)}</CardContent></Card>
      </TabsContent>
    </Tabs>

    <Dialog open={aberto && opera} onOpenChange={setAberto}><DialogContent className="max-h-[92vh] min-w-0 max-w-[calc(100vw-2rem)] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-5xl"><DialogHeader><DialogTitle>{editId ? "Editar veículo" : "Cadastrar veículo"}</DialogTitle></DialogHeader>
      <div className="space-y-5 text-sm">
        <section><h3 className="mb-2 font-semibold">1. Dados do veículo</h3><div className="grid gap-3 sm:grid-cols-3">{campo("Marca *", "marca")}{campo("Modelo *", "modelo")}<div className="space-y-1"><Label>Placa</Label><Input value={f.placa ?? ""} onChange={(e) => set("placa")(e.target.value)} onBlur={() => void buscarAbandonado("placa")} placeholder="ABC1D23" /></div><div className="space-y-1"><Label>Chassi</Label><Input value={f.chassi ?? ""} onChange={(e) => set("chassi")(e.target.value)} onBlur={() => void buscarAbandonado("chassi")} /></div>{campo("Cor", "cor")}<div className="space-y-1"><Label>Categoria</Label><Sel v={f.categoria ?? ""} on={set("categoria")} ops={CATEGORIAS} /></div>{campo("Data da notificação", "data_notificacao", "date")}{campo("Data do recolhimento *", "data_recolhimento", "date")}{campo("Hora do recolhimento", "hora_recolhimento", "time")}{campo("Local onde foi encontrado", "local_encontrado", "text", "sm:col-span-3")}<div className="space-y-1"><Label>Motivo do recolhimento</Label><Sel v={f.motivo ?? ""} on={set("motivo")} ops={MOTIVOS} /></div>{campo("Agente responsável", "agente")}{campo("Nº auto/documento", "documento")}<div className="space-y-1 sm:col-span-3"><Label htmlFor="observacoes-recolhido">Observações gerais</Label><Textarea id="observacoes-recolhido" value={f.observacoes ?? ""} onChange={(e) => set("observacoes")(e.target.value)} /><ImagensObservacoes imagens={f.observacoes_imagens} onChange={(imagens) => setF((p) => ({ ...p, observacoes_imagens: imagens }))} onOcupado={setProcessandoImagens} /></div></div></section>
        <section><h3 className="mb-2 font-semibold">2. Dados do proprietário</h3><div className="grid gap-3 sm:grid-cols-3">{campo("Nome completo", "proprietario")}<div className="space-y-1"><Label>Tipo de documento</Label><Sel v={f.tipo_documento ?? ""} on={set("tipo_documento")} ops={DOCS} /></div>{campo("Número do documento", "numero_documento")}{campo("Endereço completo", "endereco", "text", "sm:col-span-2")}{campo("Telefone", "telefone")}</div></section>
        <section><h3 className="mb-2 font-semibold">3. Checklist de vistoria</h3><div className="overflow-x-auto rounded-md border"><table className="w-full min-w-[720px] text-sm"><thead className="bg-muted"><tr><th className="p-2 text-left">Item</th><th className="p-2 text-left">Presença</th><th className="p-2 text-left">Estado</th><th className="p-2 text-left">Observação</th></tr></thead><tbody>{f.checklist.map((c, i) => <tr key={c.item} className="border-t"><td className="p-2">{c.item}</td><td className="p-2"><Sel v={c.presenca} on={(v) => setItem(i, "presenca", v)} ops={PRESENCA} /></td><td className="p-2"><Sel v={c.estado} on={(v) => setItem(i, "estado", v)} ops={ESTADO} /></td><td className="p-2"><Input value={c.obs} onChange={(e) => setItem(i, "obs", e.target.value)} /></td></tr>)}</tbody></table></div>
          <div className="mt-3 space-y-1"><Label>Observações gerais da vistoria</Label><Textarea value={f.obs_vistoria ?? ""} onChange={(e) => set("obs_vistoria")(e.target.value)} /></div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">{campo("Responsável pela vistoria", "vistoriador")}{campo("Data da vistoria", "data_vistoria", "date")}<div className="space-y-1"><Label>Situação</Label><Sel v={f.situacao} on={set("situacao")} ops={SITUACOES} /></div></div></section>
      </div>
      <DialogFooter><Button variant="outline" onClick={() => setAberto(false)}>Cancelar</Button><Button disabled={salvar.isPending || processandoImagens} onClick={() => salvar.mutate()}>{salvar.isPending ? "Salvando…" : "Salvar veículo"}</Button></DialogFooter>
    </DialogContent></Dialog>

    <AlertDialog open={Boolean(excluir)} onOpenChange={(v) => !v && setExcluir(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir registro?</AlertDialogTitle><AlertDialogDescription>O veículo {excluir?.placa ?? `${excluir?.marca} ${excluir?.modelo}`} e seu checklist serão removidos definitivamente.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={(e) => { e.preventDefault(); if (excluir) remover.mutate(excluir.id); }}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
