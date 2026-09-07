import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, TrafficCone, CalendarDays, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SESTRAN Paranavaí — Gestão de Trânsito e Eventos" },
      {
        name: "description",
        content:
          "Sistema administrativo da Secretaria de Trânsito de Paranavaí/PR para ordens de serviço, eventos, equipes e educação no trânsito.",
      },
      { property: "og:title", content: "SESTRAN Paranavaí — Gestão de Trânsito e Eventos" },
      {
        property: "og:description",
        content:
          "Área institucional do sistema de gestão de trânsito e eventos da Prefeitura de Paranavaí.",
      },
    ],
  }),
  component: PaginaInicial,
});

function PaginaInicial() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <TrafficCone className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg font-semibold">SESTRAN</p>
            <p className="text-xs text-sidebar-foreground/70">
              Prefeitura Municipal de Paranavaí — PR
            </p>
          </div>
          <Button asChild className="ml-auto" size="sm">
            <Link to="/auth">Acessar o sistema</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight">
          Gestão de Trânsito e Eventos
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Plataforma administrativa da Secretaria de Trânsito para organizar ordens de serviço,
          eventos, equipes de agentes e orientadores, escolas, veículos abandonados e ações de
          educação no trânsito.
        </p>
        <Button asChild className="mt-8">
          <Link to="/auth">Entrar na área restrita</Link>
        </Button>

        <section className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            {
              icone: ClipboardList,
              titulo: "Ordens de serviço",
              texto: "Registro e acompanhamento das demandas operacionais da secretaria.",
            },
            {
              icone: CalendarDays,
              titulo: "Eventos",
              texto: "Planejamento do apoio de trânsito a eventos no município.",
            },
            {
              icone: ShieldCheck,
              titulo: "Acesso controlado",
              texto: "Perfis de administrador, gestor, operador e consulta.",
            },
          ].map((item) => (
            <div key={item.titulo} className="rounded-lg border bg-card p-6">
              <item.icone className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="mt-3 text-base font-semibold">{item.titulo}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.texto}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        Prefeitura Municipal de Paranavaí — Secretaria de Trânsito (SESTRAN)
      </footer>
    </div>
  );
}
