import { Suspense, lazy, useEffect, useState } from "react";
import type { MapaPercursoProps } from "@/components/os/MapaPercurso";

const MapaPercurso = lazy(() => import("@/components/os/MapaPercurso"));

/** Carrega o mapa somente no navegador (a biblioteca depende de window). */
export function MapaOS(props: MapaPercursoProps) {
  const [pronto, setPronto] = useState(false);
  useEffect(() => setPronto(true), []);

  const espaco = (
    <div
      className="flex w-full items-center justify-center rounded-md border bg-muted/40 text-sm text-muted-foreground"
      style={{ height: props.altura ?? 420 }}
    >
      Carregando mapa…
    </div>
  );

  if (!pronto) return espaco;
  return (
    <Suspense fallback={espaco}>
      <MapaPercurso {...props} />
    </Suspense>
  );
}
