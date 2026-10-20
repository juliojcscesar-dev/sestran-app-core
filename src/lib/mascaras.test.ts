import { describe, test as it } from "node:test";
import { strict as assert } from "node:assert";
import { exibirDocumento, exibirTelefone, mascararCnpj, mascararCpf, mascararDocumento, mascararTelefone } from "./mascaras";

describe("máscaras de telefone e documento", () => {
  it("telefone fixo com DDD entre parênteses e traço", () => {
    assert.equal(mascararTelefone("4434527766"), "(44) 3452-7766");
  });
  it("celular com 11 dígitos", () => {
    assert.equal(mascararTelefone("44999999999"), "(44) 99999-9999");
  });
  it("telefone parcial durante a digitação", () => {
    assert.equal(mascararTelefone("443"), "(44) 3");
    assert.equal(mascararTelefone("4434527"), "(44) 3452-7");
  });
  it("CPF com pontos e traço", () => {
    assert.equal(mascararCpf("00000999009"), "000.009.990-09");
    assert.equal(mascararCpf("0000"), "000.0");
  });
  it("CNPJ com pontos, barra e traço", () => {
    assert.equal(mascararCnpj("12345678000195"), "12.345.678/0001-95");
  });
  it("RG e CNH ficam como digitados", () => {
    assert.equal(mascararDocumento("RG", "12.345.678-9"), "12.345.678-9");
  });
  it("valores antigos são exibidos formatados", () => {
    assert.equal(exibirTelefone("4434527766"), "(44) 3452-7766");
    assert.equal(exibirTelefone("ramal 22"), "ramal 22");
    assert.equal(exibirDocumento("CPF", "00000999009"), "000.009.990-09");
  });
});
