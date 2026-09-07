import { useState } from "react";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type OpcaoSeletor = { id: string; rotulo: string; detalhe?: string };

type Props = {
  opcoes: OpcaoSeletor[];
  valor: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  vazio?: string;
  podeCriar?: boolean;
  onCriar?: (nome: string) => Promise<OpcaoSeletor>;
  permiteLimpar?: boolean;
  disabled?: boolean;
  id?: string;
};

export function SeletorRegistro({
  opcoes,
  valor,
  onChange,
  placeholder = "Selecione...",
  vazio = "Nenhum registro encontrado.",
  podeCriar = false,
  onCriar,
  permiteLimpar = true,
  disabled = false,
  id,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [criando, setCriando] = useState(false);

  const selecionado = opcoes.find((o) => o.id === valor) ?? null;
  const termo = busca.trim();
  const existeIgual = opcoes.some((o) => o.rotulo.toLowerCase() === termo.toLowerCase());

  async function criar() {
    if (!onCriar || !termo) return;
    setCriando(true);
    try {
      const novo = await onCriar(termo);
      onChange(novo.id);
      setBusca("");
      setAberto(false);
    } finally {
      setCriando(false);
    }
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={aberto}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selecionado && "text-muted-foreground",
          )}
        >
          <span className="truncate">{selecionado?.rotulo ?? placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Pesquisar..." value={busca} onValueChange={setBusca} />
          <CommandList>
            <CommandEmpty>
              {podeCriar && termo ? (
                <button
                  type="button"
                  onClick={criar}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  {criando ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  )}
                  Cadastrar “{termo}”
                </button>
              ) : (
                <p className="px-3 py-4 text-sm text-muted-foreground">{vazio}</p>
              )}
            </CommandEmpty>
            <CommandGroup>
              {permiteLimpar && (
                <CommandItem
                  value="__limpar__"
                  onSelect={() => {
                    onChange(null);
                    setAberto(false);
                  }}
                >
                  <span className="text-muted-foreground">Não informar</span>
                </CommandItem>
              )}
              {opcoes.map((opcao) => (
                <CommandItem
                  key={opcao.id}
                  value={`${opcao.rotulo} ${opcao.detalhe ?? ""}`}
                  onSelect={() => {
                    onChange(opcao.id);
                    setAberto(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      valor === opcao.id ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden="true"
                  />
                  <span className="truncate">
                    {opcao.rotulo}
                    {opcao.detalhe ? (
                      <span className="ml-2 text-xs text-muted-foreground">{opcao.detalhe}</span>
                    ) : null}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            {podeCriar && termo && !existeIgual && opcoes.length > 0 && (
              <CommandGroup>
                <CommandItem value={`criar-${termo}`} onSelect={criar}>
                  {criando ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  )}
                  Cadastrar “{termo}”
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
