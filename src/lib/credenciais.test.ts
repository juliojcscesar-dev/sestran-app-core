import { describe, test as it } from "node:test";
import { strict as assert } from "node:assert";
import { camposCredencial, proximoNumeroRegistro, TAMANHO_DATA, TAMANHO_ROTULO } from "./credenciais";

describe("credenciais", () => {
  it("datas de emissão e validade saem completas em Arial 16 (4 pt acima do texto 12 do modelo)", () => {
    for (const tipo of ["IDOSO", "PCD", "RENOVACAO_IDOSO", "RENOVACAO_PCD", "TEMPORARIA_PCD"]) {
      const campos = camposCredencial({ tipo, nome: "Teste", numero_registro: "10", data_emissao: "2026-10-20", data_validade: "2031-10-20" });
      const emissao = campos.find((c) => c.texto === "20/10/2026");
      const validade = campos.find((c) => c.texto === "20/10/2031");
      assert.equal(emissao?.tamanho, 16);
      assert.equal(validade?.tamanho, 16);
      assert.equal(TAMANHO_DATA, TAMANHO_ROTULO + 4);
    }
  });

  it("número, ano e nome mantêm o tamanho 12 do modelo", () => {
    const campos = camposCredencial({ tipo: "PCD", nome: "Maria", numero_registro: "669", data_emissao: "2027-01-05", data_validade: "2032-01-05" });
    assert.equal(campos.find((c) => c.texto === "669")?.tamanho, 12);
    assert.equal(campos.find((c) => c.texto === "2027")?.tamanho, 12);
    assert.equal(campos.find((c) => c.texto === "MARIA")?.tamanho, 12);
  });

  it("sugere o próximo número após o maior já digitado", () => {
    assert.equal(proximoNumeroRegistro(["667", "668", null]), "669");
    assert.equal(proximoNumeroRegistro(["0099"]), "0100");
    assert.equal(proximoNumeroRegistro([null, ""]), "");
  });
});
