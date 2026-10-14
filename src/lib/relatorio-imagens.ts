export type ImagemRelatorio = { id: string; src: string; largura: number; angulo: number; legenda: string };

export async function prepararImagem(arquivo: File): Promise<ImagemRelatorio> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type)) throw new Error('Selecione uma imagem JPG, PNG ou WebP.');
  if (arquivo.size > 10 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 10 MB.');
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * escala); canvas.height = Math.round(bitmap.height * escala);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível processar a imagem.');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  return { id: crypto.randomUUID(), src: canvas.toDataURL('image/jpeg', 0.8), largura: 100, angulo: 0, legenda: '' };
}

export async function girarImagem(imagem: ImagemRelatorio): Promise<ImagemRelatorio> {
  const bitmap = await createImageBitmap(await (await fetch(imagem.src)).blob());
  const canvas = document.createElement('canvas'); canvas.width = bitmap.height; canvas.height = bitmap.width;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível girar a imagem.');
  ctx.translate(canvas.width / 2, canvas.height / 2); ctx.rotate(Math.PI / 2);
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2); bitmap.close();
  return { ...imagem, src: canvas.toDataURL('image/jpeg', 0.9), angulo: (imagem.angulo + 90) % 360 };
}

export const larguraImagem: Record<number, string> = { 25: 'w-1/4', 50: 'w-1/2', 75: 'w-3/4', 100: 'w-full' };