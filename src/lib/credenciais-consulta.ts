import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CredencialHistorica } from "@/lib/credenciais-historico";

/** Credenciais emitidas no sistema (mesma chave usada pela página de Credenciais, que a atualiza ao salvar). */
export const credenciaisSistemaQuery = queryOptions({
  queryKey: ["credenciais"],
  queryFn: async () => {
    const { data, error } = await supabase.from("credenciais_vagas").select("*").order("atualizado_em", { ascending: false });
    if (error) throw error;
    return data;
  },
});

/** Base das credenciais já existentes antes do sistema (somente leitura, não muda). */
export const credenciaisHistoricoQuery = queryOptions({
  queryKey: ["credenciais-historico"],
  staleTime: Infinity,
  queryFn: async (): Promise<CredencialHistorica[]> => {
    const todos: CredencialHistorica[] = [];
    for (let inicio = 0; ; inicio += 1000) {
      const { data, error } = await supabase.from("credenciais_historico").select("*").order("id").range(inicio, inicio + 999);
      if (error) throw error;
      todos.push(...data);
      if (data.length < 1000) return todos;
    }
  },
});
