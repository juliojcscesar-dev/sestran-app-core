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
  { titulo: "Painel 2", href: "/painel-2", icone: "LayoutGrid", disponivel: true, papeis: ["ADMINISTRADOR"] },
  { titulo: "Escala dos Agentes", href: "/escala-agentes", icone: "CalendarClock", disponivel: true, papeis: ["ADMINISTRADOR"] },
  { titulo: "Ordens de Serviço", href: "/ordens-servico", icone: "ClipboardList", disponivel: true },
  { titulo: "Sinalização Viária - O.S.", href: "/sinalizacao-viaria", icone: "TrafficCone", disponivel: true },
  { titulo: "Veículos Abandonados", href: "/veiculos-abandonados", icone: "Car", disponivel: true },
  { titulo: "Veículos Recolhidos", href: "/veiculos-recolhidos", icone: "ClipboardCheck", disponivel: true },
  { titulo: "Educação no Trânsito", href: "/educacao-transito", icone: "GraduationCap", disponivel: true },
  { titulo: "Credenciais de Vagas", href: "/credenciais", icone: "Accessibility", disponivel: true },
  { titulo: "Consulta de Credenciais", href: "/credenciais-consulta", icone: "SearchCheck", disponivel: true },
  { titulo: "Painel de Controle — Alvarás", href: "/transporte-estatistica", icone: "Bus", disponivel: true },
  { titulo: "Termo de Recebimento", href: "/transporte-estatistica-termo", icone: "FileCheck", disponivel: true },
  {
    titulo: "Usuários e Acessos",
    href: "/usuarios",
    icone: "UserCog",
    disponivel: true,
    papeis: ["ADMINISTRADOR"],
  },
];

export function formatarData(valor: string | null | undefined) {
  if (!valor) return "—";
  // Datas de calendário não representam meia-noite UTC: preserve o dia cadastrado.
  const calendario = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (calendario) {
    const [, ano, mes, dia] = calendario;
    const dataLocal = new Date(Number(ano), Number(mes) - 1, Number(dia));
    if (dataLocal.getFullYear() !== Number(ano) || dataLocal.getMonth() !== Number(mes) - 1 || dataLocal.getDate() !== Number(dia)) return "—";
    return `${dia}/${mes}/${ano}`;
  }
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
