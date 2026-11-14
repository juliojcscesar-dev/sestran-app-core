import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { consultar } from "../consulta";

export default defineTool({
  name: "listar_veiculos_abandonados",
  title: "Listar veículos abandonados",
  description: "Lista os veículos abandonados (Módulo 02) que o usuário pode ver, com placa, endereço e situação.",
  inputSchema: {
    de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Data inicial AAAA-MM-DD."),
    ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Data final AAAA-MM-DD."),
    status: z.string().max(60).optional().describe("Filtrar por situação exata."),
    limite: z.number().int().min(1).max(200).optional().describe("Máximo de registros (padrão 50)."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: (args, ctx) => consultar(ctx, { tabela: "veiculos_abandonados", colunas: "id, placa, marca, modelo, endereco, bairro, situacao, status, data_notificacao, prazo_recolhimento", data: "created_at", arquivo: "arquivado", ...args }),
});
