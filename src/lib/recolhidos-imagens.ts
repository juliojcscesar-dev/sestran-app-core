import { prepararImagem } from '@/lib/relatorio-imagens';

export const MAX_IMAGENS_RECOLHIDOS = 3;
const LIMITE_IMAGEM = 750000;

export function imagensRecolhido(valor: unknown): string[] {
  return Array.isArray(valor) ? valor.filter((v): v is string => typeof v === 'string' && v.length <= LIMITE_IMAGEM && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(v)).slice(0, MAX_IMAGENS_RECOLHIDOS) : [];
}

export async function prepararImagemRecolhido(arquivo: File): Promise<string> {
  const imagem = await prepararImagem(arquivo);
  if (imagem.src.length <= LIMITE_IMAGEM) return imagem.src;
  const bitmap = await createImageBitmap(await (await fetch(imagem.src)).blob());
  try {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * 0.7);
    canvas.height = Math.round(bitmap.height * 0.7);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível processar a imagem.');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const src = canvas.toDataURL('image/jpeg', 0.65);
    if (src.length > LIMITE_IMAGEM) throw new Error('A imagem é muito detalhada. Selecione uma imagem menor.');
    return src;
  } finally { bitmap.close(); }
}