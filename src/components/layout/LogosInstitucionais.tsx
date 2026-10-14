import secretaria from "@/assets/secretaria-logo.png.asset.json";
import ditran from "@/assets/ditran-logo.jpg.asset.json";

export function LogosInstitucionais({ compacto = false }: { compacto?: boolean }) {
  if (compacto) return (
    <div className="rounded-md bg-brand-surface px-3 py-3 text-brand-ink">
      <img src={secretaria.url} alt="Prefeitura de Paranavaí — Secretaria Municipal de Segurança e Trânsito" className="h-auto w-full object-contain" />
      <div className="mt-3 flex items-center justify-center gap-3 border-t border-border pt-3">
        <img src={ditran.url} alt="DITRAN Paranavaí" className="h-14 w-14 shrink-0 object-contain" />
        <p className="text-xs font-medium leading-snug">Diretoria de<br />Trânsito</p>
      </div>
    </div>
  );
  return (
    <div className="flex w-full items-center justify-between gap-4 bg-brand-surface px-4 py-6 sm:gap-10 sm:px-8 sm:py-8">
      <img src={secretaria.url} alt="Prefeitura de Paranavaí — Secretaria Municipal de Segurança e Trânsito" className="h-auto w-full min-w-0 max-w-xl flex-1 object-contain" />
      <div className="shrink-0 border-l border-border pl-4 sm:pl-8">
        <img src={ditran.url} alt="DITRAN — Diretoria de Trânsito de Paranavaí" className="h-20 w-20 object-contain sm:h-28 sm:w-28" />
      </div>
    </div>
  );
}