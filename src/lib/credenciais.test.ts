import { describe, expect, it } from "vitest";
import { camposCredencial, proximoNumeroRegistro, TAMANHO_DIA_MES } from "./credenciais";

describe("credenciais", () => {
  it("dia, mês e ano da emissão e validade têm o mesmo tamanho de fonte", () => {
    for (const tipo of ["IDOSO", "PCD"]) {
      const campos = camposCredencial({ tipo, nome: "Teste", numero_registro: "10", data_emissao: "2026-10-20", data_validade: "2031-10-20" });
      const datas = campos.filter((c) => ["20", "10", "2026", "2031"].includes(c.texto) && c.y > 230);
      expect(datas).toHaveLength(6);
      expect(datas.every((c) => c.tamanho === TAMANHO_DIA_MES)).toBe(true);
    }
  });

  it("sugere o próximo número após o maior já digitado", () => {
    expect(proximoNumeroRegistro(["667", "668", null])).toBe("669");
    expect(proximoNumeroRegistro(["0099"])).toBe("0100");
    expect(proximoNumeroRegistro([null, ""])).toBe("");
  });
});
