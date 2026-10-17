import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EditorTexto } from "@/components/EditorTexto";
import { textoSimples } from "@/lib/texto-formatado";
import { EditorRelatorio } from "@/components/EditorRelatorio";
import type { ImagemRelatorio } from "@/lib/relatorio-imagens";
import { STATUS_ACAO, STATUS_ACAO_LABEL, type CategoriaAcao, type StatusAcao } from "@/lib/educacao";
import { atualizarAcao, criarAcao, listarReferenciasEducacao, type AcaoEducativa, type DadosAcao } from "@/lib/educacao-api";
import { useSessao } from "@/hooks/useSessao";
import { temAcesso } from "@/lib/permissoes";
import { supabase } from "@/integrations/supabase/client";

import { CampoCadastroEducativo } from "@/components/educacao/CampoCadastroEducativo";

const NENHUM = "__nenhum__";

type Estado = {
  tipo_atividade: string; endereco: string; numero_endereco: string; bairro: string; equipe: string; relatorio_texto: string;
  titulo: string; descricao: string; data_acao: string; horario_inicio: string; horario_fim: string;
  categoria: CategoriaAcao; status: StatusAcao; status_manual: boolean; local: string; publico_alvo: string;
  participantes: string; observacoes: string; escola_id: string; orientador_id: string; tema_id: string;
};

const vazio: Estado = {
  tipo_atividade: "", endereco: "", numero_endereco: "", bairro: "", equipe: "", relatorio_texto: "",
  titulo: "", descricao: "", data_acao: "", horario_inicio: "", horario_fim: "", categoria: "EVENTO_ESCOLA",
  status: "AGENDADA", status_manual: false, local: "", publico_alvo: "", participantes: "", observacoes: "", escola_id: NENHUM,
  orientador_id: NENHUM, tema_id: NENHUM,
};

function estadoDe(acao?: AcaoEducativa | null): Estado {
  if (!acao) return vazio;
  return {
    tipo_atividade: acao.tipo_atividade ?? "", endereco: acao.endereco ?? "", numero_endereco: acao.numero_endereco ?? "", bairro: acao.bairro ?? "", equipe: acao.equipe ?? "", relatorio_texto: acao.relatorio_texto ?? "",
    titulo: acao.titulo, descricao: acao.descricao ?? "", data_acao: acao.data_acao,
    horario_inicio: acao.horario_inicio?.slice(0, 5) ?? "", horario_fim: acao.horario_fim?.slice(0, 5) ?? "",
    categoria: acao.categoria, status: acao.status, status_manual: Boolean(acao.status_manual), local: acao.local ?? "", publico_alvo: acao.publico_alvo ?? "",
    participantes: acao.participantes == null ? "" : String(acao.participantes), observacoes: acao.observacoes ?? "",
    escola_id: acao.escola_id ?? NENHUM, orientador_id: acao.orientador_id ?? NENHUM, tema_id: acao.tema_id ?? NENHUM,
  };
}

export function FormularioAcao({ aberto, onAbertoChange, acao, duplicando = false }: { aberto: boolean; onAbertoChange: (aberto: boolean) => void; acao?: AcaoEducativa | null; duplicando?: boolean }) {
  const queryClient = useQueryClient();
  const { data: sessao } = useSessao();
  const podePreencher = temAcesso(sessao, "EDUCACAO", "OPERADOR") && (duplicando || !acao?.arquivada || temAcesso(sessao, "EDUCACAO", "EXCLUIR"));
  const [estado, setEstado] = useState<Estado>(() => estadoDe(acao));
  const podeExcluir = temAcesso(sessao, "EDUCACAO", "EXCLUIR");
  const [imagens, setImagens] = useState<ImagemRelatorio[]>([]);
  const referencias = useQuery({ queryKey: ["educacao", "referencias"], queryFn: listarReferenciasEducacao, enabled: aberto });
  const [buscaEquipe, setBuscaEquipe] = useState("");
  const nomesEquipe = useQuery({
    queryKey: ["educacao", "nomes-equipe"], enabled: aberto,
    queryFn: async () => {
      const { data, error } = await supabase.from("acoes_educativas").select("equipe").not("equipe", "is", null).limit(2000);
      if (error) throw error;
      const nomes = new Set<string>();
      for (const r of data ?? []) for (const n of String(r.equipe ?? "").split(/[\n,;]+/)) { const t = n.trim(); if (t) nomes.add(t); }
      return [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR"));
    },
  });
  const adicionarNome = () => {
    const nome = buscaEquipe.trim(); if (!nome) return;
    setEstado(e => { const atuais = e.equipe.split(/\n/).map(s => s.trim()).filter(Boolean); return atuais.includes(nome) ? e : { ...e, equipe: [...atuais, nome].join("\n") }; });
    setBuscaEquipe("");
  };

  useEffect(() => { if (aberto) { setEstado(duplicando ? { ...estadoDe(acao), status: "AGENDADA", status_manual: false } : estadoDe(acao)); setImagens(acao?.relatorio_imagens ?? []); } }, [aberto, acao, duplicando]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!podePreencher) throw new Error("Solicite ao administrador a liberação para preencher este módulo.");
      if (textoSimples(estado.titulo).trim().length < 3) throw new Error("Informe um título com pelo menos 3 caracteres.");
      if (!estado.categoria) throw new Error("Selecione uma categoria.");
      if (!estado.data_acao) throw new Error("Informe a data da ação.");
      if (estado.horario_inicio && estado.horario_fim && estado.horario_fim <= estado.horario_inicio) throw new Error("O horário final deve ser posterior ao inicial.");
      const dados: DadosAcao = {
        tipo_atividade: estado.tipo_atividade.trim() || null, endereco: estado.endereco.trim() || null, numero_endereco: estado.numero_endereco.trim() || null, bairro: estado.bairro.trim() || null, equipe: estado.equipe.trim() || null, relatorio_texto: estado.relatorio_texto.trim() || null, relatorio_imagens: imagens,
        titulo: estado.titulo.trim(), descricao: estado.descricao.trim() || null, data_acao: estado.data_acao,
        horario_inicio: estado.horario_inicio || null, horario_fim: estado.horario_fim || null,
        categoria: estado.categoria, status: estado.status, status_manual: estado.status_manual, local: estado.local.trim() || null,
        publico_alvo: estado.publico_alvo.trim() || null,
        participantes: estado.participantes ? Number(estado.participantes) : null,
        observacoes: estado.observacoes.trim() || null,
        escola_id: estado.escola_id === NENHUM ? null : estado.escola_id,
        orientador_id: estado.orientador_id === NENHUM ? null : estado.orientador_id,
        tema_id: estado.tema_id === NENHUM ? null : estado.tema_id,
      };
      if (acao && !duplicando) await atualizarAcao(acao.id, dados); else await criarAcao(dados);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educacao"] });
      queryClient.invalidateQueries({ queryKey: ["painel"] });
      toast.success(duplicando ? "Ação educativa duplicada." : acao ? "Ação educativa atualizada." : "Ação educativa cadastrada.");
      onAbertoChange(false);
    },
    onError: (erro: unknown) => toast.error(erro instanceof Error ? erro.message : typeof erro === "object" && erro !== null && "message" in erro ? String(erro.message) : "Não foi possível salvar a ação."),
  });

  const campo = (chave: keyof Estado, valor: string | boolean) => setEstado((e) => ({ ...e, [chave]: valor }));

  if (!podePreencher) return null;

  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>{duplicando ? "Duplicar ação educativa" : acao ? "Editar ação educativa" : "Nova ação educativa"}</DialogTitle><DialogDescription>Registre a programação e a situação da atividade.</DialogDescription></DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><Label htmlFor="acao-titulo">Título da Ação *</Label><EditorTexto id="acao-titulo" rotulo="Título da Ação" compacto value={estado.titulo} onChange={(valor) => campo("titulo", valor)} /></div>
          <CampoCadastroEducativo tipo="categorias_educativas" rotulo="Categoria" id="acao-categoria" valor={estado.categoria} opcoes={referencias.data?.categorias ?? []} onChange={v => campo("categoria", v)} podeExcluir={podeExcluir} obrigatorio />
          <div><Label htmlFor="acao-status">Situação *</Label><Select value={estado.status_manual ? estado.status : "__auto"} onValueChange={(v) => { if (v === "__auto") campo("status_manual", false); else { campo("status_manual", true); campo("status", v); } }}><SelectTrigger id="acao-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__auto">Automática pelo calendário ({STATUS_ACAO_LABEL[estado.status]})</SelectItem>{STATUS_ACAO.map((s) => <SelectItem key={s} value={s}>{STATUS_ACAO_LABEL[s]}</SelectItem>)}</SelectContent></Select></div>
          <div><Label htmlFor="acao-data">Data do evento *</Label><Input id="acao-data" type="date" value={estado.data_acao} onChange={(e) => campo("data_acao", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2"><div><Label htmlFor="acao-inicio">Início</Label><Input id="acao-inicio" type="time" value={estado.horario_inicio} onChange={(e) => campo("horario_inicio", e.target.value)} /></div><div><Label htmlFor="acao-fim">Término</Label><Input id="acao-fim" type="time" value={estado.horario_fim} onChange={(e) => campo("horario_fim", e.target.value)} /></div></div>
          <CampoCadastroEducativo tipo="escolas" rotulo="Escola" id="acao-escola" valor={estado.escola_id} opcoes={referencias.data?.escolas ?? []} onChange={v => campo("escola_id", v)} podeExcluir={podeExcluir} />
          <CampoCadastroEducativo tipo="temas_educativos" rotulo="Tema" id="acao-tema" valor={estado.tema_id} opcoes={referencias.data?.temas ?? []} onChange={v => campo("tema_id", v)} podeExcluir={podeExcluir} />
          <div><Label htmlFor="acao-local">Local</Label><Input id="acao-local" value={estado.local} onChange={(e) => campo("local", e.target.value)} /></div>
          <div className="md:col-span-2"><Label htmlFor="acao-endereco">Endereço</Label><Input id="acao-endereco" value={estado.endereco} onChange={e => campo("endereco", e.target.value)} /></div>
          <div><Label htmlFor="acao-numero">Número</Label><Input id="acao-numero" value={estado.numero_endereco} onChange={e => campo("numero_endereco", e.target.value)} /></div>
          <div><Label htmlFor="acao-bairro">Bairro</Label><Input id="acao-bairro" value={estado.bairro} onChange={e => campo("bairro", e.target.value)} /></div>
          <div className="md:col-span-2"><Label htmlFor="acao-equipe">Equipe</Label>
            <div className="mb-2 flex gap-2"><Input list="acao-equipe-nomes" aria-label="Buscar nome já salvo na equipe" placeholder="Buscar nome já salvo…" value={buscaEquipe} onChange={e => setBuscaEquipe(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); adicionarNome(); } }} /><Button type="button" variant="outline" onClick={adicionarNome}>Adicionar</Button></div>
            <datalist id="acao-equipe-nomes">{(nomesEquipe.data ?? []).map(n => <option key={n} value={n} />)}</datalist>
            <Textarea id="acao-equipe" value={estado.equipe} onChange={e => campo("equipe", e.target.value)} /></div>
          <div><Label htmlFor="acao-publico">Público-alvo</Label><Input id="acao-publico" value={estado.publico_alvo} onChange={(e) => campo("publico_alvo", e.target.value)} /></div>
          <div className="md:col-span-2"><Label htmlFor="acao-descricao">Atividade</Label><EditorTexto id="acao-descricao" rotulo="Atividade" value={estado.descricao} onChange={(valor) => campo("descricao", valor)} /></div>
          <EditorRelatorio texto={estado.relatorio_texto} onTexto={v => campo("relatorio_texto", v)} imagens={imagens} onImagens={setImagens} />
          <div className="md:col-span-2"><Label htmlFor="acao-observacoes">Observações</Label><EditorTexto id="acao-observacoes" rotulo="Observações" value={estado.observacoes} onChange={(valor) => campo("observacoes", valor)} /></div>
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={() => onAbertoChange(false)}>Cancelar</Button><Button type="button" disabled={salvar.isPending} onClick={() => salvar.mutate()}>{salvar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
