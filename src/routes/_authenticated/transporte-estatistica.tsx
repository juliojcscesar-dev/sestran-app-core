import { createFileRoute, Link } from "@tanstack/react-router";
import { useSessao } from "@/hooks/useSessao";
import { temAcesso } from "@/lib/permissoes";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/transporte-estatistica")({
  head: () => ({ meta: [
    { title: "Transporte e Estatística | SESTRAN Paranavaí" },
    { name: "description", content: "Diretoria de Transporte e Estatística: alvarás de táxi e transporte escolar, prazos e relatórios oficiais." },
    { property: "og:title", content: "Transporte e Estatística | SESTRAN Paranavaí" },
    { property: "og:description", content: "Alvarás de táxi e transporte escolar, prazos e relatórios oficiais." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: Transporte,
});

function Transporte() {
  const { data: sessao } = useSessao();
  if (!sessao) return <p className="text-sm text-muted-foreground">Carregando acessos...</p>;
  if (!temAcesso(sessao, "TRANSPORTE")) return <div className="space-y-4">
    <h1 className="font-display text-2xl font-semibold">Acesso não autorizado</h1>
    <p className="text-muted-foreground">Peça ao administrador a liberação do Módulo 06 — Transporte e Estatística.</p>
    <Button asChild variant="outline"><Link to="/painel">Voltar ao painel</Link></Button>
  </div>;
  return <Quadro podeSalvar={temAcesso(sessao, "TRANSPORTE", "OPERADOR")} />;
}

function Quadro({ podeSalvar }: { podeSalvar: boolean }) {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let avisado = false;
    const aoMensagem = async (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== ref.current?.contentWindow) return;
      if (e.data?.tipo === "transporte-pronto") {
        const { data, error } = await supabase.from("transporte_alvaras_estado").select("registros, tipos_veiculo").eq("id", 1).maybeSingle();
        if (error) toast.error("Não foi possível carregar os alvarás salvos.");
        ref.current?.contentWindow?.postMessage({ tipo: "transporte-dados", registros: data?.registros ?? null, tipos: data?.tipos_veiculo ?? null }, window.location.origin);
      } else if (e.data?.tipo === "transporte-salvar") {
        if (!podeSalvar) { if (!avisado) toast.error("Seu acesso é somente consulta; alterações não serão salvas."); avisado = true; return; }
        const { registros, tipos } = e.data as { registros: Json; tipos: Json };
        clearTimeout(timer);
        timer = setTimeout(async () => {
          const { data: u } = await supabase.auth.getUser();
          const { error } = await supabase.from("transporte_alvaras_estado").upsert({ id: 1, registros, tipos_veiculo: tipos, atualizado_em: new Date().toISOString(), atualizado_por: u.user?.id ?? null });
          if (error) toast.error("Não foi possível salvar os alvarás.");
        }, 800);
      }
    };
    window.addEventListener("message", aoMensagem);
    return () => { window.removeEventListener("message", aoMensagem); clearTimeout(timer); };
  }, [podeSalvar]);
  return <iframe ref={ref} title="Diretoria de Transporte e Estatística" src="/transporte/index.html" className="h-[calc(100vh-7rem)] w-full rounded-lg border bg-background" />;
}
