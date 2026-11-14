import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { consultar } from "../consulta";

export default defineTool({
  name: "listar_acoes_educativas",
  title: "Listar ações educativas",
  description: "Lista as ações de Educação no Trânsito (Módulo 03) que o usuário pode ver.",
  inputSchema: {
    de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Data inicial AAAA-MM-DD."),
    ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Data final AAAA-MM-DD."),
    status: z.string().max(60).optional().describe("Filtrar por situação exata."),
    limite: z.number().int().min(1).max(200).optional().describe("Máximo de registros (padrão 50)."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: (args, ctx) => consultar(ctx, { tabela: "acoes_educativas", colunas: "id, titulo, categoria, data_acao, horario_inicio, horario_fim, local, bairro, status", data: "data_acao", arquivo: "arquivada", ...args }),
});
