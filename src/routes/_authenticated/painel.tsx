import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Eye, Lock, Pencil, RefreshCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { administrador, temAcesso } from "@/lib/permissoes";
import { PainelUsuario } from "@/components/painel/PainelUsuario";
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
import noticiaAsset from "@/assets/noticia-educacao-transito.png.asset.json";

const NOTICIA = {
  url: "https://paranavai.atende.net",
  titulo: "Alunos de Paraíso do Norte participam de atividade de educação no trânsito em Paranavaí",
  resumo: "Ação na minicidade do Detran combina orientações teóricas e simulações práticas para ensinar regras de segurança viária.",
};

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({ meta: [
    { title: "Painel integrado | SESTRAN Paranavaí" },
    { name: "description", content: "Painel da Central de Sistema: ordens de serviço, veículos, educação no trânsito, sinalização viária e credenciais." },
    { property: "og:title", content: "Painel integrado | SESTRAN Paranavaí" },
    { property: "og:description", content: "Resumo dos módulos da Central de Sistema da SESTRAN Paranavaí." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: Painel,
});

type ItemOS = { id: string; numero: string; titulo: string | null; data_servico: string; hora_inicio: string | null; hora_fim: string | null; status: string | null; local: string | null };
type ItemEducacao = { id: string; titulo: string; data_acao: string; horario_inicio: string | null; horario_fim: string | null; status: string; local: string | null };
type ItemVeiculo = VeiculoBase & { id: string; marca: string | null; modelo: string | null; placa: string | null; endereco: string; bairro: string | null };
type ItemSinalizacao = { id: string; numero: string; data: string; natureza: string; endereco: string; pedido: string; funcionario: string | null; status: string };
type DadosPainel = {
  os: { mes: ItemOS[]; proximas: ItemOS[]; agendadas: number; executadas: number };
  educacao: { mes: ItemEducacao[]; proximas: ItemEducacao[]; agendadas: number; realizadas: number };
  veiculos: ItemVeiculo[];
  sinalizacao: ItemSinalizacao[];
  credenciais: { total: number; validas: number; idosos: number; pcd: number; vencidas: number; ocorrencia: number };
};
function classeStatus(status: string) {
  if (["EXECUTADA", "REALIZADA", "RETIRADO", "RECOLHIDO", "Concluída"].includes(status)) return "border-success/25 bg-success/10 text-success";
  if (["CANCELADA", "RECOLHER", "Cancelada"].includes(status)) return "border-destructive/25 bg-destructive/10 text-destructive";
  if (["EM_ANDAMENTO", "NOTIFICADO", "Aguardando"].includes(status)) return "border-warning/30 bg-warning/15 text-warning-foreground";
  return "border-primary/20 bg-primary/5 text-primary";
}
function Situacao({ status, label }: { status: string; label: string }) { return <Badge variant="outline" className={cn("max-w-full whitespace-normal text-[10px]", classeStatus(status))}>{label}</Badge>; }
const numero = (n: number | undefined) => n === undefined ? "—" : n.toLocaleString("pt-BR");
function dataPorExtenso(d: Date) {
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .replace(/(^|[\s-])(\p{L})(?=\p{L}{2,})/gu, (_m, a: string, b: string) => a + b.toUpperCase()).replace(/ De /g, " de ");
}

function Cartao({ titulo, link, liberado = true, children }: { titulo: string; link?: ReactNode; liberado?: boolean; children: ReactNode }) {
  return <section aria-label={titulo} className="flex h-full min-w-0 flex-col rounded-lg border bg-card p-4 shadow-sm">
    <header className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <h2 className="min-w-0 break-words font-display text-sm font-semibold">{titulo}</h2>
      {liberado ? link && <Button variant="outline" size="sm" className="h-8 shrink-0 text-xs font-semibold" asChild>{link}</Button>
        : <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-dashed px-2 py-1 text-[11px] text-muted-foreground" title="Solicite a liberação deste módulo ao administrador"><Lock className="h-3 w-3" aria-hidden="true" />Sem acesso</span>}
    </header>
    {children}
  </section>;
}
function Lista({ titulo, quantidade, carregando, erro, onTentar, altura, children }: { titulo?: string; quantidade: number; carregando: boolean; erro: boolean; onTentar: () => void; altura: string; children: ReactNode }) {
  return <div className="mt-3 min-w-0 border-t pt-2">
    {titulo && <p className="mb-1 text-xs font-semibold">{titulo}</p>}
    <div className={cn("overflow-y-auto pr-1", altura)} tabIndex={0} aria-label={titulo ?? "Registros"}>
      {carregando ? <div className="space-y-2 py-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
        : erro ? <div className="py-4 text-center"><p className="text-xs text-destructive">Não foi possível carregar os registros.</p><Button variant="outline" size="sm" className="mt-2" onClick={onTentar}><RefreshCw className="h-3 w-3" />Tentar novamente</Button></div>
        : quantidade === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">Nenhum registro neste período.</p> : children}
    </div>
  </div>;
}
function Contador({ valor, rotulo, carregando, className }: { valor: ReactNode; rotulo: string; carregando?: boolean; className?: string }) {
  return <div className={cn("min-w-0 rounded-md bg-muted/60 px-1 py-2 text-center", className)}>
    {carregando ? <Skeleton className="mx-auto h-6 w-8" /> : <p className="font-display text-xl font-semibold leading-tight">{valor}</p>}
    <p className="break-words text-[10px] leading-tight text-muted-foreground">{rotulo}</p>
  </div>;
}
function Visualizar({ titulo, children }: { titulo: string; children: ReactNode }) {
  return <Button variant="ghost" size="icon" className="h-7 w-7" title={titulo} aria-label={titulo} asChild>{children}</Button>;
}

function Painel() {
  const { data: sessao } = useSessao();
  const [mesOS, setMesOS] = useState(new Date()); const [diaOS, setDiaOS] = useState<Date>();
  const [mesEducacao, setMesEducacao] = useState(new Date()); const [diaEducacao, setDiaEducacao] = useState<Date>();
  const [situacaoVeiculo, setSituacaoVeiculo] = useState<string>();
  const osLiberada = temAcesso(sessao, "OS"), educacaoLiberada = temAcesso(sessao, "EDUCACAO"), veiculosLiberados = temAcesso(sessao, "VEICULOS");
  const sinalizacaoLiberada = temAcesso(sessao, "SINALIZACAO"), credenciaisLiberadas = temAcesso(sessao, "CREDENCIAIS");
  const periodoOS = periodoCalendario(mesOS), periodoEducacao = periodoCalendario(mesEducacao);
  const hoje = dataLocalIso(new Date());
  const admin = administrador(sessao);
  const nenhum = !osLiberada && !educacaoLiberada && !veiculosLiberados && !sinalizacaoLiberada && !credenciaisLiberadas;
  // Resumo de todos os módulos para qualquer usuário com algum módulo liberado; abrir cada módulo continua dependendo da liberação.
  const painel = useQuery({
    queryKey: ["painel", "dados", sessao?.userId, periodoOS, periodoEducacao, hoje], enabled: Boolean(sessao) && !nenhum && admin,
    placeholderData: (anterior) => anterior,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("painel_dados", { _os_inicio: periodoOS.inicio, _os_fim: periodoOS.fim, _edu_inicio: periodoEducacao.inicio, _edu_fim: periodoEducacao.fim, _hoje: hoje });
      if (error) throw error;
      return data as unknown as DadosPainel;
    },
  });
  const carregando = painel.isFetching && !painel.data, erro = painel.isError && !painel.data;
  const recarregar = () => void painel.refetch();
  const ordens = { data: painel.data?.os, isFetching: carregando, isError: erro, refetch: recarregar };
  const educacao = { data: painel.data?.educacao, isFetching: carregando, isError: erro, refetch: recarregar };
  const veiculos = { data: painel.data?.veiculos, isFetching: carregando, isError: erro, refetch: recarregar };
  const sinalizacao = { data: painel.data?.sinalizacao, isFetching: carregando, isError: erro, refetch: recarregar };
  const credenciais = painel.data?.credenciais;
  const credCarregando = carregando, credErro = erro;

  const itensOS = diaOS ? (ordens.data?.mes ?? []).filter(o => o.data_servico === dataLocalIso(diaOS)) : ordens.data?.proximas ?? [];
  const itensEducacao = diaEducacao ? (educacao.data?.mes ?? []).filter(a => a.data_acao === dataLocalIso(diaEducacao)) : educacao.data?.proximas ?? [];
  const itensVeiculos = (veiculos.data ?? []).filter(v => !situacaoVeiculo || statusEfetivo(v) === situacaoVeiculo);
  const itensSinalizacao = sinalizacao.data ?? [];
  const blocos = [
    { label: "Total de registros", status: undefined, cor: "border-primary" },
    { label: "Retirados", status: "RETIRADO", cor: "border-success" },
    { label: "Notificados", status: "NOTIFICADO", cor: "border-warning" },
    { label: "A recolher", status: "RECOLHER", cor: "border-destructive" },
  ];
  function atualizar() { if (!nenhum) recarregar(); }

  if (sessao && !admin) return <div className="space-y-5">
    {nenhum && <p className="border-l-2 border-warning py-3 pl-4 text-sm text-muted-foreground">Bem-vindo, {sessao?.nome}. Aguardando liberação de acesso aos módulos pelo administrador.</p>}
    <PainelUsuario sessao={sessao} dataExtenso={dataPorExtenso(new Date())} noticia={NOTICIA} />
  </div>;

  return <div className="space-y-5">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:gap-6">
      <h1 className="col-span-2 min-w-0 break-words font-display text-2xl font-bold text-primary sm:text-3xl lg:col-span-1 lg:text-4xl 2xl:text-5xl">Central de Sistema - SESTRAN</h1>
      <p className="min-w-0 rounded-md bg-muted px-3 py-1.5 text-sm font-semibold text-foreground lg:text-base">{dataPorExtenso(new Date())}</p>
      <Button variant="outline" size="icon" className="shrink-0" title="Atualizar painel" aria-label="Atualizar painel" onClick={atualizar}><RefreshCw className="h-4 w-4" /></Button>
    </div>
    {nenhum && <p className="border-l-2 border-warning py-3 pl-4 text-sm text-muted-foreground">Bem-vindo, {sessao?.nome}. Aguardando liberação de acesso aos módulos pelo administrador.</p>}
    <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
      {!nenhum && <Cartao titulo="Ordem de Serviço" liberado={osLiberada} link={<Link to="/ordens-servico">Abrir módulo</Link>}>
        <CalendarioPainel compacto nome="Ordem de Serviço" mes={mesOS} selecionada={diaOS} datas={(ordens.data?.mes ?? []).map(o => o.data_servico)} onMes={d => { setMesOS(d); setDiaOS(undefined); }} onSelecionar={setDiaOS} />
        <div className="mt-2 grid grid-cols-2 gap-2"><Contador valor={ordens.data?.agendadas ?? "—"} rotulo="agendadas" /><Contador valor={ordens.data?.executadas ?? "—"} rotulo="executadas" /></div>
        {diaOS && <Button variant="ghost" size="sm" className="mt-1 h-5 self-start px-1 text-xs" onClick={() => setDiaOS(undefined)}><X className="h-3 w-3" />Limpar data</Button>}
        <Lista titulo={diaOS ? `O.S. de ${formatarData(dataLocalIso(diaOS))}` : "Próximas atividades"} altura="h-36" quantidade={itensOS.length} carregando={ordens.isFetching} erro={ordens.isError} onTentar={() => void ordens.refetch()}>
          <ul className="divide-y">{itensOS.map(o => <li key={o.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 py-2">
            <div className="min-w-0"><p className="break-words text-xs font-medium">{o.numero} — <TextoFormatado valor={o.titulo ?? ""} /></p><p className="truncate text-[11px] text-muted-foreground">{o.local || "Serviço programado"} · {formatarData(o.data_servico)} · {periodoHorario(o.hora_inicio, o.hora_fim)}</p></div>
            <div className="flex shrink-0 items-center gap-1">{osLiberada && <Visualizar titulo={`Visualizar O.S. ${o.numero}`}><Link to="/ordens-servico/visualizar/$id" params={{ id: o.id }}><Eye className="h-4 w-4" /></Link></Visualizar>}{temAcesso(sessao, "OS", "OPERADOR") && <Visualizar titulo={`Editar O.S. ${o.numero}`}><Link to="/ordens-servico/editar/$id" params={{ id: o.id }}><Pencil className="h-3.5 w-3.5" /></Link></Visualizar>}<Situacao status={o.status ?? "AGENDADA"} label={STATUS_OS_LABEL[o.status as keyof typeof STATUS_OS_LABEL] ?? o.status ?? "Agendada"} /></div>
          </li>)}</ul>
        </Lista>
      </Cartao>}

      {!nenhum && <Cartao titulo="Veículos Abandonados" liberado={veiculosLiberados} link={<Link to="/veiculos-abandonados">Abrir módulo</Link>}>
        <div className="grid grid-cols-2 gap-2">{blocos.map(b => <Button key={b.label} variant="ghost" aria-pressed={situacaoVeiculo === b.status} className={cn("h-20 min-w-0 justify-start whitespace-normal rounded-md border border-l-[3px] bg-card p-3 text-left", b.cor, situacaoVeiculo === b.status && "ring-1 ring-ring")} onClick={() => setSituacaoVeiculo(b.status)}><span className="min-w-0"><span className="block text-[11px] text-muted-foreground">{b.label}</span>{veiculos.isFetching ? <Skeleton className="mt-2 h-7 w-12" /> : <span className="mt-1 block font-display text-2xl font-semibold">{veiculos.isError ? "—" : b.status ? (veiculos.data ?? []).filter(v => statusEfetivo(v) === b.status).length : veiculos.data?.length ?? 0}</span>}</span></Button>)}</div>
        <div className="mt-1 min-h-5 text-xs text-muted-foreground">{situacaoVeiculo ? <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={() => setSituacaoVeiculo(undefined)}><X className="h-3 w-3" />Todas as situações</Button> : null}</div>
        <Lista titulo={situacaoVeiculo ? (STATUS_VEICULO_LABEL[situacaoVeiculo as keyof typeof STATUS_VEICULO_LABEL] ?? situacaoVeiculo) : "Veículos cadastrados"} altura="h-60" quantidade={itensVeiculos.length} carregando={veiculos.isFetching} erro={veiculos.isError} onTentar={() => void veiculos.refetch()}>
          <ul className="divide-y">{itensVeiculos.map(v => <li key={v.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 py-2">
            <div className="min-w-0"><p className="break-words text-xs font-medium">{[v.marca, v.modelo, v.placa].filter(Boolean).join(" · ") || "Veículo sem identificação"}</p><p className="break-words text-[11px] text-muted-foreground">{v.endereco}{v.bairro ? ` · ${v.bairro}` : ""}{v.data_notificacao ? ` · ${formatarData(v.data_notificacao)}` : ""}</p></div>
            <div className="flex shrink-0 items-center gap-1">{veiculosLiberados && <Visualizar titulo={`Visualizar veículo ${v.placa ?? "sem placa"}`}><Link to="/documento-veiculo/$id" params={{ id: v.id }}><Eye className="h-4 w-4" /></Link></Visualizar>}<Situacao status={statusEfetivo(v)} label={STATUS_VEICULO_LABEL[statusEfetivo(v)] ?? String(statusEfetivo(v))} /></div>
          </li>)}</ul>
        </Lista>
      </Cartao>}

      {!nenhum && <Cartao titulo="Educação no Trânsito" liberado={educacaoLiberada} link={<Link to="/educacao-transito">Abrir módulo</Link>}>
        <CalendarioPainel compacto educativo nome="Educação no Trânsito" mes={mesEducacao} selecionada={diaEducacao} datas={(educacao.data?.mes ?? []).map(a => a.data_acao)} onMes={d => { setMesEducacao(d); setDiaEducacao(undefined); }} onSelecionar={setDiaEducacao} />
        <div className="mt-2 grid grid-cols-2 gap-2"><Contador valor={educacao.data?.agendadas ?? "—"} rotulo="agendadas" /><Contador valor={educacao.data?.realizadas ?? "—"} rotulo="realizadas" /></div>
        {diaEducacao && <Button variant="ghost" size="sm" className="mt-1 h-5 self-start px-1 text-xs" onClick={() => setDiaEducacao(undefined)}><X className="h-3 w-3" />Limpar data</Button>}
        <Lista titulo={diaEducacao ? `Atividades de ${formatarData(dataLocalIso(diaEducacao))}` : "Agendamentos"} altura="h-36" quantidade={itensEducacao.length} carregando={educacao.isFetching} erro={educacao.isError} onTentar={() => void educacao.refetch()}>
          <ul className="divide-y">{itensEducacao.map(a => <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 py-2">
            <div className="min-w-0"><p className="break-words text-xs font-medium"><TextoFormatado valor={a.titulo} /></p><p className="break-words text-[11px] text-muted-foreground">{a.local || "Local não informado"} · {formatarData(a.data_acao)} · {periodoHorario(a.horario_inicio, a.horario_fim)}</p></div>
            <div className="flex shrink-0 items-center gap-1">{educacaoLiberada && <Visualizar titulo="Visualizar ação educativa"><Link to="/agenda-educativa/$id" params={{ id: a.id }}><Eye className="h-4 w-4" /></Link></Visualizar>}<Situacao status={a.status} label={STATUS_ACAO_LABEL[a.status as keyof typeof STATUS_ACAO_LABEL] ?? a.status} /></div>
          </li>)}</ul>
        </Lista>
      </Cartao>}

      {!nenhum && <Cartao titulo="Sinalização Viária - O.S." liberado={sinalizacaoLiberada} link={<Link to="/sinalizacao-viaria">Abrir módulo</Link>}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Contador carregando={sinalizacao.isFetching} valor={sinalizacao.isError ? "—" : itensSinalizacao.length} rotulo="Total de O.S." />
          <Contador carregando={sinalizacao.isFetching} valor={sinalizacao.isError ? "—" : itensSinalizacao.filter(o => o.status === "Aguardando").length} rotulo="Aguardando" />
          <Contador carregando={sinalizacao.isFetching} valor={sinalizacao.isError ? "—" : itensSinalizacao.filter(o => o.status === "Em Execução").length} rotulo="Em Execução" />
          <Contador carregando={sinalizacao.isFetching} valor={sinalizacao.isError ? "—" : itensSinalizacao.filter(o => o.status === "Concluída").length} rotulo="Concluídas" />
        </div>
        <Lista altura="h-56" quantidade={itensSinalizacao.length} carregando={sinalizacao.isFetching} erro={sinalizacao.isError} onTentar={() => void sinalizacao.refetch()}>
          <ul className="divide-y">{itensSinalizacao.map(o => <li key={o.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 py-2">
            <div className="min-w-0"><p className="text-[11px] font-bold text-primary">{o.numero} · {formatarData(o.data)}</p><p className="break-words text-xs font-medium">{o.natureza} — {o.endereco}</p><p className="break-words text-[11px] text-muted-foreground">{o.pedido}{o.funcionario ? ` · Responsável: ${o.funcionario}` : ""}</p></div>
            <div className="flex shrink-0 items-center gap-1">{sinalizacaoLiberada && <Visualizar titulo={`Abrir O.S. ${o.numero} no módulo`}><Link to="/sinalizacao-viaria"><Eye className="h-4 w-4" /></Link></Visualizar>}<Situacao status={o.status} label={o.status} /></div>
          </li>)}</ul>
        </Lista>
      </Cartao>}

      {!nenhum && <Cartao titulo="Credenciais de Estacionamento - Idoso / PCD" liberado={credenciaisLiberadas} link={<Link to="/credenciais">Abrir módulo</Link>}>
        {credErro ? <div className="py-6 text-center"><p className="text-xs text-destructive">Não foi possível carregar as credenciais.</p><Button variant="outline" size="sm" className="mt-2" onClick={recarregar}><RefreshCw className="h-3 w-3" />Tentar novamente</Button></div>
          : <div className="grid flex-1 grid-cols-2 content-center gap-3">
            {([["Total de cadastros", credenciais?.total], ["Válidas", credenciais?.validas], ["Idosos", credenciais?.idosos], ["PcD", credenciais?.pcd], ["Vencidas", credenciais?.vencidas], ["Com ocorrência", credenciais?.ocorrencia]] as const).map(([rotulo, valor], i) =>
{
                const conteudo = <>{credCarregando && valor === undefined ? <Skeleton className="h-7 w-16" /> : <p className="font-display text-xl font-semibold">{numero(valor)}</p>}
                  <p className="truncate text-[11px] text-muted-foreground">{rotulo}</p></>;
                const classe = cn("min-w-0 rounded-md border bg-card px-3 py-3 shadow-sm", i === 0 && "border-primary/40 bg-primary/5");
                return credenciaisLiberadas
                  ? <Link key={rotulo} to="/credenciais-consulta" title={`Consultar credenciais — ${rotulo}`} className={cn(classe, "transition-colors hover:bg-muted/60")}>{conteudo}</Link>
                  : <div key={rotulo} className={classe}>{conteudo}</div>;
              })}
          </div>}
      </Cartao>}

      <section aria-label="Secretaria em Destaque" className="flex h-full min-w-0 flex-col rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="border-b pb-2 text-center font-display text-xl font-bold">Secretaria em Destaque</h2>
        <a href={NOTICIA.url} target="_blank" rel="noopener noreferrer" className="mt-3 block overflow-hidden rounded-md">
          <img src={noticiaAsset.url} alt={NOTICIA.titulo} loading="lazy" className="aspect-[400/211] w-full object-cover" />
        </a>
        <p className="mt-3 text-center text-xs font-semibold">{NOTICIA.titulo}</p>
        <p className="mt-1 text-center text-[11px] italic text-muted-foreground">{NOTICIA.resumo}</p>
        <div className="mt-auto flex justify-end pt-3">
          <Button size="sm" asChild><a href={NOTICIA.url} target="_blank" rel="noopener noreferrer">Acessar<ExternalLink className="h-3.5 w-3.5" /></a></Button>
        </div>
      </section>
    </div>
  </div>;
}
