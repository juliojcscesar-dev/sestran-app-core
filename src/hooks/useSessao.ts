import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Papel } from "@/lib/sestran";
import type { PermissaoModulo } from "@/lib/permissoes";

export type Sessao = {
  userId: string;
  email: string | null;
  nome: string;
  cargo: string | null;
  ativo: boolean;
  papeis: Papel[];
  permissoes: PermissaoModulo[];
};

export function useSessao() {
  return useQuery({
    queryKey: ["sessao"],
    queryFn: async (): Promise<Sessao | null> => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;

      // A chamada só é enviada quando aguardada; falhas não bloqueiam a sessão.
      const atualizacao = await supabase.rpc("atualizar_situacoes_automaticas");
      if (atualizacao.error) console.warn("Situações automáticas:", atualizacao.error.message);
      const [perfilQ, papeisQ, permissoesQ] = await Promise.all([
        supabase
          .from("profiles")
          .select("nome_completo, cargo, ativo")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("user_module_permissions").select("modulo,nivel,pode_excluir,pode_relatorio,pode_backup").eq("user_id", user.id),
      ]);
      if (perfilQ.error || papeisQ.error || permissoesQ.error) throw perfilQ.error ?? papeisQ.error ?? permissoesQ.error;
      const perfil = perfilQ.data;
      const papeis = papeisQ.data;

      return {
        userId: user.id,
        email: user.email ?? null,
        nome: perfil?.nome_completo ?? user.email?.split("@")[0] ?? "Usuário",
        cargo: perfil?.cargo ?? null,
        ativo: perfil?.ativo ?? false,
        papeis: (papeis ?? []).map((p) => p.role as Papel),
        permissoes: permissoesQ.data ?? [],
      };
    },
    staleTime: 60_000,
  });
}

export function temPapel(papeis: Papel[] | undefined, permitidos: Papel[]) {
  if (!papeis) return false;
  return papeis.some((p) => permitidos.includes(p));
}
