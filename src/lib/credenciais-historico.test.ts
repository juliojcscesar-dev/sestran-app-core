import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { FILTROS_INICIAIS, filtrarHistorico, mesclarConsulta, statusValidade, type CredencialHistorica, type RegistroSistema } from "./credenciais-historico";

const base = (p: Partial<CredencialHistorica>): CredencialHistorica => ({
  id: 1, grupo: "IDOSO", numero: 1, nome: "A", nascimento: null, validade: null, validade_indeterminada: false,
  documento: null, telefone: null, cid: null, determinacao: null, situacao: null, observacoes: null, ...p,
});
const hoje = new Date(2026, 9, 26);

describe("consulta de credenciais antigas", () => {
  it("credencial que vence em até 90 dias aparece como 'vence em breve'", () => {
    assert.equal(statusValidade(base({ validade: "2027-01-24" }), hoje), "soon");
    assert.equal(statusValidade(base({ validade: "2027-01-25" }), hoje), "ok");
    assert.equal(statusValidade(base({ validade: "2026-10-25" }), hoje), "exp");
  });

  it("busca pelo número encontra a credencial exata, com ou sem zeros", () => {
    const lista = [base({ id: 1, numero: 167 }), base({ id: 2, numero: 1670 })];
    assert.deepEqual(filtrarHistorico(lista, { ...FILTROS_INICIAIS, busca: "0167" }, hoje).map((r) => r.id), [1]);
  });

  it("busca por CPF funciona com ou sem pontos e traço", () => {
    const lista = [base({ id: 1, numero: 8, documento: "046.653.099-49" })];
    assert.equal(filtrarHistorico(lista, { ...FILTROS_INICIAIS, busca: "04665309949" }, hoje).length, 1);
    assert.equal(filtrarHistorico(lista, { ...FILTROS_INICIAIS, busca: "046.653.099-49" }, hoje).length, 1);
  });

  it("filtro PcD mostra somente credenciais PcD", () => {
    const lista = [base({ id: 1, grupo: "IDOSO" }), base({ id: 2, grupo: "PCD" })];
    assert.deepEqual(filtrarHistorico(lista, { ...FILTROS_INICIAIS, grupo: "PCD" }, hoje).map((r) => r.id), [2]);
  });
});

const sist = (p: Partial<RegistroSistema>): RegistroSistema => ({
  id: "s1", tipo: "IDOSO", nome: "Novo", tipo_documento: "CPF", numero_documento: "04665309949", nascimento: null, telefone: null,
  observacoes: null, numero_registro: "5075", data_emissao: "2026-10-23", data_validade: "2031-10-23", criado_em: "2026-10-23T10:00:00Z", ...p,
});

describe("consulta ligada às credenciais emitidas no sistema", () => {
  it("credencial emitida no sistema com o mesmo nº substitui a da base, sem repetir", () => {
    const r = mesclarConsulta([base({ id: 9, numero: 5075, nome: "ANTIGO", cid: "X" })], [sist({ nome: "BERLINDA" })]);
    assert.equal(r.length, 1);
    assert.equal(r[0]!.nome, "BERLINDA");
    assert.equal(r[0]!.origem, "SISTEMA");
    assert.equal(r[0]!.validade, "2031-10-23");
    assert.equal(r[0]!.cid, "X");
  });

  it("o mesmo nº em Idoso e em PCD são credenciais diferentes", () => {
    const r = mesclarConsulta([base({ id: 9, grupo: "IDOSO", numero: 380 })], [sist({ tipo: "RENOVACAO_PCD", numero_registro: "380" })]);
    assert.equal(r.length, 2);
  });

  it("nova credencial sem registro na base entra na consulta e é encontrada pelo número", () => {
    const r = mesclarConsulta([], [sist({ numero_registro: "5078", nome: "DELMIRO" })]);
    assert.deepEqual(filtrarHistorico(r, { ...FILTROS_INICIAIS, busca: "5078" }, hoje).map((x) => x.nome), ["DELMIRO"]);
  });

  it("na renovação vale a emissão mais recente do mesmo nº", () => {
    const r = mesclarConsulta([], [
      sist({ id: "a", tipo: "PCD", numero_registro: "380", data_emissao: "2021-09-20" }),
      sist({ id: "b", tipo: "RENOVACAO_PCD", numero_registro: "380", data_emissao: "2026-10-20" }),
    ]);
    assert.deepEqual(r.map((x) => x.sistemaId), ["b"]);
  });
});
