import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DatabaseBackup, Upload, Eye, FileDown, FileText, FolderOpen, Plus, Save, Search, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useSessao } from "@/hooks/useSessao";
import { temAcesso } from "@/lib/permissoes";
import { formatarDataBr } from "@/lib/os";
import { hojeIso } from "@/lib/veiculos";
import { exibirDocumento, exibirTelefone, mascararDocumento, mascararTelefone } from "@/lib/mascaras";
import {
  camposCredencial, DOCUMENTOS_CONFERENCIA, ehPcd, gerarCredencialDocx, gerarCredencialPdf, proximoNumeroRegistro,
  TIPOS_CREDENCIAL, TIPOS_GRUPO, urlModelo, validadeAutomatica, type TipoCredencial,
} from "@/lib/credenciais";
import { RelatorioModulo } from "@/components/relatorio/RelatorioModulo";
import { credenciaisHistoricoQuery, credenciaisSistemaQuery } from "@/lib/credenciais-consulta";
import { FILTROS_INICIAIS, filtrarHistorico, mesclarConsulta, type CredencialConsulta } from "@/lib/credenciais-historico";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Registro = Database["public"]["Tables"]["credenciais_vagas"]["Row"];

export const Route = createFileRoute("/_authenticated/credenciais")({
  head: () => ({ meta: [{ title: "Credenciais de Vagas Exclusivas — SESTRAN" }, { name: "description", content: "Solicitação e emissão de credenciais de estacionamento para idosos e pessoas com deficiência." }] }),
  component: PaginaCredenciais,
});

type Form = {
  id: string | null; tipo: TipoCredencial; nome: string; tipo_documento: string; numero_documento: string;
  nascimento: string; telefone: string; endereco: string; numero: string; bairro: string; observacoes: string;
  numero_registro: string; checklist: boolean[]; conferente: string; data_conferencia: string;
  data_emissao: string; data_validade: string; tempo_validade: string; validade_manual: boolean; permitir_sem_checklist: boolean;
};

function vazio(): Form {
  const hoje = hojeIso();
  return { id: null, tipo: "IDOSO", nome: "", tipo_documento: "CPF", numero_documento: "", nascimento: "", telefone: "", endereco: "", numero: "", bairro: "", observacoes: "", numero_registro: "", checklist: [], conferente: "", data_conferencia: "", data_emissao: hoje, data_validade: validadeAutomatica("IDOSO", hoje, ""), tempo_validade: "", validade_manual: false, permitir_sem_checklist: false };
}
function deRegistro(r: Registro): Form {
  return { id: r.id, tipo: r.tipo as TipoCredencial, nome: r.nome, tipo_documento: r.tipo_documento, numero_documento: exibirDocumento(r.tipo_documento, r.numero_documento), nascimento: r.nascimento ?? "", telefone: exibirTelefone(r.telefone), endereco: r.endereco ?? "", numero: r.numero ?? "", bairro: r.bairro ?? "", observacoes: r.observacoes ?? "", numero_registro: r.numero_registro ?? "", checklist: Array.isArray(r.checklist) ? (r.checklist as unknown[]).map(Boolean) : [], conferente: r.conferente ?? "", data_conferencia: r.data_conferencia ?? "", data_emissao: r.data_emissao, data_validade: r.data_validade ?? "", tempo_validade: r.tempo_validade ?? "", validade_manual: r.validade_manual, permitir_sem_checklist: r.permitir_sem_checklist };
}

/** Dados de uma credencial da base existente convertidos para o formulário (renovação). */
function daConsulta(c: CredencialConsulta): Form {
  const doc = (c.documento ?? "").trim();
  const cpf = doc.replace(/\D/g, "").length === 11 && /^[\d.\-\s]+$/.test(doc);
  return {
    ...vazio(), nome: c.nome ?? "", tipo_documento: cpf ? "CPF" : "RG", numero_documento: cpf ? mascararDocumento("CPF", doc) : doc,
    nascimento: c.nascimento ?? "", telefone: exibirTelefone(c.telefone), numero_registro: c.numero === null ? "" : String(c.numero),
  };
}

function PaginaCredenciais() {
  const { data: sessao } = useSessao();
  const podeOperar = temAcesso(sessao, "CREDENCIAIS", "OPERADOR");
  const podeExcluir = temAcesso(sessao, "CREDENCIAIS", "EXCLUIR");
  const podeBackup = temAcesso(sessao, "CREDENCIAIS", "BACKUP");
  const [restaurando, setRestaurando] = useState(false);
  async function baixarBackup() {
    const { data, error } = await supabase.from("credenciais_vagas").select("*").order("criado_em");
    if (error) { toast.error("Não foi possível gerar o backup."); return; }
    const blob = new Blob([JSON.stringify({ sistema: "SESTRAN", modulo: "credenciais_vagas", gerado_em: new Date().toISOString(), registros: data }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `backup_credenciais_${hojeIso()}.json`; a.click(); URL.revokeObjectURL(a.href);
    toast.success(`Backup gerado com ${data?.length ?? 0} registro(s).`);
  }
  async function restaurarBackup(arquivo: File) {
    setRestaurando(true);
    try {
      const json = JSON.parse(await arquivo.text()) as { modulo?: string; registros?: Registro[] };
      if (json.modulo !== "credenciais_vagas" || !Array.isArray(json.registros)) throw new Error("Arquivo de backup inválido.");
      if (!window.confirm(`Restaurar ${json.registros.length} registro(s)? Registros com o mesmo identificador serão substituídos pelos do backup; os demais não são apagados.`)) return;
      const { error } = await supabase.from("credenciais_vagas").upsert(json.registros).select("id");
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["credenciais"] });
      toast.success("Backup restaurado.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível restaurar o backup."); }
    finally { setRestaurando(false); }
  }
  const qc = useQueryClient();
  const [f, setF] = useState<Form>(vazio);
  const [busca, setBusca] = useState("");
  const [excluir, setExcluir] = useState<Registro | null>(null);
  const [gerando, setGerando] = useState<"pdf" | "docx" | null>(null);

  const lista = useQuery(credenciaisSistemaQuery);

  const grupo = ehPcd(f.tipo) ? "PCD" : "IDOSO";
  const docs = DOCUMENTOS_CONFERENCIA[grupo];
  const conferidos = docs.filter((_, i) => f.checklist[i]).length;
  const completo = conferidos === docs.length;

  // Próximo número de registro, separado para Idoso e PCD.
  const proximo = useMemo(
    () => proximoNumeroRegistro((lista.data ?? []).filter((r) => ehPcd(r.tipo) === (grupo === "PCD")).map((r) => r.numero_registro)),
    [lista.data, grupo],
  );
  const sugerido = useRef("");
  useEffect(() => {
    if (!podeOperar || f.id || lista.isPending) return;
    const atual = f.numero_registro.trim();
    if (atual !== "" && atual !== sugerido.current) return; // número digitado à mão ou de renovação: não substituir
    sugerido.current = proximo;
    if (atual !== proximo) setF((a) => ({ ...a, numero_registro: proximo }));
  }, [podeOperar, f.id, f.numero_registro, proximo, lista.isPending]);

  // Renovação: busca da credencial anterior da mesma modalidade, por nome ou nº, na Consulta de Credenciais
  // (base existente + credenciais emitidas no sistema).
  const [buscaRenov, setBuscaRenov] = useState("");
  const renovando = f.tipo.startsWith("RENOVACAO_");
  const historico = useQuery({ ...credenciaisHistoricoQuery, enabled: renovando });
  const consulta = useMemo(() => mesclarConsulta(historico.data ?? [], lista.data ?? []), [historico.data, lista.data]);
  const anteriores = useMemo(() => {
    if (!buscaRenov.trim()) return [];
    return filtrarHistorico(consulta, { ...FILTROS_INICIAIS, busca: buscaRenov, grupo }, new Date()).slice(0, 10);
  }, [consulta, buscaRenov, grupo]);
  function usarParaRenovacao(c: CredencialConsulta) {
    const r = c.sistemaId ? lista.data?.find((x) => x.id === c.sistemaId) : undefined;
    const antigo = r ? deRegistro(r) : daConsulta(c);
    const hoje = hojeIso();
    setF((a) => ({
      ...vazio(), tipo: a.tipo,
      nome: antigo.nome, tipo_documento: antigo.tipo_documento, numero_documento: antigo.numero_documento, nascimento: antigo.nascimento,
      telefone: antigo.telefone, endereco: antigo.endereco, numero: antigo.numero, bairro: antigo.bairro, observacoes: antigo.observacoes,
      numero_registro: antigo.numero_registro, tempo_validade: a.tempo_validade,
      data_emissao: hoje, data_validade: validadeAutomatica(a.tipo, hoje, a.tempo_validade),
    }));
    setBuscaRenov("");
    toast.success(`Dados de ${antigo.nome || `nº ${antigo.numero_registro}`} carregados para a renovação.`);
  }

  function alterar(p: Partial<Form>) {
    setF((a) => {
      const n = { ...a, ...p };
      if (!n.validade_manual && ("data_emissao" in p || "tipo" in p || "tempo_validade" in p || "validade_manual" in p)) n.data_validade = validadeAutomatica(n.tipo, n.data_emissao, n.tempo_validade);
      if ("tipo" in p && ehPcd(p.tipo!) !== ehPcd(a.tipo)) n.checklist = [];
      return n;
    });
  }

  function validar() {
    if (!f.nome.trim()) return "Preencha o nome completo do requerente.";
    if (!f.numero_documento.trim()) return `Informe o número do ${f.tipo_documento}.`;
    if (f.tipo_documento === "CPF" && f.numero_documento.replace(/\D/g, "").length !== 11) return "O CPF deve ter 11 dígitos.";
    if (f.tipo === "TEMPORARIA_PCD" && !f.tempo_validade.trim()) return "Informe o tempo de validade da Credencial Temporária PCD (ex.: 6 meses).";
    if (!f.data_validade) return "Informe a data de validade (ou um tempo reconhecido, ex.: 6 meses).";
    return null;
  }

  const salvar = useMutation({
    mutationFn: async () => {
      const erro = validar();
      if (erro) throw new Error(erro);
      const dados = {
        tipo: f.tipo, nome: f.nome.trim(), tipo_documento: f.tipo_documento, numero_documento: f.numero_documento.trim(),
        nascimento: f.nascimento || null, telefone: f.telefone || null, endereco: f.endereco || null, numero: f.numero || null,
        bairro: f.bairro || null, observacoes: f.observacoes || null, numero_registro: f.numero_registro.trim() || null,
        checklist: docs.map((_, i) => Boolean(f.checklist[i])), conferente: f.conferente || null, data_conferencia: f.data_conferencia || null,
        data_emissao: f.data_emissao, data_validade: f.data_validade || null, tempo_validade: f.tipo === "TEMPORARIA_PCD" ? f.tempo_validade : null,
        validade_manual: f.validade_manual, permitir_sem_checklist: f.permitir_sem_checklist,
      };
      const q = f.id ? supabase.from("credenciais_vagas").update(dados).eq("id", f.id).select().single() : supabase.from("credenciais_vagas").insert(dados).select().single();
      const { data, error } = await q;
      if (error) throw new Error("Não foi possível salvar. Verifique sua permissão.");
      return data;
    },
    onSuccess: (r) => { setF(deRegistro(r)); void qc.invalidateQueries({ queryKey: ["credenciais"] }); toast.success("Solicitação salva."); },
    onError: (e) => toast.error(e.message),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("credenciais_vagas").delete().eq("id", id).select("id");
      if (error || !data?.length) throw new Error("O administrador precisa autorizar a exclusão.");
    },
    onSuccess: (_, id) => { qc.invalidateQueries({ queryKey: ["credenciais"] }); if (f.id === id) setF(vazio()); toast.success("Cadastro excluído."); },
    onError: (e) => toast.error(e.message),
  });

  async function emitir(formato: "pdf" | "docx") {
    const erro = validar();
    if (erro) { toast.error(erro); return; }
    if (!completo && !f.permitir_sem_checklist) { toast.error("Checklist incompleto. Marque “Permitir emitir mesmo com checklist incompleto” para emitir."); return; }
    setGerando(formato);
    try {
      const c = { tipo: f.tipo, nome: f.nome, numero_registro: f.numero_registro, data_emissao: f.data_emissao, data_validade: f.data_validade };
      if (formato === "pdf") await gerarCredencialPdf(c); else await gerarCredencialDocx(c);
      toast.success(`Credencial ${formato.toUpperCase()} gerada.`);
    } catch { toast.error("Não foi possível gerar a credencial."); } finally { setGerando(null); }
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLocaleLowerCase("pt-BR");
    return (lista.data ?? []).filter((r) => `${r.nome} ${r.numero_registro ?? ""} ${r.numero_documento} ${r.numero_documento.replace(/\D/g, "")}`.toLocaleLowerCase("pt-BR").includes(q));
  }, [lista.data, busca]);

  const buscarRelatorio = (tipos: readonly string[]) => async (de?: string, ate?: string) => {
    let q = supabase.from("credenciais_vagas").select("*").in("tipo", tipos as string[]).order("data_emissao");
    if (de) q = q.gte("data_emissao", de);
    if (ate) q = q.lte("data_emissao", ate);
    const { data, error } = await q;
    if (error) throw error;
    return data.map((r) => [r.numero_registro ?? "—", r.nome, `${r.tipo_documento} ${exibirDocumento(r.tipo_documento, r.numero_documento)}`, TIPOS_CREDENCIAL[r.tipo as TipoCredencial] ?? r.tipo, formatarDataBr(r.data_emissao), r.data_validade ? formatarDataBr(r.data_validade) : "—", r.bairro ?? "—"]);
  };
  const colunasRel = ["Nº registro", "Nome", "Documento", "Tipo", "Emissão", "Válido até", "Bairro"];

  const leitura = !podeOperar;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold">Credenciais de Vagas Exclusivas</h1>
          <p className="text-sm text-muted-foreground">Solicitação e emissão de credencial para pessoa idosa e pessoa com deficiência (PCD).</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link to="/credenciais-consulta"><Search className="mr-2 h-4 w-4" />Consultar credenciais existentes</Link></Button>
          <RelatorioModulo modulo="CREDENCIAIS" rotulo="Relatório Idoso" titulo="Credenciais de Idoso" colunas={colunasRel} buscar={buscarRelatorio(TIPOS_GRUPO.IDOSO)} arquivo="relatorio_credenciais_idoso" />
          <RelatorioModulo modulo="CREDENCIAIS" rotulo="Relatório PCD" titulo="Credenciais PCD" colunas={colunasRel} buscar={buscarRelatorio(TIPOS_GRUPO.PCD)} arquivo="relatorio_credenciais_pcd" />
          {podeBackup && <Button variant="outline" onClick={baixarBackup}><DatabaseBackup className="mr-2 h-4 w-4" />Backup</Button>}
          {podeBackup && podeOperar && <Button variant="outline" asChild disabled={restaurando}><label className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />{restaurando ? "Restaurando…" : "Restaurar backup"}<input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => { const a = e.target.files?.[0]; e.target.value = ""; if (a) void restaurarBackup(a); }} /></label></Button>}
          {podeOperar && <Button variant="outline" onClick={() => setF(vazio())}><Plus className="mr-2 h-4 w-4" />Novo registro</Button>}
          {podeOperar && <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}><Save className="mr-2 h-4 w-4" />{salvar.isPending ? "Salvando…" : "Salvar solicitação"}</Button>}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <fieldset disabled={leitura} className="min-w-0 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">1. Identificação do requerente</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="nome">Nome completo *</Label><Input id="nome" maxLength={200} value={f.nome} onChange={(e) => alterar({ nome: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Documento de identificação *</Label>
                <Select value={f.tipo_documento} onValueChange={(v) => alterar({ tipo_documento: v, numero_documento: mascararDocumento(v, f.numero_documento) })}><SelectTrigger aria-label="Documento de identificação"><SelectValue /></SelectTrigger><SelectContent>{["CPF", "RG", "CNH"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label htmlFor="doc">Número do {f.tipo_documento} *</Label><Input id="doc" maxLength={40} inputMode={f.tipo_documento === "CPF" ? "numeric" : "text"} placeholder={f.tipo_documento === "CPF" ? "000.000.000-00" : ""} value={f.numero_documento} onChange={(e) => alterar({ numero_documento: mascararDocumento(f.tipo_documento, e.target.value) })} /></div>
              <div className="space-y-1.5"><Label htmlFor="nasc">Data de nascimento</Label><Input id="nasc" type="date" value={f.nascimento} onChange={(e) => alterar({ nascimento: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="tel">Telefone</Label><Input id="tel" inputMode="tel" placeholder="(44) 0000-0000" value={f.telefone} onChange={(e) => alterar({ telefone: mascararTelefone(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label htmlFor="end">Endereço — Rua/Av.</Label><Input id="end" value={f.endereco} onChange={(e) => alterar({ endereco: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="num">Nº</Label><Input id="num" value={f.numero} onChange={(e) => alterar({ numero: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="bairro">Bairro</Label><Input id="bairro" value={f.bairro} onChange={(e) => alterar({ bairro: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="obs">Observações (opcional)</Label><Textarea id="obs" value={f.observacoes} onChange={(e) => alterar({ observacoes: e.target.value })} /><p className="text-xs text-muted-foreground">Não inclua informações médicas desnecessárias nem cópias de documentos.</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">2. Tipo de credencial solicitada</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={f.tipo} onValueChange={(v) => alterar({ tipo: v as TipoCredencial })} className="gap-2">
                {(Object.keys(TIPOS_CREDENCIAL) as TipoCredencial[]).map((t) => (
                  <label key={t} className="flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm font-medium"><RadioGroupItem value={t} />{TIPOS_CREDENCIAL[t]}</label>
                ))}
              </RadioGroup>
              <p className="mt-2 text-xs text-muted-foreground">A renovação usa o mesmo modelo de credencial correspondente à modalidade.</p>
              {f.tipo.startsWith("RENOVACAO_") && (
                <div className="mt-4 space-y-2 rounded-md border bg-muted/40 p-3">
                  <Label htmlFor="busca-renov" className="flex items-center gap-2"><Search className="h-4 w-4" />Buscar credencial anterior — {grupo === "PCD" ? "PCD" : "Idoso"}</Label>
                  <Input id="busca-renov" placeholder="Digite o nome ou o nº da credencial" value={buscaRenov} onChange={(e) => setBuscaRenov(e.target.value)} />
                  {buscaRenov.trim() && (
                    <div className="max-h-60 space-y-1.5 overflow-y-auto">
                      {historico.isPending ? <p className="text-xs text-muted-foreground">Carregando a Consulta de Credenciais…</p> : anteriores.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma credencial anterior encontrada. Preencha os dados manualmente.</p> :
                        anteriores.map((r) => (
                          <div key={r.chave} className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2">
                            <div className="min-w-0 flex-1"><strong className="block truncate text-sm">{r.nome || "Sem nome cadastrado"}</strong><span className="block truncate text-xs text-muted-foreground">Nº {r.numero ?? "não informado"} · {r.origem === "SISTEMA" ? TIPOS_CREDENCIAL[r.tipoSistema as TipoCredencial] ?? r.tipoSistema : "Base de credenciais existentes"} · válida até {r.validade_indeterminada ? "indeterminada" : r.validade ? formatarDataBr(r.validade) : "—"}</span></div>
                            <Button type="button" size="sm" variant="outline" onClick={() => usarParaRenovacao(r)}>Usar dados</Button>
                          </div>
                        ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">A busca usa a Consulta de Credenciais. Os dados da credencial antiga preenchem uma nova solicitação de renovação; o cadastro antigo não é alterado.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">3. Conferência de documentos obrigatórios — {grupo === "PCD" ? "Pessoa com Deficiência" : "Pessoa Idosa"}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">O sistema guarda somente as marcações de conferência — não envie nem armazene cópias de documentos.</p>
              {docs.map((d, i) => (
                <label key={d} className="flex items-start gap-2 text-sm"><Checkbox className="mt-0.5" checked={Boolean(f.checklist[i])} onCheckedChange={(v) => { const c = [...f.checklist]; c[i] = v === true; alterar({ checklist: c }); }} />{d}</label>
              ))}
              <p className={`rounded-md px-3 py-2 text-sm font-semibold ${completo ? "bg-primary/10 text-primary" : "bg-accent/20 text-accent-foreground"}`}>{completo ? "Conferência completa" : `Conferência pendente (${conferidos}/${docs.length})`}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="conf">Servidor responsável (opcional)</Label><Input id="conf" value={f.conferente} onChange={(e) => alterar({ conferente: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="dconf">Data da conferência (opcional)</Label><Input id="dconf" type="date" value={f.data_conferencia} onChange={(e) => alterar({ data_conferencia: e.target.value })} /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">4. Emissão da credencial</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5"><Label htmlFor="reg">Nº do registro na credencial</Label><Input id="reg" maxLength={20} placeholder="Digite o número manualmente" value={f.numero_registro} onChange={(e) => alterar({ numero_registro: e.target.value })} />
                <p className="text-xs text-muted-foreground" aria-live="polite">{proximo ? <>Próximo número {grupo === "PCD" ? "PCD" : "Idoso"}: <strong className="text-foreground">{proximo}</strong>{f.numero_registro.trim() !== proximo && !leitura && <Button type="button" variant="link" size="sm" className="h-auto px-1.5 py-0 text-xs" onClick={() => alterar({ numero_registro: proximo })}>Usar este número</Button>}</> : `Nenhum número ${grupo === "PCD" ? "PCD" : "Idoso"} digitado ainda.`}</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="emi">Data de emissão</Label><Input id="emi" type="date" value={f.data_emissao} onChange={(e) => alterar({ data_emissao: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="val">Válido até</Label><Input id="val" type="date" disabled={!f.validade_manual} value={f.data_validade} onChange={(e) => alterar({ data_validade: e.target.value })} /></div>
                {f.tipo === "TEMPORARIA_PCD" && <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="tempo">Tempo de validade (ex.: 6 meses) *</Label><Input id="tempo" placeholder="Ex.: 6 meses, 1 ano" value={f.tempo_validade} onChange={(e) => alterar({ tempo_validade: e.target.value })} /></div>}
              </div>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={f.validade_manual} onCheckedChange={(v) => alterar({ validade_manual: v === true })} />Definir a data de validade manualmente</label>
              <p className="text-xs text-muted-foreground">{f.validade_manual ? "Modo manual ativado: selecione a data de validade desejada." : f.tipo === "TEMPORARIA_PCD" ? "A validade é calculada conforme o tempo informado." : "A validade é calculada automaticamente para cinco anos após a emissão."}</p>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={f.permitir_sem_checklist} onCheckedChange={(v) => alterar({ permitir_sem_checklist: v === true })} />Permitir emitir mesmo com checklist incompleto</label>
            </CardContent>
          </Card>
        </fieldset>

        <aside className="min-w-0 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Prévia da credencial</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-semibold text-primary">{TIPOS_CREDENCIAL[f.tipo]}</p>
              <Previa f={f} />
              <VisualizarCredencial f={f} />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" disabled={gerando !== null} onClick={() => emitir("pdf")}><FileText className="mr-2 h-4 w-4" />{gerando === "pdf" ? "Gerando…" : "Imprimir PDF"}</Button>
                <Button className="flex-1" variant="outline" disabled={gerando !== null} onClick={() => emitir("docx")}><FileDown className="mr-2 h-4 w-4" />{gerando === "docx" ? "Gerando…" : "Exportar Word"}</Button>
              </div>
              <p className="text-xs text-muted-foreground">Imprima em papel Carta, sem ajuste de escala, e plastifique.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Cadastros salvos</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Buscar por nome, registro ou documento" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar cadastros" />
              <div className="max-h-[28rem] space-y-2 overflow-y-auto">
                {lista.isPending ? <p className="text-sm text-muted-foreground">Carregando…</p> : filtrados.length === 0 ? <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">Nenhum cadastro encontrado.</p> :
                  filtrados.map((r) => (
                    <div key={r.id} className={`flex items-center gap-2 rounded-md border p-3 ${f.id === r.id ? "border-primary" : ""}`}>
                      <div className="min-w-0 flex-1"><strong className="block truncate text-sm">{r.nome}</strong><span className="block truncate text-xs text-muted-foreground">{TIPOS_CREDENCIAL[r.tipo as TipoCredencial]} · Nº {r.numero_registro || "não informado"}</span></div>
                      <Button size="icon" variant="ghost" title="Abrir" aria-label={`Abrir cadastro de ${r.nome}`} onClick={() => setF(deRegistro(r))}><FolderOpen className="h-4 w-4" /></Button>
                      {podeExcluir && <Button size="icon" variant="ghost" title="Excluir" aria-label={`Excluir cadastro de ${r.nome}`} onClick={() => setExcluir(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <AlertDialog open={Boolean(excluir)} onOpenChange={(o) => !o && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir cadastro?</AlertDialogTitle><AlertDialogDescription>O cadastro de {excluir?.nome} será excluído definitivamente.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { if (excluir) remover.mutate(excluir.id); setExcluir(null); }}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Prévia com o próprio modelo oficial e os campos nas mesmas posições do documento final.
    `paginaInteira` mostra a folha Carta completa em tamanho real (8,5 × 11 pol.). */
function Previa({ f, paginaInteira = false }: { f: Form; paginaInteira?: boolean }) {
  const campos = camposCredencial({ tipo: f.tipo, nome: f.nome, numero_registro: f.numero_registro, data_emissao: f.data_emissao, data_validade: f.data_validade });
  return (
    <div className={paginaInteira ? "mx-auto w-[8.5in] shrink-0 border bg-card shadow" : "overflow-hidden rounded-md border bg-card"}>
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: paginaInteira ? "612 / 792" : "612 / 400", containerType: "inline-size" }}>
        <img src={urlModelo(f.tipo)} alt="Modelo da credencial" className="absolute left-0 top-0 w-full" />
        {campos.map((c, i) => (
          <span key={i} className="absolute whitespace-nowrap font-bold leading-none text-foreground" style={{ left: `${(c.x / 612) * 100}%`, top: `${(c.y / 612) * 100}cqw`, fontSize: `${(c.tamanho / 612) * 100}cqw`, transformOrigin: "left center", fontFamily: "Arial, Helvetica, sans-serif", transform: `translate(${c.centro ? "-50%" : "0"}, -80%)` }}>{c.texto}</span>
        ))}
      </div>
    </div>
  );
}

function VisualizarCredencial({ f }: { f: Form }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full" variant="secondary"><Eye className="mr-2 h-4 w-4" />Visualização</Button>
      </DialogTrigger>
      <DialogContent className="flex h-[92vh] max-w-[calc(100vw-1.5rem)] flex-col gap-3 p-4 sm:max-w-[calc(8.5in+3rem)]">
        <DialogHeader>
          <DialogTitle>Visualização em tamanho real</DialogTitle>
          <DialogDescription>{TIPOS_CREDENCIAL[f.tipo]} — folha Carta completa, como sai na impressão.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto rounded-md bg-muted p-3">
          <Previa f={f} paginaInteira />
        </div>
      </DialogContent>
    </Dialog>
  );
}
