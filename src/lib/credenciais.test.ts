import { describe, test as it } from "node:test";
import { strict as assert } from "node:assert";
import { camposCredencial, proximoNumeroRegistro, TAMANHO_DIA_MES } from "./credenciais";

describe("credenciais", () => {
  it("dia, mês e ano da emissão e validade têm o mesmo tamanho de fonte", () => {
    for (const tipo of ["IDOSO", "PCD"]) {
      const campos = camposCredencial({ tipo, nome: "Teste", numero_registro: "10", data_emissao: "2026-10-20", data_validade: "2031-10-20" });
      const datas = campos.filter((c) => ["20", "10", "2026", "2031"].includes(c.texto) && c.y > 230);
      assert.equal(datas.length, 6);
      assert.ok(datas.every((c) => c.tamanho === TAMANHO_DIA_MES));
    }
  });

  it("sugere o próximo número após o maior já digitado", () => {
    assert.equal(proximoNumeroRegistro(["667", "668", null]), "669");
    assert.equal(proximoNumeroRegistro(["0099"]), "0100");
    assert.equal(proximoNumeroRegistro([null, ""]), "");
  });
});
