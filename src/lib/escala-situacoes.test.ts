import { describe, expect, it } from 'vitest';
// @ts-expect-error The standalone schedule shares this browser-native JavaScript module.
import { definirSituacao, situacaoAgente } from '../../public/escala/situacoes.js';

describe('Situação dos agentes', () => {
  const agentes = [{ id: 'a', n: 'Agente A', g: 'A', s: '06:00', e: '18:00' }, { id: 'b', n: 'Agente B', situacao: 'Licença' }];
  it('considera os agentes antigos Em Atividade', () => {
    expect(situacaoAgente(agentes[0])).toBe('Em Atividade');
  });
  it.each(['Em Atividade', 'Férias', 'Licença'])('salva %s apenas no agente escolhido e preserva a escala', situacao => {
    const resultado = definirSituacao(agentes, 'a', situacao);
    expect(resultado[0]).toEqual({ ...agentes[0], situacao });
    expect(resultado[1]).toEqual(agentes[1]);
    expect(agentes[0]).not.toHaveProperty('situacao');
    expect(situacaoAgente(JSON.parse(JSON.stringify(resultado))[0])).toBe(situacao);
  });
  it('rejeita situações desconhecidas', () => {
    expect(() => definirSituacao(agentes, 'a', 'Outro')).toThrow('Situação inválida.');
  });
  it('rejeita agentes inexistentes', () => {
    expect(() => definirSituacao(agentes, 'inexistente', 'Férias')).toThrow('Selecione um agente.');
  });
});