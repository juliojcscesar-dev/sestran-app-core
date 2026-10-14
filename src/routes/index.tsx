import { createFileRoute, Link } from "@tanstack/react-router";
import { TrafficCone, GraduationCap, ClipboardList, Car } from "lucide-react";
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

function PaginaInicial() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-5">
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

      <main className="mx-auto max-w-6xl px-6 py-8 sm:py-12">
        <LogosInstitucionais />
        <div className="mt-8 sm:mt-10">
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight">
          Central de Sistema
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Plataforma Administrativa da Secretaria de Segurança e Trânsito - Ordens de Serviço - Veículos Abandonados - Educação no Trânsito.
        </p>
        <Button asChild className="mt-8">
          <Link to="/auth">Entrar na área restrita</Link>
        </Button>
        </div>

        <section className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            {
              icone: ClipboardList,
              titulo: "Ordens de serviço",
              texto: "Registro e acompanhamento das demandas operacionais da secretaria.",
            },
            {
               icone: Car,
               titulo: "Veículos Abandonados",
               texto: "Registro e acompanhamento das situações dos veículos no município.",
            },
            {
               icone: GraduationCap,
               titulo: "Educação no Trânsito",
               texto: "Agenda e registro das ações educativas de trânsito.",
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
         Prefeitura Municipal de Paranavaí — Secretaria Municipal de Segurança e Trânsito
      </footer>
    </div>
  );
}
