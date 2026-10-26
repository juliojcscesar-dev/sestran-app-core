import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { FILTROS_INICIAIS, filtrarHistorico, statusValidade, type CredencialHistorica } from "./credenciais-historico";

const base = (p: Partial<CredencialHistorica>): CredencialHistorica => ({
  id: 1, grupo: "IDOSO", numero: 1, nome: "A", nascimento: null, validade: null, validade_indeterminada: false,
  documento: null, telefone: null, cid: null, determinacao: null, situacao: null, observacoes: null, ...p,
});
const hoje = new Date(2026, 9, 26);

describe("consulta de credenciais antigas", () => {
  it("credencial que vence em até 90 dias aparece como 'vence em breve'", () => {
    assert.equal(statusValidade(base({ validade: "2027-01-24" }), hoje), "soon");
    assert.equal(statusValidade(base({ validade: "2027-01-25" }), hoje), "ok");
    assert.equal(statusValidade(base({ validade: "2026-10-25" }), hoje), "exp");
  });

  it("busca pelo número encontra a credencial exata, com ou sem zeros", () => {
    const lista = [base({ id: 1, numero: 167 }), base({ id: 2, numero: 1670 })];
    assert.deepEqual(filtrarHistorico(lista, { ...FILTROS_INICIAIS, busca: "0167" }, hoje).map((r) => r.id), [1]);
  });

  it("busca por CPF funciona com ou sem pontos e traço", () => {
    const lista = [base({ id: 1, numero: 8, documento: "046.653.099-49" })];
    assert.equal(filtrarHistorico(lista, { ...FILTROS_INICIAIS, busca: "04665309949" }, hoje).length, 1);
    assert.equal(filtrarHistorico(lista, { ...FILTROS_INICIAIS, busca: "046.653.099-49" }, hoje).length, 1);
  });

  it("filtro PcD mostra somente credenciais PcD", () => {
    const lista = [base({ id: 1, grupo: "IDOSO" }), base({ id: 2, grupo: "PCD" })];
    assert.deepEqual(filtrarHistorico(lista, { ...FILTROS_INICIAIS, grupo: "PCD" }, hoje).map((r) => r.id), [2]);
  });
});
