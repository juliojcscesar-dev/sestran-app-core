import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Detalhes = {
  client?: { name?: string; redirect_uri?: string } | null;
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
type Resultado = { data: Detalhes | null; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<Resultado>;
  approveAuthorization: (id: string) => Promise<Resultado>;
  denyAuthorization: (id: string) => Promise<Resultado>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Autorizar conexão | SESTRAN Paranavaí" },
      { name: "description", content: "Autorize um assistente a consultar o SESTRAN com a sua conta." },
      { property: "og:title", content: "Autorizar conexão | SESTRAN Paranavaí" },
      { property: "og:description", content: "Autorização de acesso de assistentes ao SESTRAN." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Pedido de autorização inválido ou ausente.");
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth", search: { next: location.pathname + location.searchStr } });
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.search).get("authorization_id") ?? "";
    const { data, error } = await oauth().getAuthorizationDetails(id);
    if (error) throw new Error(error.message);
    const imediato = data?.redirect_url ?? data?.redirect_to;
    if (imediato && !data?.client) throw redirect({ href: imediato });
    const { data: u } = await supabase.auth.getUser();
    return { detalhes: data, email: u.user?.email ?? "" };
  },
  component: Consentimento,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Não foi possível abrir a autorização</CardTitle>
          <CardDescription>{error instanceof Error ? error.message : String(error)} O pedido pode ter expirado; tente conectar novamente.</CardDescription>
        </CardHeader>
      </Card>
    </main>
  ),
});

const ROTULOS: Record<string, string> = { openid: "Identificar sua conta", email: "Compartilhar seu e-mail", profile: "Compartilhar seu perfil básico" };

function Consentimento() {
  const { detalhes, email } = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const cliente = detalhes?.client?.name ?? "Um aplicativo";
  const escopos = (detalhes?.scope ?? "").split(/\s+/).filter(Boolean);

  async function decidir(aprovar: boolean) {
    setOcupado(true);
    setErro(null);
    const { data, error } = aprovar ? await oauth().approveAuthorization(authorization_id) : await oauth().denyAuthorization(authorization_id);
    const destino = data?.redirect_url ?? data?.redirect_to;
    if (error || !destino) {
      setOcupado(false);
      setErro(error?.message ?? "O servidor de autorização não retornou o endereço de retorno.");
      return;
    }
    window.location.href = destino;
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Conectar {cliente} ao SESTRAN</CardTitle>
          <CardDescription>Conta: {email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>{cliente} poderá consultar, como você, os módulos liberados para a sua conta (somente leitura).</p>
          {detalhes?.client?.redirect_uri && <p className="text-muted-foreground">Retorno: {detalhes.client.redirect_uri}</p>}
          {escopos.length > 0 && (
            <ul className="list-disc pl-5">
              {escopos.map((e) => <li key={e}>{ROTULOS[e] ?? `Permissão adicional: ${e}`}</li>)}
            </ul>
          )}
          <p className="text-muted-foreground">Isso não ultrapassa as permissões da sua conta no sistema.</p>
          {erro && <p role="alert" className="text-destructive">{erro}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" disabled={ocupado} onClick={() => decidir(true)}>Autorizar</Button>
            <Button className="flex-1" variant="outline" disabled={ocupado} onClick={() => decidir(false)}>Cancelar conexão</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
