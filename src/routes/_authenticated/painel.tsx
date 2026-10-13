import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CalendarDays, Car, ClipboardList, Eye, Pencil, RefreshCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { temAcesso } from "@/lib/permissoes";
import { dataLocalIso, STATUS_ACAO_LABEL } from "@/lib/educacao";
import { STATUS_OS_LABEL, periodoHorario } from "@/lib/os";
import { statusEfetivo, STATUS_VEICULO_LABEL, type VeiculoBase } from "@/lib/veiculos";
import { formatarData } from "@/lib/sestran";
import { cn } from "@/lib/utils";
import { TextoFormatado } from "@/components/TextoFormatado";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarioPainel, periodoCalendario } from "@/components/painel/CalendarioPainel";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({ meta: [
    { title: "Painel integrado | SESTRAN Paranavaí" },
    { name: "description", content: "Calendários de ordens de serviço e ações educativas e acompanhamento de veículos de Paranavaí." },
    { property: "og:title", content: "Painel integrado | SESTRAN Paranavaí" },
    { property: "og:description", content: "Agenda operacional, educação no trânsito e situações dos veículos cadastrados." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: Painel,
});

function checar<T>(res: { data: T; error: unknown }) { if (res.error) throw res.error; return res.data; }
function total(res: { count: number | null; error: unknown }) { if (res.error) throw res.error; return res.count ?? 0; }
function classeStatus(status: string) {
  if (["EXECUTADA", "REALIZADA", "RETIRADO", "RECOLHIDO"].includes(status)) return "border-success/25 bg-success/10 text-success";
  if (["CANCELADA", "RECOLHER"].includes(status)) return "border-destructive/25 bg-destructive/10 text-destructive";
  if (["EM_ANDAMENTO", "NOTIFICADO"].includes(status)) return "border-warning/30 bg-warning/15 text-warning-foreground";
  return "border-primary/20 bg-primary/5 text-primary";
}
function Situacao({ status, label }: { status: string; label: string }) { return <Badge variant="outline" className={cn("max-w-full whitespace-normal text-[10px]", classeStatus(status))}>{label}</Badge>; }
function ListaPainel({ titulo, quantidade, carregando, erro, onTentar, children }: { titulo: string; quantidade: number; carregando: boolean; erro: boolean; onTentar: () => void; children: ReactNode }) {
  return <section className="mt-5 overflow-hidden rounded-lg border bg-card">
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3"><h3 className="min-w-0 text-sm font-semibold">{titulo}</h3><Badge variant="secondary">{quantidade}</Badge></header>
    <div className="h-[340px] overflow-y-auto px-4" tabIndex={0} aria-label={titulo}>{carregando ? <div className="space-y-4 py-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div> : erro ? <div className="py-8 text-center"><p className="text-sm text-destructive">Não foi possível carregar os registros.</p><Button variant="outline" size="sm" className="mt-3" onClick={onTentar}><RefreshCw className="h-3 w-3" />Tentar novamente</Button></div> : quantidade === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">Nenhum registro neste período.</p> : children}</div>
  </section>;
}

function Painel() {
  const { data: sessao } = useSessao();
  const [mesOS, setMesOS] = useState(new Date()); const [diaOS, setDiaOS] = useState<Date>();
  const [mesEducacao, setMesEducacao] = useState(new Date()); const [diaEducacao, setDiaEducacao] = useState<Date>();
  const [situacaoVeiculo, setSituacaoVeiculo] = useState<string>();
  const osLiberada = temAcesso(sessao, "OS"), educacaoLiberada = temAcesso(sessao, "EDUCACAO"), veiculosLiberados = temAcesso(sessao, "VEICULOS");
  const periodoOS = periodoCalendario(mesOS), periodoEducacao = periodoCalendario(mesEducacao);
  const hoje = dataLocalIso(new Date());
  const ordens = useQuery({
    queryKey: ["painel", "os", sessao?.userId, osLiberada, periodoOS, hoje], enabled: osLiberada,
    queryFn: async () => {
      const campos = "id,numero,titulo,data_servico,hora_inicio,hora_fim,status,local";
      const [mes, proximas, agendadas, executadas] = await Promise.all([
        supabase.from("ordens_servico").select(campos).eq("arquivada", false).gte("data_servico", periodoOS.inicio).lte("data_servico", periodoOS.fim).order("data_servico").order("hora_inicio"),
        supabase.from("ordens_servico").select(campos).eq("arquivada", false).gte("data_servico", hoje).in("status", ["AGENDADA", "EM_ANDAMENTO"]).order("data_servico").order("hora_inicio").limit(20),
        supabase.from("ordens_servico").select("id", { count: "exact", head: true }).eq("arquivada", false).eq("status", "AGENDADA"),
        supabase.from("ordens_servico").select("id", { count: "exact", head: true }).eq("arquivada", false).eq("status", "EXECUTADA"),
      ]);
      return { mes: checar(mes) ?? [], proximas: checar(proximas) ?? [], agendadas: total(agendadas), executadas: total(executadas) };
    },
  });
  const educacao = useQuery({
    queryKey: ["painel", "educacao", sessao?.userId, educacaoLiberada, periodoEducacao, hoje], enabled: educacaoLiberada,
    queryFn: async () => {
      const campos = "id,titulo,data_acao,horario_inicio,horario_fim,status,local";
      const [mes, proximas, agendadas, realizadas] = await Promise.all([
        supabase.from("acoes_educativas").select(campos).eq("arquivada", false).gte("data_acao", periodoEducacao.inicio).lte("data_acao", periodoEducacao.fim).order("data_acao").order("horario_inicio"),
        supabase.from("acoes_educativas").select(campos).eq("arquivada", false).gte("data_acao", hoje).in("status", ["AGENDADA", "PLANEJADA", "EM_ANDAMENTO"]).order("data_acao").order("horario_inicio").limit(20),
        supabase.from("acoes_educativas").select("id", { count: "exact", head: true }).eq("arquivada", false).in("status", ["AGENDADA", "PLANEJADA"]),
        supabase.from("acoes_educativas").select("id", { count: "exact", head: true }).eq("arquivada", false).eq("status", "REALIZADA"),
      ]);
      return { mes: checar(mes) ?? [], proximas: checar(proximas) ?? [], agendadas: total(agendadas), realizadas: total(realizadas) };
    },
  });
  const veiculos = useQuery({ queryKey: ["painel", "veiculos", sessao?.userId, veiculosLiberados, hoje], enabled: veiculosLiberados,
    queryFn: async () => {
      const linhas: Array<VeiculoBase & { id: string; marca: string | null; modelo: string | null; placa: string | null; endereco: string; bairro: string | null }> = [];
      for (let inicio = 0; ; inicio += 1000) {
        const res = await supabase.from("veiculos_abandonados").select("id,marca,modelo,placa,endereco,bairro,status,situacao,data_verificacao,data_notificacao,data_recolhimento,data_retirada,prazo_recolhimento").eq("arquivado", false).order("created_at", { ascending: false }).order("id").range(inicio, inicio + 999);
        const dados = checar(res) ?? [];
        linhas.push(...dados.map(v => ({ ...v, situacao: v.situacao as VeiculoBase["situacao"] })));
        if (dados.length < 1000) break;
      }
      return linhas;
    },
  });
  const itensOS = diaOS ? (ordens.data?.mes ?? []).filter(o => o.data_servico === dataLocalIso(diaOS)) : ordens.data?.proximas ?? [];
  const itensEducacao = diaEducacao ? (educacao.data?.mes ?? []).filter(a => a.data_acao === dataLocalIso(diaEducacao)) : educacao.data?.proximas ?? [];
  const itensVeiculos = (veiculos.data ?? []).filter(v => !situacaoVeiculo || statusEfetivo(v) === situacaoVeiculo);
  const blocos = [
    { label: "Total de registros", status: undefined, cor: "border-primary" },
    { label: "Retirados", status: "RETIRADO", cor: "border-success" },
    { label: "Notificados", status: "NOTIFICADO", cor: "border-warning" },
    { label: "A recolher", status: "RECOLHER", cor: "border-destructive" },
  ];
  return <div className="space-y-5">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><div className="min-w-0"><h1 className="font-display text-xl font-semibold">Painel</h1><p className="mt-1 text-xs text-muted-foreground">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></div><Button variant="outline" size="icon" title="Atualizar painel" aria-label="Atualizar painel" onClick={() => { if (osLiberada) void ordens.refetch(); if (educacaoLiberada) void educacao.refetch(); if (veiculosLiberados) void veiculos.refetch(); }}><RefreshCw className="h-4 w-4" /></Button></div>
    {!osLiberada && !educacaoLiberada && !veiculosLiberados && <p className="border-l-2 border-warning py-3 pl-4 text-sm text-muted-foreground">Bem-vindo, {sessao?.nome}. Aguardando liberação de acesso aos módulos pelo administrador.</p>}
    <div className="grid items-start gap-6 xl:grid-cols-3">
      {osLiberada && <section className="min-w-0" aria-label="Módulo 01 Ordem de Serviço">
        <Cabecalho numero="01" titulo="Ordem de Serviço" icone={<ClipboardList className="h-5 w-5" />} link={<Link to="/ordens-servico">Abrir módulo<ArrowUpRight className="h-3 w-3" /></Link>} />
        <CalendarioPainel nome="Ordem de Serviço" mes={mesOS} selecionada={diaOS} datas={(ordens.data?.mes ?? []).map(o => o.data_servico)} onMes={d => { setMesOS(d); setDiaOS(undefined); }} onSelecionar={setDiaOS} />
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span><strong className="text-foreground">{ordens.data?.agendadas ?? "—"}</strong> agendadas</span><span><strong className="text-success">{ordens.data?.executadas ?? "—"}</strong> executadas</span>{diaOS && <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={() => setDiaOS(undefined)}><X className="h-3 w-3" />Limpar data</Button>}</div>
        <ListaPainel titulo={diaOS ? `O.S. de ${formatarData(dataLocalIso(diaOS))}` : "Próximas atividades"} quantidade={itensOS.length} carregando={ordens.isFetching} erro={ordens.isError} onTentar={() => void ordens.refetch()}>
          <ul className="divide-y">{itensOS.map(o => <li key={o.id} className="py-4"><p className="break-words text-sm font-medium">{o.numero} — <TextoFormatado valor={o.titulo} /></p><p className="mt-1 truncate text-xs text-muted-foreground">{o.local || "Serviço programado"}</p><div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"><div className="min-w-0 space-y-1"><p className="text-xs">{formatarData(o.data_servico)} · {periodoHorario(o.hora_inicio, o.hora_fim)}</p><Situacao status={o.status} label={STATUS_OS_LABEL[o.status as keyof typeof STATUS_OS_LABEL] ?? o.status} /></div><div className="flex shrink-0"><Button variant="ghost" size="icon" className="h-8 w-8" title="Visualizar O.S." aria-label={`Visualizar O.S. ${o.numero}`} asChild><Link to="/ordens-servico/visualizar/$id" params={{ id: o.id }}><Eye className="h-4 w-4" /></Link></Button>{temAcesso(sessao, "OS", "OPERADOR") && <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar O.S." aria-label={`Editar O.S. ${o.numero}`} asChild><Link to="/ordens-servico/editar/$id" params={{ id: o.id }}><Pencil className="h-4 w-4" /></Link></Button>}</div></div></li>)}</ul>
        </ListaPainel>
      </section>}
      {veiculosLiberados && <section className="min-w-0" aria-label="Módulo 02 Veículos Abandonados">
        <Cabecalho numero="02" titulo="Veículos Abandonados" icone={<Car className="h-5 w-5" />} link={<Link to="/veiculos-abandonados">Abrir módulo<ArrowUpRight className="h-3 w-3" /></Link>} />
        <div className="flex min-h-[326px] flex-col justify-center"><div className="grid grid-cols-2 gap-3">{blocos.map(b => <Button key={b.label} variant="ghost" aria-pressed={situacaoVeiculo === b.status} className={cn("h-24 min-w-0 justify-start whitespace-normal rounded-lg border-l-[3px] bg-card p-4 text-left", b.cor, situacaoVeiculo === b.status && "ring-1 ring-border")} onClick={() => setSituacaoVeiculo(b.status)}><span className="min-w-0"><span className="block text-xs text-muted-foreground">{b.label}</span>{veiculos.isFetching ? <Skeleton className="mt-2 h-7 w-12" /> : <span className="mt-1 block font-display text-3xl font-semibold">{veiculos.isError ? "—" : b.status ? (veiculos.data ?? []).filter(v => statusEfetivo(v) === b.status).length : veiculos.data?.length ?? 0}</span>}</span></Button>)}</div></div>
        <div className="mt-3 min-h-5 text-xs text-muted-foreground">{situacaoVeiculo ? <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={() => setSituacaoVeiculo(undefined)}><X className="h-3 w-3" />Todas as situações</Button> : "Registros ativos"}</div>
        <ListaPainel titulo={situacaoVeiculo ? STATUS_VEICULO_LABEL[situacaoVeiculo as keyof typeof STATUS_VEICULO_LABEL] : "Veículos cadastrados"} quantidade={itensVeiculos.length} carregando={veiculos.isFetching} erro={veiculos.isError} onTentar={() => void veiculos.refetch()}>
          <ul className="divide-y">{itensVeiculos.map(v => <li key={v.id} className="py-4"><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"><div className="min-w-0"><p className="break-words text-sm font-medium">{[v.marca, v.modelo, v.placa].filter(Boolean).join(" · ") || "Veículo sem identificação"}</p><Situacao status={statusEfetivo(v)} label={STATUS_VEICULO_LABEL[statusEfetivo(v)]} /></div><Button variant="ghost" size="icon" className="h-8 w-8" title="Visualizar veículo" aria-label={`Visualizar veículo ${v.placa ?? "sem placa"}`} asChild><Link to="/documento-veiculo/$id" params={{ id: v.id }}><Eye className="h-4 w-4" /></Link></Button></div><p className="mt-2 break-words text-xs text-muted-foreground">{v.endereco}{v.bairro ? ` · ${v.bairro}` : ""}</p><div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">{[["Verificação", v.data_verificacao], ["Notificação", v.data_notificacao], ["Recolhimento", v.data_recolhimento]].map(([label, data]) => <p key={label}>{label}<span className="block text-foreground">{data ? formatarData(data) : "—"}</span></p>)}</div></li>)}</ul>
        </ListaPainel>
      </section>}
      {educacaoLiberada && <section className="min-w-0" aria-label="Módulo 03 Agenda Educação no Trânsito">
        <Cabecalho numero="03" titulo="Agenda Educação no Trânsito" icone={<CalendarDays className="h-5 w-5" />} link={<Link to="/educacao-transito">Abrir módulo<ArrowUpRight className="h-3 w-3" /></Link>} />
        <CalendarioPainel nome="Educação no Trânsito" mes={mesEducacao} selecionada={diaEducacao} datas={(educacao.data?.mes ?? []).map(a => a.data_acao)} onMes={d => { setMesEducacao(d); setDiaEducacao(undefined); }} onSelecionar={setDiaEducacao} educativo />
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span><strong className="text-foreground">{educacao.data?.agendadas ?? "—"}</strong> agendadas</span><span><strong className="text-success">{educacao.data?.realizadas ?? "—"}</strong> realizadas</span>{diaEducacao && <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={() => setDiaEducacao(undefined)}><X className="h-3 w-3" />Limpar data</Button>}</div>
        <ListaPainel titulo={diaEducacao ? `Atividades de ${formatarData(dataLocalIso(diaEducacao))}` : "Agendamentos"} quantidade={itensEducacao.length} carregando={educacao.isFetching} erro={educacao.isError} onTentar={() => void educacao.refetch()}>
          <ul className="divide-y">{itensEducacao.map(a => <li key={a.id} className="py-4"><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"><div className="min-w-0"><p className="break-words text-sm font-medium"><TextoFormatado valor={a.titulo} /></p><p className="mt-1 break-words text-xs text-muted-foreground">{a.local || "Local não informado"}</p></div><Button variant="ghost" size="icon" className="h-8 w-8" title="Visualizar ação educativa" aria-label="Visualizar ação educativa" asChild><Link to="/agenda-educativa/$id" params={{ id: a.id }}><Eye className="h-4 w-4" /></Link></Button></div><p className="mb-1 mt-2 text-xs">{formatarData(a.data_acao)} · {periodoHorario(a.horario_inicio, a.horario_fim)}</p><Situacao status={a.status} label={STATUS_ACAO_LABEL[a.status as keyof typeof STATUS_ACAO_LABEL] ?? a.status} /></li>)}</ul>
        </ListaPainel>
      </section>}
    </div>
  </div>;
}
function Cabecalho({ numero, titulo, icone, link }: { numero: string; titulo: string; icone: ReactNode; link: ReactNode }) {
  return <header className="mb-4 grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-start gap-3"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Módulo {numero}</p><h2 className="mt-1 break-words font-display text-lg font-semibold leading-tight">{titulo}</h2><Button variant="link" size="sm" className="h-6 p-0 text-xs" asChild>{link}</Button></div><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sidebar text-sidebar-primary">{icone}</span></header>;
}
