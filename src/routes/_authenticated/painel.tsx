import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Car,
  ClipboardList,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { temAcesso, MODULOS_ACESSO } from "@/lib/permissoes";
import { useSessao } from "@/hooks/useSessao";
import { PAPEL_LABEL, formatarData, formatarDataHora } from "@/lib/sestran";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Painel | SESTRAN Paranavaí" },
      {
        name: "description",
        content:
          "Panorama das ordens de serviço, eventos e equipes da Secretaria de Trânsito de Paranavaí.",
      },
      { property: "og:title", content: "Painel | SESTRAN Paranavaí" },
      {
        property: "og:description",
        content: "Indicadores e próximas atividades da Secretaria de Trânsito de Paranavaí.",
      },
    ],
  }),
  component: Painel,
});

type Indicadores = {
  osAbertas: number;
  osEmExecucao: number;
  eventosProximos: number;
  agentesAtivos: number;
  orientadoresAtivos: number;
  veiculosPendentes: number;
  acoesPlanejadas: number;
};

function Painel() {
  const { data: sessao } = useSessao();

  const acessos = MODULOS_ACESSO.filter(m => temAcesso(sessao, m.id));
  const assinaturaAcessos = acessos.map(m=>m.id).join(",");

  const indicadores = useQuery({
    queryKey: ["painel", "indicadores", sessao?.userId, assinaturaAcessos],
    enabled: Boolean(sessao),
    queryFn: async (): Promise<Indicadores> => {
      const agora = new Date().toISOString();
      const total = (resultado: { count: number | null; error: unknown }) => {
        if (resultado.error) throw resultado.error;
        return resultado.count ?? 0;
      };
      const cabecalho = { count: "exact" as const, head: true };

      const [
        osAbertas,
        osEmExecucao,
        eventosProximos,
        agentesAtivos,
        orientadoresAtivos,
        veiculosPendentes,
        acoesPlanejadas,
      ] = await Promise.all([
        supabase.from("ordens_servico").select("id", cabecalho).eq("status", "ABERTA").then(total),
        supabase
          .from("ordens_servico")
          .select("id", cabecalho)
          .eq("status", "EM_EXECUCAO")
          .then(total),
        supabase.from("eventos").select("id", cabecalho).gte("data_inicio", agora).then(total),
        supabase.from("agentes").select("id", cabecalho).eq("ativo", true).then(total),
        supabase.from("orientadores").select("id", cabecalho).eq("ativo", true).then(total),
        supabase
          .from("veiculos_abandonados")
          .select("id", cabecalho)
          .in("status", ["REGISTRADO", "NOTIFICADO"])
          .then(total),
        supabase.from("acoes_educativas").select("id", cabecalho).eq("status", "PLANEJADA").then(total),
      ]);


      return {
        osAbertas,
        osEmExecucao,
        eventosProximos,
        agentesAtivos,
        orientadoresAtivos,
        veiculosPendentes,
        acoesPlanejadas,
      };
    },
  });

  const atividades = useQuery({
    queryKey: ["painel", "proximas-atividades", sessao?.userId, assinaturaAcessos],
    enabled: Boolean(sessao),
    queryFn: async () => {
      const hoje = new Date();
      const dataHoje = hoje.toISOString().slice(0, 10);
      const [eventos, ordens, acoes] = await Promise.all([
        supabase
          .from("eventos")
          .select("id, titulo, data_inicio, local, status")
          .gte("data_inicio", hoje.toISOString())
          .order("data_inicio", { ascending: true })
          .limit(5),
        supabase
          .from("ordens_servico")
          .select("id, numero, titulo, data_servico, status")
          .gte("data_servico", dataHoje)
          .order("data_servico", { ascending: true })
          .limit(5),
        supabase
          .from("acoes_educativas")
          .select("id, titulo, data_acao, status")
          .gte("data_acao", dataHoje)
          .order("data_acao", { ascending: true })
          .limit(5),
      ]);
      if (eventos.error) throw eventos.error;
      if (ordens.error) throw ordens.error;
      if (acoes.error) throw acoes.error;

      const lista = [
        ...(eventos.data ?? []).map((e) => ({
          id: `evento-${e.id}`,
          tipo: "Evento",
          titulo: e.titulo,
          quando: e.data_inicio,
          detalhe: e.local ?? "Local não informado",
          status: e.status,
        })),
        ...(ordens.data ?? []).map((o) => ({
          id: `os-${o.id}`,
          tipo: "Ordem de serviço",
          titulo: `${o.numero} — ${o.titulo}`,
          quando: o.data_servico,
          detalhe: "Serviço programado",
          status: o.status,
        })),
        ...(acoes.data ?? []).map((a) => ({
          id: `acao-${a.id}`,
          tipo: "Educação no trânsito",
          titulo: a.titulo,
          quando: a.data_acao,
          detalhe: "Ação educativa",
          status: a.status,
        })),
      ];

      return lista.sort((a, b) => a.quando.localeCompare(b.quando)).slice(0, 8);
    },
  });

  const cards = [
    {
      titulo: "Ordens de serviço abertas",
      valor: indicadores.data?.osAbertas,
      icone: ClipboardList,
      nota: `${indicadores.data?.osEmExecucao ?? 0} em execução`,
    },
    {
      titulo: "Eventos programados",
      valor: indicadores.data?.eventosProximos,
      icone: CalendarDays,
      nota: "A partir de hoje",
    },
    {
      titulo: "Agentes ativos",
      valor: indicadores.data?.agentesAtivos,
      icone: ShieldCheck,
      nota: "Disponíveis para escala",
    },
    {
      titulo: "Orientadores ativos",
      valor: indicadores.data?.orientadoresAtivos,
      icone: Users,
      nota: "Equipe de apoio",
    },
    {
      titulo: "Veículos abandonados",
      valor: indicadores.data?.veiculosPendentes,
      icone: Car,
      nota: "Registrados ou notificados",
    },
    {
      titulo: "Ações educativas",
      valor: indicadores.data?.acoesPlanejadas,
      icone: GraduationCap,
      nota: "Planejadas",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Painel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bem-vindo, {sessao?.nome ?? "servidor"}. Nível de acesso:{" "}
          {sessao?.papeis.map((p) => PAPEL_LABEL[p]).join(", ") || "não definido"}.
        </p>
      </div>

      {indicadores.isError && (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">
            Não foi possível carregar os indicadores agora. Atualize a página e tente novamente.
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.filter((_,i)=>i<3?temAcesso(sessao,"OS"):i===3?(temAcesso(sessao,"OS")||temAcesso(sessao,"EDUCACAO")):i===4?temAcesso(sessao,"VEICULOS"):temAcesso(sessao,"EDUCACAO")).map((card) => (
          <Card key={card.titulo}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.titulo}
              </CardTitle>
              <card.icone className="h-4 w-4 text-primary" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              {indicadores.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="font-display text-3xl font-semibold">{card.valor ?? 0}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">{card.nota}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Próximas atividades</CardTitle>
          </CardHeader>
          <CardContent>
            {atividades.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (atividades.data?.length ?? 0) === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma atividade programada. Os eventos, ordens de serviço e ações educativas
                aparecerão aqui assim que forem cadastrados.
              </p>
            ) : (
              <ul className="divide-y">
                {atividades.data?.map((item) => (
                  <li key={item.id} className="flex items-start gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.tipo} · {item.detalhe}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">
                        {item.quando.length > 10
                          ? formatarDataHora(item.quando)
                          : formatarData(item.quando)}
                      </p>
                      <Badge variant="secondary" className="mt-1 text-[10px]">
                        {item.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Módulos disponíveis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {acessos.length === 0 ? <p>Aguardando liberação de acesso pelo administrador.</p> : acessos.map(m=><Link key={m.id} to={m.href} className="block text-primary underline underline-offset-4">Módulo {m.numero} — {m.titulo}</Link>)}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
