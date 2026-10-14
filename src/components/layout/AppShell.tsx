import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { LogOut, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { MODULOS, PAPEL_LABEL, type Papel } from "@/lib/sestran";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { administrador, moduloDoCaminho, temAcesso } from "@/lib/permissoes";
import { LogosInstitucionais } from "@/components/layout/LogosInstitucionais";

function Icone({ nome, className }: { nome: string; className: string }) {
  const Componente = (
    Icons as unknown as Record<string, React.ComponentType<{ className: string }> | undefined>
  )[nome];
  if (!Componente) return null;
  return <Componente className={className} />;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data: sessao, isPending, isError } = useSessao();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuAberto, setMenuAberto] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const papeis: Papel[] = sessao?.papeis ?? [];
  const modulosVisiveis = MODULOS.filter(
    (m) => {
      if (m.href === "/painel") return true;
      if (m.href === "/usuarios") return administrador(sessao);
      const modulo = moduloDoCaminho(m.href);
      return modulo ? temAcesso(sessao, modulo) : administrador(sessao);
    },
  );
  const moduloAtual = moduloDoCaminho(pathname);
  const escrita = /\/ordens-servico\/(nova|editar|duplicar)(\/|$)/.test(pathname);
  const permitido = Boolean(sessao?.ativo) && (pathname === "/painel" || (moduloAtual
    ? temAcesso(sessao, moduloAtual, escrita ? "OPERADOR" : "CONSULTA")
    : administrador(sessao)));

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          menuAberto ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="border-b border-sidebar-border px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <p className="font-display text-sm font-semibold">Central de Sistema</p>
          <Button
            variant="ghost" size="icon"
            onClick={() => setMenuAberto(false)}
            className="ml-auto h-7 w-7 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
          </div>
          <LogosInstitucionais compacto />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {modulosVisiveis.map((modulo) => {
            const ativo = pathname === modulo.href;
            return (
              <Link
                key={modulo.href}
                to={modulo.href}
                onClick={() => setMenuAberto(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  ativo
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60",
                )}
              >
                <Icone nome={modulo.icone} className="h-4 w-4 shrink-0" />
                <span className="flex-1">{modulo.titulo}</span>
                {!modulo.disponivel && (
                  <span className="rounded bg-sidebar-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                    Em breve
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border px-5 py-4 text-xs text-sidebar-foreground/70">
          Prefeitura Municipal de Paranavaí
          <br />
          Secretaria Municipal de Segurança e Trânsito
        </div>
      </aside>

      {menuAberto && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          onClick={() => setMenuAberto(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-card px-4 py-3 lg:px-8">
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            className="rounded p-2 hover:bg-muted lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold">
              Central de Sistema
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {sessao?.nome ?? "Carregando..."}
              {sessao?.cargo ? ` — ${sessao.cargo}` : ""}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {papeis.map((papel) => (
              <Badge key={papel} variant="secondary" className="hidden sm:inline-flex">
                {PAPEL_LABEL[papel]}
              </Badge>
            ))}
            <Button variant="outline" size="sm" onClick={sair}>
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Sair
            </Button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {isPending ? <p className="text-sm text-muted-foreground">Carregando acessos...</p> :
            isError ? <p className="text-sm text-destructive">Não foi possível verificar seus acessos. Atualize a página.</p> :
            permitido ? children : <div className="space-y-4"><h1 className="font-display text-2xl font-semibold">Acesso não autorizado</h1><p className="text-muted-foreground">Solicite a liberação deste acesso ao administrador.</p><Button asChild variant="outline"><Link to="/painel">Voltar ao início</Link></Button></div>}
        </main>
      </div>
    </div>
  );
}
