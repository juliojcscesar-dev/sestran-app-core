import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Lock } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { temAcesso, type ModuloAcesso } from "@/lib/permissoes";
import { cn } from "@/lib/utils";
import centralAsset from "@/assets/painel-central-sestran.png.asset.json";
import osAsset from "@/assets/painel-os.png.asset.json";
import veiculosAsset from "@/assets/painel-veiculos.png.asset.json";
import sinalizacaoAsset from "@/assets/painel-sinalizacao.png.asset.json";
import credenciaisAsset from "@/assets/painel-credenciais.png.asset.json";
import educacaoAsset from "@/assets/painel-educacao.png.asset.json";
import ditranAsset from "@/assets/painel-ditran.jpg.asset.json";
import noticiaAsset from "@/assets/noticia-educacao-transito.png.asset.json";

type Sessao = Parameters<typeof temAcesso>[0];
type Noticia = { url: string; titulo: string; resumo: string };

function Modulo({ sessao, modulo, href, img, titulo }: { sessao: Sessao; modulo: ModuloAcesso; href: string; img: string; titulo: string }) {
  const liberado = temAcesso(sessao, modulo);
  const imagem = <img src={img} alt={titulo} loading="lazy" className="mx-auto max-h-56 w-full object-contain" />;
  if (liberado) return <Link to={href} title={`Abrir ${titulo}`} className="block rounded-lg transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{imagem}</Link>;
  return <div className="relative rounded-lg" title="Solicite a liberação deste módulo ao administrador">
    <div className="opacity-40 grayscale">{imagem}</div>
    <span className="absolute inset-x-0 bottom-2 mx-auto flex w-fit items-center gap-1 rounded-md border bg-card px-2 py-1 text-[11px] text-muted-foreground"><Lock className="h-3 w-3" />Sem acesso</span>
  </div>;
}

export function PainelUsuario({ sessao, dataExtenso, noticia }: { sessao: Sessao; dataExtenso: string; noticia: Noticia }) {
  const [dia, setDia] = useState<Date | undefined>(new Date());
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
    <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <img src={centralAsset.url} alt="Central de Sistema SESTRAN — Tecnologia e Inovação" className="mx-auto max-h-56 w-full object-contain sm:col-span-2 lg:col-span-3 lg:max-h-44 lg:max-w-[21rem]" />
      <Modulo sessao={sessao} modulo="OS" href="/ordens-servico" img={osAsset.url} titulo="Ordem de Serviço" />
      <Modulo sessao={sessao} modulo="SINALIZACAO" href="/sinalizacao-viaria" img={sinalizacaoAsset.url} titulo="Sinalização Viária" />
      <Modulo sessao={sessao} modulo="VEICULOS" href="/veiculos-abandonados" img={veiculosAsset.url} titulo="Veículo Abandonado" />
      <Modulo sessao={sessao} modulo="CREDENCIAIS" href="/credenciais" img={credenciaisAsset.url} titulo="Credenciais para Vagas Exclusivas" />
      <img src={ditranAsset.url} alt="DITRAN Paranavaí" loading="lazy" className="mx-auto max-h-56 w-full object-contain" />
      <Modulo sessao={sessao} modulo="EDUCACAO" href="/educacao-transito" img={educacaoAsset.url} titulo="Educação no Trânsito" />
    </div>
    <aside className="space-y-5">
      <p className="rounded-md bg-muted px-3 py-2 text-center text-sm font-semibold">{dataExtenso}</p>
      <div className="rounded-lg border bg-card p-2 shadow-sm"><Calendar mode="single" locale={ptBR} selected={dia} onSelect={setDia} className={cn("mx-auto")} /></div>
      <section aria-label="Secretaria em Destaque" className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="border-b pb-2 text-center font-display text-lg font-bold">Secretaria em Destaque</h2>
        <a href={noticia.url} target="_blank" rel="noopener noreferrer" className="mt-3 block overflow-hidden rounded-md">
          <img src={noticiaAsset.url} alt={noticia.titulo} loading="lazy" className="aspect-[400/211] w-full object-cover" />
        </a>
        <p className="mt-3 text-center text-xs font-semibold">{noticia.titulo}</p>
        <p className="mt-1 text-center text-[11px] italic text-muted-foreground">{noticia.resumo}</p>
        <div className="flex justify-end pt-3"><Button size="sm" asChild><a href={noticia.url} target="_blank" rel="noopener noreferrer">Acessar<ExternalLink className="h-3.5 w-3.5" /></a></Button></div>
      </section>
    </aside>
  </div>;
}
