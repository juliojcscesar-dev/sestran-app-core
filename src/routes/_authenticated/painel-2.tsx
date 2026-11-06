import { createFileRoute, Link } from "@tanstack/react-router";
import { useSessao } from "@/hooks/useSessao";
import { administrador } from "@/lib/permissoes";
import { PainelUsuario } from "@/components/painel/PainelUsuario";
import { NOTICIA_SECRETARIA, dataPorExtenso } from "@/lib/painel-usuario";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/painel-2")({
  head: () => ({ meta: [
    { title: "Painel 2 | SESTRAN Paranavaí" },
    { name: "description", content: "Painel 2 da Central de Sistema: atalhos para os módulos, calendário e destaque da Secretaria." },
    { property: "og:title", content: "Painel 2 | SESTRAN Paranavaí" },
    { property: "og:description", content: "Atalhos para os módulos, calendário e destaque da Secretaria." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: Painel2,
});

function Painel2() {
  const { data: sessao } = useSessao();
  if (!sessao) return <p className="text-sm text-muted-foreground">Carregando acessos...</p>;
  if (!administrador(sessao)) return <div className="space-y-4">
    <h1 className="font-display text-2xl font-semibold">Acesso não autorizado</h1>
    <p className="text-muted-foreground">O Painel 2 é exclusivo do administrador. Use o seu painel de início.</p>
    <Button asChild variant="outline"><Link to="/painel">Ir para o meu painel</Link></Button>
  </div>;

  return <div className="space-y-5">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <h1 className="min-w-0 break-words font-display text-2xl font-bold text-primary sm:text-3xl">Painel 2</h1>
      <Button asChild variant="outline" size="sm" className="shrink-0"><Link to="/painel">Painel completo</Link></Button>
    </div>
    <PainelUsuario sessao={sessao} dataExtenso={dataPorExtenso(new Date())} noticia={NOTICIA_SECRETARIA} />
  </div>;
}
