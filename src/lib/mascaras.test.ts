import { describe, expect, it } from "vitest";
import { exibirDocumento, exibirTelefone, mascararCnpj, mascararCpf, mascararDocumento, mascararTelefone } from "./mascaras";

describe("máscaras de telefone e documento", () => {
  it("telefone fixo com DDD entre parênteses e traço", () => {
    expect(mascararTelefone("4434527766")).toBe("(44) 3452-7766");
  });
  it("celular com 11 dígitos", () => {
    expect(mascararTelefone("44999999999")).toBe("(44) 99999-9999");
  });
  it("telefone parcial durante a digitação", () => {
    expect(mascararTelefone("443")).toBe("(44) 3");
    expect(mascararTelefone("4434527")).toBe("(44) 3452-7");
  });
  it("CPF com pontos e traço", () => {
    expect(mascararCpf("00000999009")).toBe("000.009.990-09");
    expect(mascararCpf("0000")).toBe("000.0");
  });
  it("CNPJ com pontos, barra e traço", () => {
    expect(mascararCnpj("12345678000195")).toBe("12.345.678/0001-95");
  });
  it("RG e CNH ficam como digitados", () => {
    expect(mascararDocumento("RG", "12.345.678-9")).toBe("12.345.678-9");
  });
  it("valores antigos são exibidos formatados", () => {
    expect(exibirTelefone("4434527766")).toBe("(44) 3452-7766");
    expect(exibirTelefone("ramal 22")).toBe("ramal 22");
    expect(exibirDocumento("CPF", "00000999009")).toBe("000.009.990-09");
  });
});
