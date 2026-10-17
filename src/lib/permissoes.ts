export const MODULOS_ACESSO = [
  { id: "OS", numero: "01", titulo: "Ordem de Serviço", href: "/ordens-servico" },
  { id: "VEICULOS", numero: "02", titulo: "Veículos Abandonados", href: "/veiculos-abandonados" },
  { id: "EDUCACAO", numero: "03", titulo: "Educação no Trânsito", href: "/educacao-transito" },
  { id: "CREDENCIAIS", numero: "04", titulo: "Credenciais de Vagas", href: "/credenciais" },
] as const;
export type ModuloAcesso = typeof MODULOS_ACESSO[number]["id"];
export type NivelAcesso = "SEM_ACESSO" | "CONSULTA" | "OPERADOR";
export type PermissaoModulo = { modulo: string; nivel: string; pode_excluir: boolean; pode_relatorio?: boolean };
type SessaoAcesso = { ativo: boolean; papeis: string[]; permissoes: PermissaoModulo[] } | null | undefined;
export function administrador(sessao: SessaoAcesso) {
  return Boolean(sessao?.ativo && sessao.papeis.includes("ADMINISTRADOR"));
}
export function temAcesso(sessao: SessaoAcesso, modulo: ModuloAcesso, acao: "CONSULTA" | "OPERADOR" | "EXCLUIR" | "RELATORIO" = "CONSULTA") {
  if (!sessao?.ativo) return false;
  if (administrador(sessao)) return true;
  const p = sessao.permissoes.find(p => p.modulo === modulo);
  if (!p || p.nivel === "SEM_ACESSO") return false;
  if (acao === "RELATORIO") return Boolean(p.pode_relatorio);
  if (acao === "CONSULTA") return p.nivel === "CONSULTA" || p.nivel === "OPERADOR";
  return p.nivel === "OPERADOR" && (acao !== "EXCLUIR" || p.pode_excluir);
}
export function moduloDoCaminho(pathname: string): ModuloAcesso | undefined {
  if (pathname.startsWith("/ordens-servico") || pathname.startsWith("/sinalizacao-viaria")) return "OS";
  if (pathname.startsWith("/veiculos-abandonados") || pathname.startsWith("/veiculos-recolhidos") || pathname.startsWith("/documento-veiculo")) return "VEICULOS";
  if (pathname.startsWith("/educacao-transito") || pathname.startsWith("/agenda-educativa")) return "EDUCACAO";
  if (pathname.startsWith("/credenciais")) return "CREDENCIAIS";
  return undefined;
}