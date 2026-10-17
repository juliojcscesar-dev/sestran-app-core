// ============= Full file contents =============
import { createFileRoute, Link } from "@tanstack/react-router";
import { TrafficCone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogosInstitucionais } from "@/components/layout/LogosInstitucionais";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Central de Sistema — SESTRAN Paranavaí" },
      {
        name: "description",
        content:
          "Plataforma Administrativa da Secretaria de Segurança e Trânsito de Paranavaí: Ordens de Serviço, Veículos Abandonados e Educação no Trânsito.",
      },
      { property: "og:title", content: "Central de Sistema — SESTRAN Paranavaí" },
      {
        property: "og:description",
        content:
          "Central administrativa da Secretaria de Segurança e Trânsito: Ordens de Serviço, Veículos Abandonados e Educação no Trânsito.",
      },
    ],
  }),
  component: PaginaInicial,
});

const MODULOS = [
  "Ordem de Serviço",
  "Sinalização Viária — O.S.",
  "Veículos Abandonados",
  "Veículos Recolhidos",
  "Educação no Trânsito",
  "Credenciais de Vagas",
];

function PaginaInicial() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="hidden items-center gap-3 lg:flex">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <TrafficCone className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-lg font-semibold">SESTRAN</p>
              <p className="text-xs text-sidebar-foreground/70">
                Prefeitura Municipal de Paranavaí — PR
              </p>
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-portal-title sm:text-4xl">
            Central de Sistema
          </h1>
          <Button asChild size="sm">
            <Link to="/auth">Acessar o sistema</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <LogosInstitucionais />

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULOS.map((modulo) => (
            <div
              key={modulo}
              className="flex min-h-24 items-center justify-center rounded-md border border-border bg-card px-4 py-6 text-center"
            >
              <span className="font-display text-base font-bold text-brand-ink sm:text-lg">
                {modulo}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
