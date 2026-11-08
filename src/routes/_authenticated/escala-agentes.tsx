import { createFileRoute, Link } from "@tanstack/react-router";
import { useSessao } from "@/hooks/useSessao";
import { administrador } from "@/lib/permissoes";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/escala-agentes")({
  head: () => ({ meta: [
    { title: "Escala dos Agentes | SESTRAN Paranavaí" },
    { name: "description", content: "Escala dos agentes de trânsito: plantões 12/36, agentes de 8 horas, trocas e horas extras." },
    { property: "og:title", content: "Escala dos Agentes | SESTRAN Paranavaí" },
    { property: "og:description", content: "Plantões 12/36, agentes de 8 horas, trocas e horas extras." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: EscalaAgentes,
});

function EscalaAgentes() {
  const { data: sessao } = useSessao();
  if (!sessao) return <p className="text-sm text-muted-foreground">Carregando acessos...</p>;
  if (!administrador(sessao)) return <div className="space-y-4">
    <h1 className="font-display text-2xl font-semibold">Acesso não autorizado</h1>
    <p className="text-muted-foreground">A Escala dos Agentes é exclusiva do administrador.</p>
    <Button asChild variant="outline"><Link to="/painel">Voltar ao painel</Link></Button>
  </div>;
  return <iframe title="Escala dos Agentes de Trânsito" src="/escala/index.html" className="h-[calc(100vh-7rem)] w-full rounded-lg border bg-background" />;
}
