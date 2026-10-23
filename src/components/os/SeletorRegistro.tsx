import { useState } from "react";
import { Check, ChevronsUpDown, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type OpcaoSeletor = { id: string; rotulo: string; detalhe?: string | undefined };

type Props = {
  opcoes: OpcaoSeletor[];
  valor: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  vazio?: string;
  podeCriar?: boolean;
  onCriar?: (nome: string) => Promise<OpcaoSeletor>;
  /** Renomeia um nome salvo; só é exibido quando o usuário pode preencher o módulo. */
  onEditar?: ((opcao: OpcaoSeletor, nome: string) => Promise<void>) | undefined;
  /** Retira um nome salvo da lista; só é exibido com permissão de exclusão. */
  onExcluir?: ((opcao: OpcaoSeletor) => Promise<void>) | undefined;
  /** Nome exibido quando o registro escolhido não está mais na lista ativa. */
  rotuloAtual?: string | null | undefined;
  permiteLimpar?: boolean;
  disabled?: boolean;
  id?: string;
};

function mensagemErro(erro: unknown) {
  return erro && typeof erro === "object" && "message" in erro
    ? String(erro.message)
    : "Verifique sua permissão e tente novamente.";
}

export function SeletorRegistro({
  opcoes,
  valor,
  onChange,
  placeholder = "Selecione...",
  vazio = "Nenhum registro encontrado.",
  podeCriar = false,
  onCriar,
  onEditar,
  onExcluir,
  rotuloAtual,
  permiteLimpar = true,
  disabled = false,
  id,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [criando, setCriando] = useState(false);
  const [criados, setCriados] = useState<OpcaoSeletor[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [nomeEditado, setNomeEditado] = useState("");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [excluindo, setExcluindo] = useState<OpcaoSeletor | null>(null);
  const [processandoExclusao, setProcessandoExclusao] = useState(false);

  const todasOpcoes = [...opcoes, ...criados.filter((item) => !opcoes.some((o) => o.id === item.id))];
  const selecionado = todasOpcoes.find((o) => o.id === valor) ?? null;
  const textoBotao = selecionado?.rotulo ?? (valor && rotuloAtual ? rotuloAtual : null);
  const termo = busca.trim();
  const existeIgual = opcoes.some((o) => o.rotulo.toLowerCase() === termo.toLowerCase());

  async function criar() {
    if (!onCriar || !termo) return;
    setCriando(true);
    try {
      const novo = await onCriar(termo);
      setCriados((atuais) => [...atuais, novo]);
      onChange(novo.id);
      setBusca("");
      setAberto(false);
    } catch (erro) {
      toast.error(`Não foi possível cadastrar: ${mensagemErro(erro)}`);
    } finally {
      setCriando(false);
    }
  }

  async function salvarEdicao(opcao: OpcaoSeletor) {
    if (!onEditar) return;
    const nome = nomeEditado.trim();
    if (nome.length < 2) {
      toast.error("Informe um nome com pelo menos 2 letras.");
      return;
    }
    setSalvandoEdicao(true);
    try {
      await onEditar(opcao, nome);
      setCriados((atuais) => atuais.filter((c) => c.id !== opcao.id));
      setEditando(null);
      toast.success("Nome alterado.");
    } catch (erro) {
      toast.error(`Não foi possível alterar: ${mensagemErro(erro)}`);
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function confirmarExclusao() {
    if (!onExcluir || !excluindo) return;
    setProcessandoExclusao(true);
    try {
      await onExcluir(excluindo);
      setCriados((atuais) => atuais.filter((c) => c.id !== excluindo.id));
      toast.success("Nome excluído da lista.");
      setExcluindo(null);
    } catch (erro) {
      toast.error(`Não foi possível excluir: ${mensagemErro(erro)}`);
    } finally {
      setProcessandoExclusao(false);
    }
  }

  const parar = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <Popover
        open={aberto}
        onOpenChange={(v) => {
          setAberto(v);
          if (!v) setEditando(null);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={aberto}
            disabled={disabled}
            className={cn("w-full justify-between font-normal", !textoBotao && "text-muted-foreground")}
          >
            <span className="truncate">{textoBotao ?? placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[18rem] p-0" align="start">
          <Command>
            <CommandInput placeholder="Pesquisar..." value={busca} onValueChange={setBusca} />
            <CommandList>
              <CommandEmpty>
                {podeCriar && termo ? (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={criando}
                    onClick={criar}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    {criando ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    )}
                    Cadastrar “{termo}”
                  </Button>
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
                {todasOpcoes.map((opcao) =>
                  editando === opcao.id ? (
                    <div
                      key={opcao.id}
                      className="flex items-center gap-1 px-2 py-1"
                      onKeyDown={parar}
                    >
                      <Input
                        autoFocus
                        aria-label="Novo nome"
                        value={nomeEditado}
                        onChange={(e) => setNomeEditado(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void salvarEdicao(opcao);
                          }
                          if (e.key === "Escape") {
                            e.preventDefault();
                            setEditando(null);
                          }
                        }}
                        className="h-8"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 shrink-0"
                        aria-label="Salvar nome"
                        title="Salvar nome"
                        disabled={salvandoEdicao}
                        onClick={() => void salvarEdicao(opcao)}
                      >
                        {salvandoEdicao ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Check className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        aria-label="Cancelar edição"
                        title="Cancelar"
                        onClick={() => setEditando(null)}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  ) : (
                    <CommandItem
                      key={opcao.id}
                      value={`${opcao.rotulo} ${opcao.detalhe ?? ""}`}
                      onSelect={() => {
                        onChange(opcao.id);
                        setAberto(false);
                      }}
                      className="group"
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4 shrink-0", valor === opcao.id ? "opacity-100" : "opacity-0")}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {opcao.rotulo}
                        {opcao.detalhe ? (
                          <span className="ml-2 text-xs text-muted-foreground">{opcao.detalhe}</span>
                        ) : null}
                      </span>
                      {onEditar && (
                        <button
                          type="button"
                          className="ml-1 shrink-0 rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                          aria-label={`Editar ${opcao.rotulo}`}
                          title="Editar nome"
                          onPointerDown={parar}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setNomeEditado(opcao.rotulo);
                            setEditando(opcao.id);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      )}
                      {onExcluir && (
                        <button
                          type="button"
                          className="shrink-0 rounded p-1 text-destructive hover:bg-background"
                          aria-label={`Excluir ${opcao.rotulo}`}
                          title="Excluir da lista"
                          onPointerDown={parar}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setAberto(false);
                            setExcluindo(opcao);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </CommandItem>
                  ),
                )}
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
      <AlertDialog
        open={Boolean(excluindo)}
        onOpenChange={(v) => {
          if (!v && !processandoExclusao) setExcluindo(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir nome da lista</AlertDialogTitle>
            <AlertDialogDescription>
              Retirar “{excluindo?.rotulo}” da lista? As ordens de serviço já emitidas continuam com esse nome.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processandoExclusao}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={processandoExclusao}
              onClick={(e) => {
                e.preventDefault();
                void confirmarExclusao();
              }}
            >
              {processandoExclusao && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Confirmar exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
