// Guarda o convite de instalação do Chrome/Edge (evento beforeinstallprompt) para o botão "Instalar aplicativo".
// O evento pode chegar antes de qualquer tela montar, por isso a escuta começa assim que este módulo carrega no navegador.

type ConviteInstalacao = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let convite: ConviteInstalacao | null = null;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    convite = e as ConviteInstalacao;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    convite = null;
    avisar();
  });
}

export function assinarInstalacao(f: () => void) {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

export const instalacaoDisponivel = () => convite !== null;

export async function instalarAplicativo() {
  const atual = convite;
  if (!atual) return false;
  await atual.prompt();
  const { outcome } = await atual.userChoice;
  convite = null; // o navegador só permite usar cada convite uma vez
  avisar();
  return outcome === "accepted";
}
