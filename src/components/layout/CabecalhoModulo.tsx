import type { LucideIcon } from "lucide-react";

/** Cabeçalho padrão dos módulos: ícone em círculo azul-marinho, título em caixa alta e subtítulo em itálico. */
export function CabecalhoModulo({ icone: Icone, titulo, subtitulo }: { icone: LucideIcon; titulo: string; subtitulo: string }) {
  return <div className="flex min-w-0 items-center gap-3">
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-accent shadow-sm"><Icone className="h-7 w-7" /></span>
    <div className="min-w-0">
      <h1 className="break-words font-display text-xl font-bold uppercase leading-tight text-primary sm:text-2xl">{titulo}</h1>
      <p className="text-sm italic text-muted-foreground">{subtitulo}</p>
    </div>
  </div>;
}
