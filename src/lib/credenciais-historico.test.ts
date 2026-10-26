import { describe, expect, it } from "vitest";
import { FILTROS_INICIAIS, filtrarHistorico, statusValidade, type CredencialHistorica } from "./credenciais-historico";

const base = (p: Partial<CredencialHistorica>): CredencialHistorica => ({
  id: 1, grupo: "IDOSO", numero: 1, nome: "A", nascimento: null, validade: null, validade_indeterminada: false,
  documento: null, telefone: null, cid: null, determinacao: null, situacao: null, observacoes: null, ...p,
});
const hoje = new Date(2026, 9, 26);

describe("consulta de credenciais antigas", () => {
  it("credencial que vence em até 90 dias aparece como 'vence em breve'", () => {
    expect(statusValidade(base({ validade: "2027-01-24" }), hoje)).toBe("soon");
    expect(statusValidade(base({ validade: "2027-01-25" }), hoje)).toBe("ok");
    expect(statusValidade(base({ validade: "2026-10-25" }), hoje)).toBe("exp");
  });

  it("busca pelo número encontra a credencial exata, com ou sem zeros", () => {
    const lista = [base({ id: 1, numero: 167 }), base({ id: 2, numero: 1670 })];
    expect(filtrarHistorico(lista, { ...FILTROS_INICIAIS, busca: "0167" }, hoje).map((r) => r.id)).toEqual([1]);
  });

  it("busca por CPF funciona com ou sem pontos e traço", () => {
    const lista = [base({ id: 1, numero: 8, documento: "046.653.099-49" })];
    expect(filtrarHistorico(lista, { ...FILTROS_INICIAIS, busca: "04665309949" }, hoje)).toHaveLength(1);
    expect(filtrarHistorico(lista, { ...FILTROS_INICIAIS, busca: "046.653.099-49" }, hoje)).toHaveLength(1);
  });

  it("filtro PcD mostra somente credenciais PcD", () => {
    const lista = [base({ id: 1, grupo: "IDOSO" }), base({ id: 2, grupo: "PCD" })];
    expect(filtrarHistorico(lista, { ...FILTROS_INICIAIS, grupo: "PCD" }, hoje).map((r) => r.id)).toEqual([2]);
  });
});
