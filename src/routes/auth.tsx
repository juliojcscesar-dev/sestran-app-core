import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { LogosInstitucionais } from "@/components/layout/LogosInstitucionais";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Acesso ao sistema | SESTRAN Paranavaí" },
      {
        name: "description",
        content:
          "Área restrita do SESTRAN — Gestão de Trânsito e Eventos da Prefeitura de Paranavaí/PR.",
      },
      { property: "og:title", content: "Acesso ao sistema | SESTRAN Paranavaí" },
      {
        property: "og:description",
        content: "Área restrita para servidores da Secretaria de Trânsito de Paranavaí.",
      },
    ],
  }),
  component: PaginaAcesso,
});

const esquemaLogin = z.object({
  email: z.string().trim().min(1, "Informe o e-mail").email("E-mail inválido"),
  senha: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
});

const esquemaCadastro = esquemaLogin.extend({
  nome: z.string().trim().min(3, "Informe o nome completo").max(120, "Nome muito longo"),
  cargo: z.string().trim().max(80, "Cargo muito longo").optional(),
});

function PaginaAcesso() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const formEntrar = useRef<HTMLFormElement>(null);

  async function esqueciSenha() {
    const email = String(
      formEntrar.current ? new FormData(formEntrar.current).get("email") ?? "" : "",
    ).trim();
    const valido = z.string().email().safeParse(email);
    if (!valido.success) {
      setErros({ email: "Digite seu e-mail acima para receber o link." });
      return;
    }
    setErros({});
    setCarregando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/definir-senha`,
    });
    setCarregando(false);
    if (error) {
      toast.error("Não foi possível enviar o link", {
        description: "Aguarde alguns minutos e tente novamente.",
      });
      return;
    }
    toast.success("Link enviado", {
      description: "Abra o e-mail recebido e clique no link para criar uma nova senha.",
    });
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/painel", replace: true });
    });
  }, [navigate]);

  async function entrar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const resultado = esquemaLogin.safeParse({
      email: String(dados.get("email") ?? ""),
      senha: String(dados.get("senha") ?? ""),
    });
    if (!resultado.success) {
      setErros(mapearErros(resultado.error));
      return;
    }
    setErros({});
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: resultado.data.email,
      password: resultado.data.senha,
    });
    setCarregando(false);
    if (error) {
      toast.error("Não foi possível entrar", {
        description: "Verifique o e-mail e a senha informados.",
      });
      return;
    }
    navigate({ to: "/painel", replace: true });
  }

  async function cadastrar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const resultado = esquemaCadastro.safeParse({
      nome: String(dados.get("nome") ?? ""),
      cargo: String(dados.get("cargo") ?? ""),
      email: String(dados.get("email") ?? ""),
      senha: String(dados.get("senha") ?? ""),
    });
    if (!resultado.success) {
      setErros(mapearErros(resultado.error));
      return;
    }
    setErros({});
    setCarregando(true);
    const { data, error } = await supabase.auth.signUp({
      email: resultado.data.email,
      password: resultado.data.senha,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nome_completo: resultado.data.nome, cargo: resultado.data.cargo },
      },
    });
    setCarregando(false);
    if (error) {
      toast.error("Não foi possível criar a conta", { description: error.message });
      return;
    }
    if (!data.session) {
      toast.success("Conta criada", {
        description: "Confirme o cadastro pelo link enviado ao seu e-mail para acessar o sistema.",
      });
      return;
    }
    navigate({ to: "/painel", replace: true });
  }

  async function entrarComGoogle() {
    setCarregando(true);
    const resultado = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (resultado.error) {
      setCarregando(false);
      toast.error("Não foi possível entrar com o Google");
      return;
    }
    if (resultado.redirected) return;
    navigate({ to: "/painel", replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <LogosInstitucionais />
        <div>
          <h2 className="font-display text-3xl font-semibold leading-tight">
            Central de Sistema
          </h2>
          <p className="mt-3 max-w-md text-sm text-sidebar-foreground/80">
            Sistema administrativo da Secretaria de Trânsito da Prefeitura Municipal de Paranavaí
            para ordens de serviço, eventos, equipes e ações educativas.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/60">
          Acesso restrito a servidores autorizados. Todas as ações ficam registradas.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-6 p-6">
        <div className="w-full max-w-md lg:hidden">
          <LogosInstitucionais />
          <h1 className="mt-5 text-center font-display text-2xl font-semibold">Central de Sistema</h1>
        </div>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">Acesso ao sistema</CardTitle>
            <CardDescription>Entre com sua conta institucional.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="entrar">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="entrar">Entrar</TabsTrigger>
                <TabsTrigger value="criar">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="entrar">
                <form ref={formEntrar} onSubmit={entrar} className="space-y-4" noValidate>
                  <Campo id="email" rotulo="E-mail" tipo="email" erro={erros["email"]} />
                  <Campo id="senha" rotulo="Senha" tipo="password" erro={erros["senha"]} />
                  <Button type="submit" className="w-full" disabled={carregando}>
                    {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                  <button
                    type="button"
                    onClick={esqueciSenha}
                    disabled={carregando}
                    className="w-full text-center text-sm text-primary underline-offset-4 hover:underline"
                  >
                    Esqueci minha senha / criar senha
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="criar">
                <form onSubmit={cadastrar} className="space-y-4" noValidate>
                  <Campo id="nome" rotulo="Nome completo" tipo="text" erro={erros["nome"]} />
                  <Campo id="cargo" rotulo="Cargo (opcional)" tipo="text" erro={erros["cargo"]} />
                  <Campo id="email" rotulo="E-mail" tipo="email" erro={erros["email"]} />
                  <Campo id="senha" rotulo="Senha" tipo="password" erro={erros["senha"]} />
                  <p className="text-xs text-muted-foreground">
                    Novas contas acessam somente a página inicial. O administrador libera
                    Consulta ou Operador em cada módulo.
                  </p>
                  <Button type="submit" className="w-full" disabled={carregando}>
                    {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar conta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              ou
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={entrarComGoogle}
              disabled={carregando}
            >
              Entrar com Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Campo({
  id,
  rotulo,
  tipo,
  erro,
}: {
  id: string;
  rotulo: string;
  tipo: string;
  erro?: string | undefined;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      <Input id={id} name={id} type={tipo} aria-invalid={Boolean(erro)} />
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}

function mapearErros(erro: z.ZodError) {
  const mapa: Record<string, string> = {};
  for (const item of erro.issues) {
    const campo = String(item.path[0] ?? "");
    if (campo && !mapa[campo]) mapa[campo] = item.message;
  }
  return mapa;
}
