import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { useSessao } from "@/hooks/useSessao";
import { temAcesso } from "@/lib/permissoes";
import { excluirOrdem } from "@/lib/os-api";
import { cn } from "@/lib/utils";

type ExcluirOSButtonProps = {
  id: string;
  numero: string;
  somenteIcone?: boolean;
};

export function ExcluirOSButton({ id, numero, somenteIcone = false }: ExcluirOSButtonProps) {
  const [aberto, setAberto] = useState(false);
  const { data: sessao } = useSessao();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const podeExcluir = temAcesso(sessao, "OS", "EXCLUIR");

  const exclusao = useMutation({
    mutationFn: () => excluirOrdem(id),
    onSuccess: async () => {
      setAberto(false);
      queryClient.removeQueries({ queryKey: ["ordem-servico", id] });
      queryClient.removeQueries({ queryKey: ["ordem-servico-historico", id] });
      await queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      toast.success(`Ordem de Serviço ${numero} excluída.`);
      navigate({ to: "/ordens-servico", replace: true });
    },
    onError: () => {
      toast.error("Você não tem permissão para excluir esta Ordem de Serviço.");
    },
  });

  if (!podeExcluir) return null;

  return (
    <AlertDialog open={aberto} onOpenChange={(novoEstado) => !exclusao.isPending && setAberto(novoEstado)}>
      <Button
        type="button"
        variant={somenteIcone ? "ghost" : "destructive"}
        size={somenteIcone ? "icon" : "default"}
        aria-label="Excluir O.S."
        title="Excluir O.S."
        onClick={() => setAberto(true)}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {!somenteIcone && "Excluir O.S."}
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Ordem de Serviço</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir esta Ordem de Serviço? Esta ação é irreversível.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={exclusao.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={exclusao.isPending}
            className={cn(buttonVariants({ variant: "destructive" }))}
            onClick={(evento) => {
              evento.preventDefault();
              exclusao.mutate();
            }}
          >
            {exclusao.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Confirmar Exclusão
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}