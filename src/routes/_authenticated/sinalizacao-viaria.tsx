import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardList, Clock, Download, Hammer, Plus, Printer, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useSessao } from "@/hooks/useSessao";
import { temAcesso } from "@/lib/permissoes";
import { prepararImagemRecolhido } from "@/lib/recolhidos-imagens";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Registro = Database["public"]["Tables"]["sinalizacao_os"]["Row"];
const PEDIDOS = ["Ouvidoria - IPM", "Ouvidoria - GEO", "Demanda da Secretaria", "Solicitação interna", "Outro"];
const STATUS = ["Aguardando", "Em Execução", "Concluída", "Cancelada"];
const NATUREZAS = ["Sinalização Vertical", "Sinalização Horizontal", "Quebra-molas", "Semafórico", "Reparos - Placas e Pinturas", "Reparos - Quebra-molas"];
const COR: Record<string, string> = { Aguardando: "border-warning/50 bg-warning/20 text-warning-foreground", "Em Execução": "border-primary/40 bg-primary/10 text-primary", "Concluída": "border-success/40 bg-success/15 text-success", Cancelada: "border-destructive/40 bg-destructive/10 text-destructive" };
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const vazio = () => ({ id: "", pedido: "", numero: "", data: hoje(), status: "Aguardando", natureza: "", naturezaOutra: "", endereco: "", servico: "", funcionario: "", observacao: "", preenchido: "", chefe: "Juarez Santana", cargo: "Gerente de Divisão - Sinalização Viária", imagens: [] as string[] });
const fmt = (s?: string | null) => { if (!s) return "—"; const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
const imgs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export const Route = createFileRoute("/_authenticated/sinalizacao-viaria")({
  head: () => ({ meta: [
    { title: "Sinalização Viária — O.S. | SESTRAN Paranavaí" },
    { name: "description", content: "Painel de ordens de serviço do Departamento Técnico de Sinalização Viária." },
    { property: "og:title", content: "Sinalização Viária — O.S. | SESTRAN Paranavaí" },
    { property: "og:description", content: "Cadastro e acompanhamento das ordens de serviço de sinalização viária." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Sinalizacao,
});

function Sinalizacao() {
  const { data: sessao } = useSessao();
  const qc = useQueryClient();
  const podeEditar = temAcesso(sessao, "OS", "OPERADOR");
  const podeExcluir = temAcesso(sessao, "OS", "EXCLUIR");
  const [f, setF] = useState(vazio());
  const [busca, setBusca] = useState(""); const [fs, setFs] = useState(""); const [fn, setFn] = useState("");
  const [excluir, setExcluir] = useState<Registro | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const set = (k: keyof ReturnType<typeof vazio>, v: string) => setF((p) => ({ ...p, [k]: v }));

  const q = useQuery({ queryKey: ["sinalizacao_os"], queryFn: async () => {
    const { data, error } = await supabase.from("sinalizacao_os").select("*").order("criado_em", { ascending: false });
    if (error) throw error; return data;
  } });
  const ordens = q.data ?? [];
  const [ultimosAplicados, setUltimosAplicados] = useState(false);
  useEffect(() => {
    if (ultimosAplicados || !q.data) return;
    setUltimosAplicados(true);
    const ultima = q.data[0];
    if (ultima) setF((p) => (p.id ? p : { ...p, preenchido: p.preenchido || ultima.preenchido || "", funcionario: p.funcionario || ultima.funcionario || "" }));
  }, [q.data, ultimosAplicados]);
  const lista = useMemo(() => { const t = busca.toLocaleLowerCase("pt-BR"); return ordens.filter((o) => (!fs || o.status === fs) && (!fn || o.natureza === fn) && [o.numero, o.endereco, o.servico, o.funcionario, o.pedido, o.natureza].join(" ").toLocaleLowerCase("pt-BR").includes(t)); }, [ordens, busca, fs, fn]);

  const proximo = () => { let max = 0; ordens.forEach((o) => { const n = parseInt(o.numero.replace(/\D/g, "")); if (n > max) max = n; }); return "OS-" + String(max + 1).padStart(4, "0"); };

  const salvar = useMutation({ mutationFn: async () => {
    const natureza = f.natureza === "Outro" ? (f.naturezaOutra.trim() || "Outro") : f.natureza;
    const dados = { pedido: f.pedido, numero: f.numero.trim() || proximo(), data: f.data, status: f.status, natureza, endereco: f.endereco.trim(), servico: f.servico.trim(), funcionario: f.funcionario.trim() || null, observacao: f.observacao.trim() || null, preenchido: f.preenchido.trim() || null, chefe_imediato: f.chefe.trim() || null, cargo: f.cargo.trim() || null, imagens: f.imagens, atualizado_em: new Date().toISOString() };
    const r = f.id ? await supabase.from("sinalizacao_os").update(dados).eq("id", f.id).select("id") : await supabase.from("sinalizacao_os").insert(dados).select("id");
    if (r.error) throw r.error; if (!r.data?.length) throw new Error("Sem permissão para salvar.");
  }, onSuccess: () => { toast.success(f.id ? "Ordem de serviço atualizada." : "Ordem de serviço salva com sucesso."); setF({ ...vazio(), preenchido: f.preenchido.trim(), funcionario: f.funcionario.trim() }); qc.invalidateQueries({ queryKey: ["sinalizacao_os"] }); }, onError: (e: Error) => toast.error(e.message) });

  const remover = useMutation({ mutationFn: async (id: string) => {
    const { data, error } = await supabase.from("sinalizacao_os").delete().eq("id", id).select("id");
    if (error) throw error; if (!data?.length) throw new Error("Sem permissão para excluir.");
  }, onSuccess: () => { toast.success("Ordem excluída."); setExcluir(null); qc.invalidateQueries({ queryKey: ["sinalizacao_os"] }); }, onError: (e: Error) => toast.error(e.message) });

  function editar(o: Registro) {
    const conhecida = NATUREZAS.includes(o.natureza);
    setF({ id: o.id, pedido: o.pedido, numero: o.numero, data: o.data, status: o.status, natureza: conhecida ? o.natureza : "Outro", naturezaOutra: conhecida ? "" : o.natureza, endereco: o.endereco, servico: o.servico, funcionario: o.funcionario ?? "", observacao: o.observacao ?? "", preenchido: o.preenchido ?? "", chefe: o.chefe_imediato ?? "", cargo: o.cargo ?? "", imagens: imgs(o.imagens) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function anexar(files: FileList | null) {
    if (!files) return; setOcupado(true);
    try { const novas: string[] = []; for (const a of [...files].slice(0, 4 - f.imagens.length)) { if (a.type.startsWith("image/")) novas.push(await prepararImagemRecolhido(a)); } setF((p) => ({ ...p, imagens: [...p.imagens, ...novas].slice(0, 4) })); }
    catch { toast.error("Não foi possível carregar a imagem."); } finally { setOcupado(false); }
  }

  function ver(o: Registro) {
    const w = window.open("", "_blank"); if (!w) { toast.error("Permita pop-ups para visualizar a ordem."); return; }
    const campos = [["Pedido", o.pedido], ["Nº da O.S.", o.numero], ["Data", fmt(o.data)], ["Situação", o.status], ["Natureza", o.natureza], ["Endereço", o.endereco], ["Funcionário(s)", o.funcionario || "—"], ["Serviço", o.servico], ["Observações", o.observacao || "—"]];
    const fotos = imgs(o.imagens).map((s) => `<img src="${s}">`).join("") || "<p>Sem imagens anexadas.</p>";
    w.document.write(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Ordem ${esc(o.numero)}</title><style>body{font:14px Arial;color:#182b43;max-width:850px;margin:30px auto;padding:0 20px}header{text-align:center;border-bottom:2px solid #173f75;padding-bottom:14px}header img{max-height:70px}h1{font-size:20px;color:#173f75}h2{font-size:16px;color:#173f75;margin-top:22px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.box{padding:10px;border:1px solid #ddd;border-radius:6px}.l{font-size:11px;color:#667085;font-weight:bold;text-transform:uppercase}.v{margin-top:5px;white-space:pre-wrap}img{max-width:100%;max-height:280px;margin:8px}button{padding:9px 15px;margin-top:20px}@media print{button{display:none}}</style><header><img src="/assets/logo-header.png" alt=""><div><b>DITRAN - DIRETORIA DE TRÂNSITO</b></div><div>DEPARTAMENTO TÉCNICO DE SINALIZAÇÃO VIÁRIA</div><h1>ORDEM DE SERVIÇO — ${esc(o.numero)}</h1></header><div class="grid">${campos.map(([a, b]) => `<div class="box"><div class="l">${esc(a)}</div><div class="v">${esc(b)}</div></div>`).join("")}</div><h2>Imagens / anexos</h2>${fotos}<p style="margin-top:35px">Preenchimento: <b>${esc(o.preenchido || "—")}</b></p>${o.chefe_imediato || o.cargo ? `<div style="text-align:center;margin-top:70px"><div style="border-top:1px solid #182b43;width:300px;margin:0 auto 6px"></div>${o.chefe_imediato ? `<div>${esc(o.chefe_imediato)}</div>` : ""}${o.cargo ? `<div><b>${esc(o.cargo)}</b></div>` : ""}</div>` : ""}<button onclick="window.print()">Imprimir / Salvar PDF</button></html>`);
    w.document.close();
  }

  function imprimirRelatorio() {
    const w = window.open("", "_blank"); if (!w) { toast.error("Permita pop-ups para imprimir."); return; }
    const linhas = lista.map((o) => `<tr><td>${esc(o.numero)}</td><td>${fmt(o.data)}</td><td>${esc(o.pedido)}</td><td>${esc(o.natureza)}</td><td>${esc(o.endereco)}</td><td>${esc(o.funcionario || "—")}</td><td>${esc(o.status)}</td></tr>`).join("");
    w.document.write(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Relatório — Sinalização Viária</title><style>body{font:12px Arial;margin:24px}header{text-align:center}header img{max-height:70px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #bbb;padding:4px 6px;text-align:left}th{background:#eee}@page{size:A4 landscape;margin:12mm}</style><header><img src="/assets/logo-header.png" alt=""><h2>Ordens de Serviço — Sinalização Viária</h2><p>${lista.length} ordem(ns)</p></header><table><tr><th>Nº</th><th>Data</th><th>Pedido</th><th>Natureza</th><th>Endereço</th><th>Responsável</th><th>Situação</th></tr>${linhas}</table><script>window.onload=()=>window.print()<\/script></html>`);
    w.document.close();
  }

  function exportarCSV() {
    if (!ordens.length) { toast.error("Não há ordens para exportar."); return; }
    const cols = ["numero", "data", "pedido", "status", "natureza", "endereco", "servico", "funcionario", "observacao", "preenchido", "chefe_imediato", "cargo"] as const;
    const csv = [cols.join(";"), ...ordens.map((o) => cols.map((k) => `"${String(o[k] ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`).join(";"))].join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })); a.download = "relatorio_ordens_sinalizacao.csv"; a.click(); URL.revokeObjectURL(a.href);
  }

  const stats = [
    { t: "Total de O.S.", v: ordens.length, s: "Ordens cadastradas", I: ClipboardList },
    { t: "Aguardando", v: ordens.filter((o) => o.status === "Aguardando").length, s: "Na fila de atendimento", I: Clock },
    { t: "Em execução", v: ordens.filter((o) => o.status === "Em Execução").length, s: "Serviços em andamento", I: Hammer },
    { t: "Concluídas", v: ordens.filter((o) => o.status === "Concluída").length, s: "Serviços finalizados", I: CheckCircle2 },
  ];
  const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
  const secao = "sm:col-span-2 border-b pb-1 text-[11px] font-bold tracking-wider text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-semibold tracking-wider text-muted-foreground">DITRAN · DEPARTAMENTO TÉCNICO DE SINALIZAÇÃO VIÁRIA</p><h1 className="font-display text-2xl font-semibold">Painel de Sinalização Viária</h1><p className="text-sm text-muted-foreground">Cadastre, acompanhe e consulte as ordens de serviço do setor.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={exportarCSV}><Download className="mr-2 h-4 w-4" />Exportar CSV</Button><Button variant="outline" onClick={imprimirRelatorio}><Printer className="mr-2 h-4 w-4" />Imprimir relatório</Button></div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ t, v, s, I }) => <Card key={t}><CardContent className="p-4"><div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">{t}<span className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary"><I className="h-4 w-4" /></span></div><p className="mt-2 font-display text-3xl font-semibold">{v}</p><p className="text-xs text-muted-foreground">{s}</p></CardContent></Card>)}
      </div>
      <div className={podeEditar ? "grid items-start gap-5 xl:grid-cols-2" : ""}>
        {podeEditar && <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b"><div><CardTitle className="text-base">{f.id ? "Editar ordem de serviço" : "Nova ordem de serviço"}</CardTitle><p className="text-xs text-muted-foreground">Preencha os dados para registrar a solicitação.</p></div><Badge variant="secondary">{f.id ? "EDITANDO" : "NOVO REGISTRO"}</Badge></CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={(e) => { e.preventDefault(); salvar.mutate(); }} className="grid gap-4 sm:grid-cols-2">
              <p className={secao}>IDENTIFICAÇÃO DO PEDIDO</p>
              <div className="space-y-1.5"><Label>Origem do pedido *</Label><select required className={sel} value={f.pedido} onChange={(e) => set("pedido", e.target.value)}><option value="">Selecione...</option>{PEDIDOS.map((p) => <option key={p}>{p}</option>)}</select></div>
              <div className="space-y-1.5"><Label>Nº da O.S.</Label><Input value={f.numero} onChange={(e) => set("numero", e.target.value)} placeholder="Gerado automaticamente se vazio" /></div>
              <div className="space-y-1.5"><Label>Data de abertura *</Label><Input type="date" required value={f.data} onChange={(e) => set("data", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Situação *</Label><select className={sel} value={f.status} onChange={(e) => set("status", e.target.value)}>{STATUS.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Natureza do serviço *</Label><select required className={sel} value={f.natureza} onChange={(e) => set("natureza", e.target.value)}><option value="">Selecione...</option>{[...NATUREZAS, "Outro"].map((n) => <option key={n}>{n}</option>)}</select></div>
              {f.natureza === "Outro" && <div className="space-y-1.5 sm:col-span-2"><Label>Especifique a natureza</Label><Input value={f.naturezaOutra} onChange={(e) => set("naturezaOutra", e.target.value)} /></div>}
              <p className={secao}>LOCAL E EXECUÇÃO</p>
              <div className="space-y-1.5 sm:col-span-2"><Label>Endereço / local do serviço *</Label><Input required value={f.endereco} onChange={(e) => set("endereco", e.target.value)} placeholder="Rua, número, bairro ou referência" /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Serviço solicitado *</Label><Textarea required value={f.servico} onChange={(e) => set("servico", e.target.value)} placeholder="Descreva o que precisa ser realizado..." /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Funcionário(s) responsável(is)</Label><Input value={f.funcionario} onChange={(e) => set("funcionario", e.target.value)} placeholder="Nome de quem fará o trabalho" /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Observações / descrição do trabalho</Label><Textarea value={f.observacao} onChange={(e) => set("observacao", e.target.value)} placeholder="Detalhes, materiais, medidas ou informações complementares..." /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Imagens / anexos ({f.imagens.length}/4)</Label>
                <Input type="file" accept="image/*" multiple disabled={ocupado || f.imagens.length >= 4} onChange={(e) => { anexar(e.target.files); e.target.value = ""; }} />
                {f.imagens.length > 0 && <div className="flex flex-wrap gap-2">{f.imagens.map((s, i) => <div key={i} className="relative"><img src={s} alt={`Anexo ${i + 1}`} className="h-20 w-20 rounded border object-cover" /><button type="button" aria-label="Excluir imagem" onClick={() => setF((p) => ({ ...p, imagens: p.imagens.filter((_, j) => j !== i) }))} className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"><X className="h-3 w-3" /></button></div>)}</div>}
              </div>
              <p className={secao}>RESPONSÁVEL PELO PREENCHIMENTO</p>
              <div className="space-y-1.5 sm:col-span-2"><Label>Nome de quem preencheu a O.S.</Label><Input value={f.preenchido} onChange={(e) => set("preenchido", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Chefe imediato</Label><Input value={f.chefe} onChange={(e) => set("chefe", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Cargo</Label><Input value={f.cargo} onChange={(e) => set("cargo", e.target.value)} /></div>
              <div className="flex flex-wrap justify-end gap-2 border-t pt-4 sm:col-span-2">
                {f.id && <Button type="button" variant="outline" onClick={() => setF(vazio())}>Cancelar edição</Button>}
                <Button type="button" variant="outline" onClick={() => setF((p) => ({ ...vazio(), id: p.id }))}>Limpar campos</Button>
                <Button type="submit" disabled={salvar.isPending || ocupado}><Plus className="mr-2 h-4 w-4" />{f.id ? "Salvar alterações" : "Salvar ordem de serviço"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b"><div><CardTitle className="text-base">Ordens de serviço</CardTitle><p className="text-xs text-muted-foreground">Exibindo {lista.length} de {ordens.length} ordem(ns).</p></div><Button variant="outline" size="sm" onClick={() => q.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Atualizar</Button></CardHeader>
          <div className="flex flex-wrap gap-2 border-b p-4"><Input className="min-w-40 flex-1" placeholder="Buscar por O.S., endereço, serviço..." value={busca} onChange={(e) => setBusca(e.target.value)} /><select className={`${sel} w-auto`} value={fs} onChange={(e) => setFs(e.target.value)}><option value="">Todas as situações</option>{STATUS.map((s) => <option key={s}>{s}</option>)}</select><select className={`${sel} w-auto`} value={fn} onChange={(e) => setFn(e.target.value)}><option value="">Todas as naturezas</option>{[...NATUREZAS, "Outro"].map((n) => <option key={n}>{n}</option>)}</select></div>
          <div className="max-h-[760px] divide-y overflow-auto px-4">
            {q.isPending ? <p className="py-10 text-center text-sm text-muted-foreground">Carregando...</p> : !lista.length ? <div className="py-12 text-center text-muted-foreground"><p className="font-semibold text-foreground">Nenhuma ordem encontrada</p><p className="text-sm">Cadastre uma nova O.S. ou ajuste os filtros de busca.</p></div> :
              lista.map((o) => <article key={o.id} className="py-4">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold text-primary">{o.numero} · {fmt(o.data)}</p><h4 className="break-words text-sm font-semibold">{o.natureza} — {o.endereco}</h4></div><Badge variant="outline" className={COR[o.status]}>{o.status}</Badge></div>
                <p className="mt-1 text-xs text-muted-foreground">{o.pedido} • Responsável: {o.funcionario || "Não informado"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{o.servico.length > 110 ? o.servico.slice(0, 110) + "…" : o.servico}{imgs(o.imagens).length ? ` • ${imgs(o.imagens).length} imagem(ns)` : ""}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">Preenchido por {o.preenchido || "—"}</span><div className="flex gap-1.5"><Button size="sm" variant="outline" onClick={() => ver(o)}>Ver</Button>{podeEditar && <Button size="sm" variant="outline" onClick={() => editar(o)}>Editar</Button>}{podeExcluir && <Button size="sm" variant="outline" className="text-destructive" onClick={() => setExcluir(o)}>Excluir</Button>}</div></div>
              </article>)}
          </div>
        </Card>
      </div>
      <AlertDialog open={!!excluir} onOpenChange={(a) => !a && setExcluir(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir a ordem {excluir?.numero}?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={(e) => { e.preventDefault(); if (excluir) remover.mutate(excluir.id); }}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
