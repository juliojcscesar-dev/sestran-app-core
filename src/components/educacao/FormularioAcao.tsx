import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIAS_ACAO, CATEGORIA_ACAO_LABEL, STATUS_ACAO, STATUS_ACAO_LABEL, type CategoriaAcao, type StatusAcao } from "@/lib/educacao";
import { atualizarAcao, criarAcao, criarTema, listarReferenciasEducacao, type AcaoEducativa, type DadosAcao } from "@/lib/educacao-api";

const NENHUM = "__nenhum__";

type Estado = {
  titulo: string; descricao: string; data_acao: string; horario_inicio: string; horario_fim: string;
  categoria: CategoriaAcao; status: StatusAcao; local: string; publico_alvo: string;
  participantes: string; observacoes: string; escola_id: string; orientador_id: string; tema_id: string;
};

const vazio: Estado = {
  titulo: "", descricao: "", data_acao: "", horario_inicio: "", horario_fim: "", categoria: "EVENTO_ESCOLA",
  status: "AGENDADA", local: "", publico_alvo: "", participantes: "", observacoes: "", escola_id: NENHUM,
  orientador_id: NENHUM, tema_id: NENHUM,
};

function estadoDe(acao?: AcaoEducativa | null): Estado {
  if (!acao) return vazio;
  return {
    titulo: acao.titulo, descricao: acao.descricao ?? "", data_acao: acao.data_acao,
    horario_inicio: acao.horario_inicio?.slice(0, 5) ?? "", horario_fim: acao.horario_fim?.slice(0, 5) ?? "",
    categoria: acao.categoria, status: acao.status, local: acao.local ?? "", publico_alvo: acao.publico_alvo ?? "",
    participantes: acao.participantes == null ? "" : String(acao.participantes), observacoes: acao.observacoes ?? "",
    escola_id: acao.escola_id ?? NENHUM, orientador_id: acao.orientador_id ?? NENHUM, tema_id: acao.tema_id ?? NENHUM,
  };
}

export function FormularioAcao({ aberto, onAbertoChange, acao }: { aberto: boolean; onAbertoChange: (aberto: boolean) => void; acao?: AcaoEducativa | null }) {
  const queryClient = useQueryClient();
  const [estado, setEstado] = useState<Estado>(() => estadoDe(acao));
  const [novoTema, setNovoTema] = useState("");
  const referencias = useQuery({ queryKey: ["educacao", "referencias"], queryFn: listarReferenciasEducacao, enabled: aberto });

  useEffect(() => { if (aberto) setEstado(estadoDe(acao)); }, [aberto, acao]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (estado.titulo.trim().length < 3) throw new Error("Informe um título com pelo menos 3 caracteres.");
      if (!estado.data_acao) throw new Error("Informe a data da ação.");
      if (estado.horario_inicio && estado.horario_fim && estado.horario_fim <= estado.horario_inicio) throw new Error("O horário final deve ser posterior ao inicial.");
      const dados: DadosAcao = {
        titulo: estado.titulo.trim(), descricao: estado.descricao.trim() || null, data_acao: estado.data_acao,
        horario_inicio: estado.horario_inicio || null, horario_fim: estado.horario_fim || null,
        categoria: estado.categoria, status: estado.status, local: estado.local.trim() || null,
        publico_alvo: estado.publico_alvo.trim() || null,
        participantes: estado.participantes ? Number(estado.participantes) : null,
        observacoes: estado.observacoes.trim() || null,
        escola_id: estado.escola_id === NENHUM ? null : estado.escola_id,
        orientador_id: estado.orientador_id === NENHUM ? null : estado.orientador_id,
        tema_id: estado.tema_id === NENHUM ? null : estado.tema_id,
      };
      if (acao) await atualizarAcao(acao.id, dados); else await criarAcao(dados);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educacao"] });
      queryClient.invalidateQueries({ queryKey: ["painel"] });
      toast.success(acao ? "Ação educativa atualizada." : "Ação educativa cadastrada.");
      onAbertoChange(false);
    },
    onError: (erro) => toast.error(erro instanceof Error ? erro.message : "Não foi possível salvar a ação."),
  });

  const adicionarTema = useMutation({
    mutationFn: () => criarTema(novoTema),
    onSuccess: (tema) => {
      queryClient.invalidateQueries({ queryKey: ["educacao", "referencias"] });
      setEstado((e) => ({ ...e, tema_id: tema.id })); setNovoTema(""); toast.success("Tema cadastrado.");
    },
    onError: () => toast.error("Não foi possível cadastrar o tema."),
  });

  const campo = (chave: keyof Estado, valor: string) => setEstado((e) => ({ ...e, [chave]: valor }));

  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>{acao ? "Editar ação educativa" : "Nova ação educativa"}</DialogTitle><DialogDescription>Registre a programação e a situação da atividade.</DialogDescription></DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><Label htmlFor="acao-titulo">Título *</Label><Input id="acao-titulo" value={estado.titulo} onChange={(e) => campo("titulo", e.target.value)} /></div>
          <div><Label htmlFor="acao-categoria">Categoria *</Label><Select value={estado.categoria} onValueChange={(v) => campo("categoria", v)}><SelectTrigger id="acao-categoria"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIAS_ACAO.map((c) => <SelectItem key={c} value={c}>{CATEGORIA_ACAO_LABEL[c]}</SelectItem>)}</SelectContent></Select></div>
          <div><Label htmlFor="acao-status">Situação *</Label><Select value={estado.status} onValueChange={(v) => campo("status", v)}><SelectTrigger id="acao-status"><SelectValue /></SelectTrigger><SelectContent>{STATUS_ACAO.map((s) => <SelectItem key={s} value={s}>{STATUS_ACAO_LABEL[s]}</SelectItem>)}</SelectContent></Select></div>
          <div><Label htmlFor="acao-data">Data *</Label><Input id="acao-data" type="date" value={estado.data_acao} onChange={(e) => campo("data_acao", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2"><div><Label htmlFor="acao-inicio">Início</Label><Input id="acao-inicio" type="time" value={estado.horario_inicio} onChange={(e) => campo("horario_inicio", e.target.value)} /></div><div><Label htmlFor="acao-fim">Fim</Label><Input id="acao-fim" type="time" value={estado.horario_fim} onChange={(e) => campo("horario_fim", e.target.value)} /></div></div>
          <div><Label htmlFor="acao-escola">Escola</Label><Select value={estado.escola_id} onValueChange={(v) => campo("escola_id", v)}><SelectTrigger id="acao-escola"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NENHUM}>Nenhuma</SelectItem>{(referencias.data?.escolas ?? []).map((i) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent></Select></div>
          <div><Label htmlFor="acao-orientador">Orientador</Label><Select value={estado.orientador_id} onValueChange={(v) => campo("orientador_id", v)}><SelectTrigger id="acao-orientador"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NENHUM}>Nenhum</SelectItem>{(referencias.data?.orientadores ?? []).map((i) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent></Select></div>
          <div><Label htmlFor="acao-tema">Tema</Label><Select value={estado.tema_id} onValueChange={(v) => campo("tema_id", v)}><SelectTrigger id="acao-tema"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NENHUM}>Nenhum</SelectItem>{(referencias.data?.temas ?? []).map((i) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent></Select></div>
          <div><Label htmlFor="novo-tema">Cadastrar tema</Label><div className="flex gap-2"><Input id="novo-tema" value={novoTema} onChange={(e) => setNovoTema(e.target.value)} placeholder="Nome do tema" /><Button type="button" size="icon" variant="outline" aria-label="Cadastrar tema" disabled={novoTema.trim().length < 3 || adicionarTema.isPending} onClick={() => adicionarTema.mutate()}><Plus className="h-4 w-4" /></Button></div></div>
          <div><Label htmlFor="acao-local">Local</Label><Input id="acao-local" value={estado.local} onChange={(e) => campo("local", e.target.value)} /></div>
          <div><Label htmlFor="acao-publico">Público-alvo</Label><Input id="acao-publico" value={estado.publico_alvo} onChange={(e) => campo("publico_alvo", e.target.value)} /></div>
          <div><Label htmlFor="acao-participantes">Participantes</Label><Input id="acao-participantes" type="number" min="0" value={estado.participantes} onChange={(e) => campo("participantes", e.target.value)} /></div>
          <div className="md:col-span-2"><Label htmlFor="acao-descricao">Descrição</Label><Textarea id="acao-descricao" value={estado.descricao} onChange={(e) => campo("descricao", e.target.value)} /></div>
          <div className="md:col-span-2"><Label htmlFor="acao-observacoes">Observações</Label><Textarea id="acao-observacoes" value={estado.observacoes} onChange={(e) => campo("observacoes", e.target.value)} /></div>
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={() => onAbertoChange(false)}>Cancelar</Button><Button type="button" disabled={salvar.isPending} onClick={() => salvar.mutate()}>{salvar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}