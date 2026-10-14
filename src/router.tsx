import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { installChunkRecovery } from "./lib/chunk-recovery";

export const getRouter = () => {
  installChunkRecovery();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // As informações são buscadas ao abrir a página; voltar para a aba não dispara nova busca.
        refetchOnWindowFocus: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
