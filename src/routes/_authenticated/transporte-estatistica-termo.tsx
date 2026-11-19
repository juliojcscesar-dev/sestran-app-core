import { CabecalhoModulo } from "@/components/layout/CabecalhoModulo";
import { FileCheck as IcFileCheck } from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSessao } from "@/hooks/useSessao";
import { temAcesso } from "@/lib/permissoes";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/transporte-estatistica-termo")({
  head: () => ({ meta: [
    { title: "Termo de Recebimento | SESTRAN Paranavaí" },
    { name: "description", content: "Dashboard do Termo de Recebimento da Diretoria de Transporte e Estatística." },
    { property: "og:title", content: "Termo de Recebimento | SESTRAN Paranavaí" },
    { property: "og:description", content: "Dashboard do Termo de Recebimento." },
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
  return <Termo podeSalvar={temAcesso(sessao, "TRANSPORTE", "OPERADOR")} />;
}

function Termo({ podeSalvar }: { podeSalvar: boolean }) {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let avisado = false;
    const aoMensagem = async (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== ref.current?.contentWindow) return;
      if (e.data?.tipo === "termo-pronto") {
        const { data, error } = await supabase.from("transporte_termo_estado").select("dados").eq("id", 1).maybeSingle();
        if (error) toast.error("Não foi possível carregar o Termo de Recebimento salvo.");
        ref.current?.contentWindow?.postMessage({ tipo: "termo-dados", dados: data?.dados ?? null }, window.location.origin);
      } else if (e.data?.tipo === "termo-salvar") {
        if (!podeSalvar) { if (!avisado) toast.error("Seu acesso é somente consulta; alterações não serão salvas."); avisado = true; return; }
        const dados = e.data.dados as Json;
        clearTimeout(timer);
        timer = setTimeout(async () => {
          const { data: u } = await supabase.auth.getUser();
          const { error } = await supabase.from("transporte_termo_estado").upsert({ id: 1, dados, atualizado_em: new Date().toISOString(), atualizado_por: u.user?.id ?? null });
          if (error) toast.error("Não foi possível salvar o Termo de Recebimento.");
        }, 800);
      }
    };
    window.addEventListener("message", aoMensagem);
    return () => { window.removeEventListener("message", aoMensagem); clearTimeout(timer); };
  }, [podeSalvar]);
  return <div className="space-y-4"><CabecalhoModulo icone={IcFileCheck} titulo="Termo de Recebimento" subtitulo="Registro e controle de recebimentos relacionados às despesas da Secretaria." /><iframe ref={ref} title="Dashboard — Termo de Recebimento" src="/termo/index.html" className="h-[calc(100vh-12rem)] w-full rounded-lg border bg-background" /></div>;
}

