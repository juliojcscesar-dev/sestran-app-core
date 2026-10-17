import { describe, expect, test } from "bun:test";
import { formatarData } from "./sestran";

describe("datas de calendário das atividades", () => {
  test("preserva o dia da ação, inclusive concluídas e antigas", () => {
    expect(formatarData("2026-10-17")).toBe("17/10/2026");
    expect(formatarData("2026-10-16")).toBe("16/10/2026");
    expect(formatarData("2025-01-01")).toBe("01/01/2025");
  });

  test("não exibe datas ausentes ou inválidas", () => {
    expect(formatarData(null)).toBe("—");
    expect(formatarData("2026-02-30")).toBe("—");
    expect(formatarData("invalida")).toBe("—");
  });
});