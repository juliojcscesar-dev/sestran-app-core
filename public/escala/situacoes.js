export const SITUACOES = ['Em Atividade', 'Férias', 'Licença'];

export function situacaoAgente(agente) {
  return SITUACOES.includes(agente?.situacao) ? agente.situacao : 'Em Atividade';
}

export function definirSituacao(agentes, id, situacao) {
  if (!SITUACOES.includes(situacao)) throw new Error('Situação inválida.');
  if (!agentes.some(agente => agente.id === id)) throw new Error('Selecione um agente.');
  return agentes.map(agente => agente.id === id ? { ...agente, situacao } : agente);
}