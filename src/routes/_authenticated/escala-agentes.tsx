import { CabecalhoModulo } from "@/components/layout/CabecalhoModulo";
import { CalendarClock as IcCalendarClock } from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSessao } from "@/hooks/useSessao";
import { administrador } from "@/lib/permissoes";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/escala-agentes")({
  head: () => ({ meta: [
    { title: "Escala dos Agentes | SESTRAN Paranavaí" },
    { name: "description", content: "Escala dos agentes de trânsito: plantões 12/36, agentes de 8 horas, trocas, plantões extras, férias e licença." },
    { property: "og:title", content: "Escala dos Agentes | SESTRAN Paranavaí" },
    { property: "og:description", content: "Plantões 12/36, agentes de 8 horas, trocas, plantões extras, férias e licença." },
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
  return <QuadroEscala />;
}

function QuadroEscala() {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const aoMensagem = async (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== ref.current?.contentWindow) return;
      if (e.data?.tipo === "escala-pronta") {
        const { data, error } = await supabase.from("escala_agentes_estado").select("dados").eq("id", 1).maybeSingle();
        if (error) { toast.error("Não foi possível carregar a escala salva."); return; }
        ref.current?.contentWindow?.postMessage({ tipo: "escala-dados", dados: data?.dados ?? null }, window.location.origin);
      } else if (e.data?.tipo === "escala-salvar") {
        const dados = e.data.dados;
        clearTimeout(timer);
        timer = setTimeout(async () => {
          const { data: u } = await supabase.auth.getUser();
          const { error } = await supabase.from("escala_agentes_estado").upsert({ id: 1, dados, atualizado_em: new Date().toISOString(), atualizado_por: u.user?.id ?? null });
          if (error) toast.error("Não foi possível salvar a escala.");
          ref.current?.contentWindow?.postMessage({ tipo: "escala-salva", sucesso: !error }, window.location.origin);
        }, 800);
      }
    };
    window.addEventListener("message", aoMensagem);
    return () => { window.removeEventListener("message", aoMensagem); clearTimeout(timer); };
  }, []);
  return <div className="space-y-4"><CabecalhoModulo icone={IcCalendarClock} titulo="Escala dos Agentes" subtitulo="Organização e gerenciamento das escalas dos Agentes de Trânsito." /><iframe ref={ref} title="Escala dos Agentes de Trânsito" src="/escala/index.html" className="h-[calc(100vh-12rem)] w-full rounded-lg border bg-background" /></div>;
}
