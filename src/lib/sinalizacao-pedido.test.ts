import { describe, test as it } from "node:test";
import { strict as assert } from "node:assert";
import { fonteDe, htmlSinalizacao, type DadosSinalizacao } from "./sinalizacao-documento";

const base = (extra: Partial<DadosSinalizacao> = {}): DadosSinalizacao => ({
  pedido: "Ouvidoria - GEO", numero: "OS-0007", numero_pedido: null, data: "2026-11-12", status: "Aguardando",
  natureza: "Sinalização Horizontal", endereco: "Rua Pernambuco, 100", servico: "Pintura de faixa",
  funcionario: null, observacao: null, preenchido: null, chefe_imediato: null, cargo: null, imagens: [], ...extra,
});

describe("Nº do pedido (GEO / IPM) no documento da O.S. de Sinalização", () => {
  it("não aparece quando o campo fica em branco", () => {
    const html = htmlSinalizacao(base());
    assert.equal(html.includes("Nº DO PEDIDO"), false);
    assert.equal(html.includes("PEDIDO:"), true);
    assert.equal(html.includes("Nº DA O. S."), true);
  });

  it("aparece com o número informado", () => {
    const html = htmlSinalizacao(base({ numero_pedido: "GEO-2026/1234" }));
    assert.equal(html.includes("Nº DO PEDIDO"), true);
    assert.equal(html.includes("GEO-2026/1234"), true);
  });

  it("ignora espaços em branco", () => {
    assert.equal(htmlSinalizacao(base({ numero_pedido: "   " })).includes("Nº DO PEDIDO"), false);
  });
});

test("tamanho da letra do preenchimento fica entre 8 e 18 pt, padrão 11", () => {
  assert.equal(fonteDe(base()), 11);
  assert.equal(fonteDe(base({ fonte_tamanho: 30 })), 18);
  assert.equal(fonteDe(base({ fonte_tamanho: 14 })), 14);
  assert.ok(htmlSinalizacao(base({ fonte_tamanho: 14 })).includes(".v{font-size:14pt"));
});
