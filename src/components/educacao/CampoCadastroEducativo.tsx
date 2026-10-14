import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { salvarCadastroEducativo, excluirCadastroEducativo, type TipoCadastroEducativo } from "@/lib/educacao-api";

type Opcao = { id: string; nome: string; ativo: boolean };

export function CampoCadastroEducativo({ tipo, rotulo, id, valor, opcoes, onChange, podeExcluir, obrigatorio = false }: {
  tipo: TipoCadastroEducativo; rotulo: string; id: string; valor: string; opcoes: Opcao[]; onChange: (valor: string) => void; podeExcluir: boolean; obrigatorio?: boolean;
}) {
  const client = useQueryClient();
  const [editor, setEditor] = useState<"novo" | "editar" | null>(null);
  const [nome, setNome] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const selecionado = opcoes.find(o => o.id === valor);
  const atualizar = () => { client.invalidateQueries({ queryKey: ["educacao"] }); client.invalidateQueries({ queryKey: ["painel"] }); };
  const salvar = useMutation({
    mutationFn: () => salvarCadastroEducativo(tipo, nome, editor === "editar" ? selecionado?.id : undefined),
    onSuccess: (item) => { atualizar(); onChange(item.id); setEditor(null); toast.success("Cadastro salvo."); },
    onError: (erro) => toast.error(erro.message || "Não foi possível salvar o cadastro."),
  });
  const excluir = useMutation({
    mutationFn: async () => { if (!podeExcluir || !selecionado) throw new Error("Exclusão não autorizada."); await excluirCadastroEducativo(tipo, selecionado.id); },
    onSuccess: () => { atualizar(); onChange(obrigatorio ? "" : "__nenhum__"); setConfirmar(false); toast.success("Opção excluída dos novos cadastros. Histórico preservado."); },
    onError: (erro) => toast.error(erro.message || "Não foi possível excluir a opção."),
  });
  return <div className="min-w-0">
    <Label htmlFor={id}>{rotulo}{obrigatorio ? " *" : ""}</Label>
    <div className="flex items-center gap-1">
      <Select value={valor} onValueChange={onChange}><SelectTrigger id={id} className="min-w-0 flex-1"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>
        {!obrigatorio && <SelectItem value="__nenhum__">Nenhum(a)</SelectItem>}
        {opcoes.filter(o => o.ativo || o.id === valor).map(o => <SelectItem key={o.id} value={o.id}>{o.nome}{!o.ativo ? " (excluído)" : ""}</SelectItem>)}
      </SelectContent></Select>
      <Button type="button" variant="ghost" size="icon" title={`Cadastrar ${rotulo}`} aria-label={`Cadastrar ${rotulo}`} onClick={() => { setNome(""); setEditor("novo"); }}><Plus className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" title={`Editar ${rotulo}`} aria-label={`Editar ${rotulo}`} disabled={!selecionado?.ativo} onClick={() => { setNome(selecionado?.nome ?? ""); setEditor("editar"); }}><Pencil className="h-4 w-4" /></Button>
      {podeExcluir && <Button type="button" variant="ghost" size="icon" title={`Excluir ${rotulo}`} aria-label={`Excluir ${rotulo}`} disabled={!selecionado?.ativo} onClick={() => setConfirmar(true)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
    </div>
    <Dialog open={editor !== null} onOpenChange={aberto => !aberto && setEditor(null)}><DialogContent><DialogHeader><DialogTitle>{editor === "editar" ? "Editar" : "Cadastrar"} {rotulo}</DialogTitle><DialogDescription>Nome da opção no cadastro educativo.</DialogDescription></DialogHeader><Label htmlFor={`${id}-nome`}>Nome</Label><Input id={`${id}-nome`} maxLength={160} value={nome} onChange={e => setNome(e.target.value)} /><DialogFooter><Button variant="outline" onClick={() => setEditor(null)}>Cancelar</Button><Button disabled={salvar.isPending || nome.trim().length < 3} onClick={() => salvar.mutate()}>Salvar cadastro</Button></DialogFooter></DialogContent></Dialog>
    <AlertDialog open={confirmar} onOpenChange={setConfirmar}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir {rotulo}?</AlertDialogTitle><AlertDialogDescription>“{selecionado?.nome}” deixará de aparecer nas novas seleções. Atividades antigas e seus vínculos serão preservados.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={excluir.isPending}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={excluir.isPending} onClick={e => { e.preventDefault(); excluir.mutate(); }}>Excluir opção</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}