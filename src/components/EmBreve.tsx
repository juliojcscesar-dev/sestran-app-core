import { Link } from "@tanstack/react-router";
import { Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  titulo: string;
  descricao: string;
  itens?: string[];
};

export function EmBreve({ titulo, descricao, itens }: Props) {
  return (
    <div className="mx-auto max-w-3xl">
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-start gap-5 p-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-warning-foreground">
            <Construction className="h-3.5 w-3.5" aria-hidden="true" />
            Disponível em breve
          </span>
          <div>
            <h1 className="text-2xl font-semibold">{titulo}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{descricao}</p>
          </div>
          {itens && itens.length > 0 && (
            <div className="w-full rounded-md border bg-muted/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Previsto para este módulo
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-foreground">
                {itens.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            A estrutura de dados deste módulo já existe no sistema. As telas de cadastro e consulta
            serão liberadas nas próximas etapas.
          </p>
          <Button asChild variant="outline">
            <Link to="/painel">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Voltar ao painel
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
