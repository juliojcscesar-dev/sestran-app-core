import { auth, defineMcp } from "@lovable.dev/mcp-js";
import os from "./tools/listar-ordens-servico";
import veiculos from "./tools/listar-veiculos-abandonados";
import educacao from "./tools/listar-acoes-educativas";
import sinalizacao from "./tools/listar-sinalizacao";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "paranava-tr-nsito-pro",
  title: "Paranavaí Trânsito Pro",
  version: "0.1.0",
  instructions:
    "Consulta somente-leitura do SESTRAN (Paranavaí/PR): ordens de serviço, veículos abandonados, educação no trânsito e sinalização viária. Cada usuário vê apenas os módulos liberados para ele.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [os, veiculos, educacao, sinalizacao],
});
