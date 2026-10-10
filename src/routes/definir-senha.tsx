import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export const Route = createFileRoute("/definir-senha")({
  head: () => ({ meta: [{ title: "Definir senha | SESTRAN Paranavaí" }, { name: "description", content: "Defina sua senha de acesso após aceitar o convite institucional." }, { property: "og:title", content: "Definir senha | SESTRAN Paranavaí" }, { property: "og:description", content: "Ativação do acesso convidado à SESTRAN." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: DefinirSenha,
});
function DefinirSenha() {
  const [senha,setSenha] = useState(""); const [confirmacao,setConfirmacao] = useState(""); const [erro,setErro] = useState(""); const [salvando,setSalvando] = useState(false); const [pronto,setPronto] = useState(false);
  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setErro("");
    if(senha.length<8 || senha!==confirmacao) {setErro("Use pelo menos 8 caracteres e confirme a mesma senha.");return;}
    setSalvando(true);
    try {
      const {data,error} = await supabase.auth.getUser();
      if(error||!data.user) {setErro("O convite expirou ou não foi aceito. Abra o link recebido por e-mail.");return;}
      const resultado = await supabase.auth.updateUser({password:senha});
      if(resultado.error) {setErro("Não foi possível definir a senha. Tente novamente.");return;}
      setPronto(true);
    } finally {setSalvando(false);}
  }
  return <main className="mx-auto max-w-md space-y-6 px-6 py-16"><p className="font-display text-lg text-primary">SESTRAN Paranavaí</p><h1 className="font-display text-2xl font-semibold">Definir senha</h1>{pronto?<div className="space-y-4"><p>Senha definida.</p><Button asChild><Link to="/painel">Acessar o início</Link></Button></div>:<form onSubmit={salvar} className="space-y-4"><label className="block text-sm">Nova senha<Input type="password" autoComplete="new-password" required minLength={8} value={senha} onChange={e=>setSenha(e.target.value)}/></label><label className="block text-sm">Confirmar senha<Input type="password" autoComplete="new-password" required value={confirmacao} onChange={e=>setConfirmacao(e.target.value)}/></label>{erro&&<p role="alert" className="text-sm text-destructive">{erro}</p>}<Button type="submit" disabled={salvando}>Salvar senha</Button></form>}</main>;
}