import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Papel } from "@/lib/sestran";

export type Sessao = {
  userId: string;
  email: string | null;
  nome: string;
  cargo: string | null;
  ativo: boolean;
  papeis: Papel[];
};

export function useSessao() {
  return useQuery({
    queryKey: ["sessao"],
    queryFn: async (): Promise<Sessao | null> => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;

      const [{ data: perfil }, { data: papeis }] = await Promise.all([
        supabase
          .from("profiles")
          .select("nome_completo, cargo, ativo")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);

      return {
        userId: user.id,
        email: user.email ?? null,
        nome: perfil?.nome_completo ?? user.email?.split("@")[0] ?? "Usuário",
        cargo: perfil?.cargo ?? null,
        ativo: perfil?.ativo ?? true,
        papeis: (papeis ?? []).map((p) => p.role as Papel),
      };
    },
    staleTime: 60_000,
  });
}

export function temPapel(papeis: Papel[] | undefined, permitidos: Papel[]) {
  if (!papeis) return false;
  return papeis.some((p) => permitidos.includes(p));
}
