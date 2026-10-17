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