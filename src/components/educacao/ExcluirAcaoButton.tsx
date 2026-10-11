import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useSessao } from "@/hooks/useSessao";
import { temAcesso } from "@/lib/permissoes";
import { excluirAcao } from "@/lib/educacao-api";

export function ExcluirAcaoButton({ id, titulo, onExcluida }: { id: string; titulo: string; onExcluida: () => void }) {
  const [aberto, setAberto] = useState(false);
  const { data: sessao } = useSessao();
  const qc = useQueryClient();
  const podeExcluir = temAcesso(sessao, "EDUCACAO", "EXCLUIR");
  const exclusao = useMutation({
    mutationFn: async () => {
      if (!podeExcluir) throw new Error("Exclusão não autorizada.");
      await excluirAcao(id);
    },
    onSuccess: async () => {
      setAberto(false);
      onExcluida();
      await Promise.all([qc.invalidateQueries({ queryKey: ["educacao"] }), qc.invalidateQueries({ queryKey: ["painel"] })]);
      toast.success("Ação educativa excluída.");
    },
    onError: () => toast.error("Não foi possível excluir a ação. Verifique sua autorização com o administrador."),
  });
  if (!podeExcluir) return null;
  return <AlertDialog open={aberto} onOpenChange={v => { if (!exclusao.isPending) setAberto(v); }}>
    <Button type="button" variant="destructive" onClick={() => setAberto(true)}><Trash2 className="mr-2 h-4 w-4" />Excluir ação</Button>
    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir ação educativa</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir “{titulo}”? Esta ação é irreversível.</AlertDialogDescription></AlertDialogHeader>
      <AlertDialogFooter><AlertDialogCancel disabled={exclusao.isPending}>Cancelar</AlertDialogCancel><AlertDialogAction className={buttonVariants({ variant: "destructive" })} disabled={exclusao.isPending || !podeExcluir} onClick={e => { e.preventDefault(); exclusao.mutate(); }}>{exclusao.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar exclusão</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}