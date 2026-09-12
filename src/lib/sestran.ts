export type Papel = "ADMINISTRADOR" | "GESTOR" | "OPERADOR" | "CONSULTA";

export const PAPEL_LABEL: Record<Papel, string> = {
  ADMINISTRADOR: "Administrador",
  GESTOR: "Gestor",
  OPERADOR: "Operador",
  CONSULTA: "Consulta",
};

export type ModuloNav = {
  titulo: string;
  href: string;
  icone: string;
  disponivel: boolean;
  papeis?: Papel[];
};

export const MODULOS: ModuloNav[] = [
  { titulo: "Painel", href: "/painel", icone: "LayoutDashboard", disponivel: true },
  { titulo: "Ordens de Serviço", href: "/ordens-servico", icone: "ClipboardList", disponivel: true },
  { titulo: "Eventos", href: "/eventos", icone: "CalendarDays", disponivel: false },
  { titulo: "Agentes de Trânsito", href: "/agentes", icone: "ShieldCheck", disponivel: false },
  { titulo: "Orientadores", href: "/orientadores", icone: "Users", disponivel: false },
  { titulo: "Solicitantes", href: "/solicitantes", icone: "Building2", disponivel: false },
  { titulo: "Escolas", href: "/escolas", icone: "School", disponivel: false },
  { titulo: "Veículos Abandonados", href: "/veiculos-abandonados", icone: "Car", disponivel: false },
  { titulo: "Educação no Trânsito", href: "/educacao-transito", icone: "GraduationCap", disponivel: false },
  {
    titulo: "Histórico",
    href: "/historico",
    icone: "History",
    disponivel: false,
    papeis: ["ADMINISTRADOR", "GESTOR"],
  },
  {
    titulo: "Usuários e Acessos",
    href: "/usuarios",
    icone: "UserCog",
    disponivel: false,
    papeis: ["ADMINISTRADOR"],
  },
];

export function formatarData(valor: string | null | undefined) {
  if (!valor) return "—";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatarDataHora(valor: string | null | undefined) {
  if (!valor) return "—";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
