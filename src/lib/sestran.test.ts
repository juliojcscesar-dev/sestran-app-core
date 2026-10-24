import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { formatarData } from "./sestran";

describe("datas de calendário das atividades", () => {
  test("preserva o dia da ação, inclusive concluídas e antigas", () => {
    assert.equal(formatarData("2026-10-17"), "17/10/2026");
    assert.equal(formatarData("2026-10-16"), "16/10/2026");
    assert.equal(formatarData("2025-01-01"), "01/01/2025");
  });

  test("não exibe datas ausentes ou inválidas", () => {
    assert.equal(formatarData(null), "—");
    assert.equal(formatarData("2026-02-30"), "—");
    assert.equal(formatarData("invalida"), "—");
  });
});
import { etapaDe, registrarSituacoes, STATUS_VEICULO_CLASSE } from "./veiculos";
describe("situação Retorno no cronograma", () => {
  it("veículo com situação Retorno vai para a coluna Retorno em azul", () => {
    registrarSituacoes([{ id: "abc", nome: "Rotorno", ativo: true, ordem: 9 }]);
    const v = { status: "X", situacao: "abc", data_verificacao: null, data_notificacao: null, data_recolhimento: null, data_retirada: null, prazo_recolhimento: null };
    expect(etapaDe(v)).toBe("AGUARDANDO_VERIFICACAO");
    expect(STATUS_VEICULO_CLASSE.abc).toContain("blue");
  });
});
