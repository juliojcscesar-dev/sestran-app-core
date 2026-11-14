import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { consultar } from "../consulta";

export default defineTool({
  name: "listar_ordens_servico",
  title: "Listar ordens de serviço",
  description: "Lista as Ordens de Serviço (Módulo 01) que o usuário pode ver, das mais recentes para as mais antigas.",
  inputSchema: {
    de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Data inicial AAAA-MM-DD."),
    ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Data final AAAA-MM-DD."),
    status: z.string().max(60).optional().describe("Filtrar por situação exata."),
    limite: z.number().int().min(1).max(200).optional().describe("Máximo de registros (padrão 50)."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: (args, ctx) => consultar(ctx, { tabela: "ordens_servico", colunas: "id, numero, data_servico, hora_inicio, hora_fim, local, natureza, status, ipm, responsavel", data: "data_servico", arquivo: "arquivada", ...args }),
});
