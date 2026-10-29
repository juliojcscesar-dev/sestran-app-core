import { useSyncExternalStore } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { assinarInstalacao, instalacaoDisponivel, instalarAplicativo } from "@/lib/instalacao";

/** Aparece somente quando o Chrome ou o Edge oferecem a instalação (fora do aplicativo já instalado). */
export function BotaoInstalar() {
  const disponivel = useSyncExternalStore(assinarInstalacao, instalacaoDisponivel, () => false);
  if (!disponivel) return null;
  return (
    <Button
      variant="outline"
      size="sm"
      title="Instalar a Central de Sistema neste computador ou celular"
      onClick={async () => {
        const instalado = await instalarAplicativo();
        if (instalado) toast.success("Aplicativo instalado. Ele pode ser aberto pelo ícone SESTRAN.");
      }}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Instalar aplicativo</span>
    </Button>
  );
}
