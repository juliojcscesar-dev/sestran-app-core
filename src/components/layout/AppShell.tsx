import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { LogOut, Menu, TrafficCone, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { MODULOS, PAPEL_LABEL, type Papel } from "@/lib/sestran";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function Icone({ nome, className }: { nome: string; className: string }) {
  const Componente = (
    Icons as unknown as Record<string, React.ComponentType<{ className: string }> | undefined>
  )[nome];
  if (!Componente) return null;
  return <Componente className={className} />;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data: sessao } = useSessao();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuAberto, setMenuAberto] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const papeis: Papel[] = sessao?.papeis ?? [];
  const modulosVisiveis = MODULOS.filter(
    (m) => !m.papeis || m.papeis.some((p) => papeis.includes(p)),
  );

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
        <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <TrafficCone className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg font-semibold">SESTRAN</p>
            <p className="text-xs text-sidebar-foreground/70">Paranavaí — PR</p>
          </div>
          <button
            type="button"
            onClick={() => setMenuAberto(false)}
            className="ml-auto rounded p-1 lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
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
          Secretaria Municipal de Trânsito
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
              Gestão de Trânsito e Eventos
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
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
