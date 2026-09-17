import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SeletorRegistro } from "@/components/os/SeletorRegistro";
import { MapaOS } from "@/components/os/MapaOS";
import { STATUS_OS, STATUS_OS_LABEL, type StatusOS } from "@/lib/os";
import {
  lerPercurso,
  PERCURSO_VAZIO,
  type InterdicaoMapa,
  type PercursoMapa,
} from "@/lib/mapa";
import {
  atualizarOrdem,
  criarAgente,
  criarLocal,
  criarOrdem,
  criarOrientador,
  criarSolicitante,
  criarTipoServico,
  listarAgentes,
  listarEventos,
  listarLocais,
  listarOrientadores,
  listarSolicitantes,
  listarTiposServico,
  normalizarNumeroOS,
  numeroOSDisponivel,
  proximoNumeroOS,
  type DadosOS,
  type OrdemCompleta,
} from "@/lib/os-api";


const esquema = z.object({
  data_emissao: z.string().min(10, "Informe a data de emissão."),
  data_servico: z.string().min(10, "Informe a data do serviço."),
  natureza: z.string().trim().min(3, "Informe a natureza da ordem de serviço."),
  local: z.string().trim().min(2, "Informe o local."),
  hora_inicio: z.string().optional(),
  hora_fim: z.string().optional(),
});

type Props = { modo: "nova" | "editar" | "duplicar"; inicial?: OrdemCompleta; id?: string };

type LinhaAgente = {
  agente_id: string | null;
  funcao: string;
  hora_chegada: string;
  observacao: string;
};
type LinhaOrientador = { orientador_id: string | null; observacao: string };

const hoje = () => new Date().toISOString().slice(0, 10);

export function FormularioOS({ modo, inicial, id }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const o = inicial?.ordem as (Record<string, unknown> & { status?: string }) | undefined;
  const duplicando = modo === "duplicar";

  const [dataEmissao, setDataEmissao] = useState(
    duplicando ? hoje() : ((o?.["data_emissao"] as string) ?? hoje()),
  );
  const [numero, setNumero] = useState(modo === "editar" ? ((o?.["numero"] as string) ?? "") : "");
  const [numeroPersonalizado, setNumeroPersonalizado] = useState(false);
  const [ipm, setIpm] = useState((o?.["ipm"] as string) ?? "");
  const [remetente, setRemetente] = useState((o?.["remetente"] as string) ?? "");
  const [destinatario, setDestinatario] = useState((o?.["destinatario"] as string) ?? "");
  const [natureza, setNatureza] = useState((o?.["natureza"] as string) ?? "");
  const [solicitanteId, setSolicitanteId] = useState<string | null>(
    (o?.["solicitante_id"] as string) ?? null,
  );
  const [local, setLocal] = useState((o?.["local"] as string) ?? "");
  const [dataServico, setDataServico] = useState((o?.["data_servico"] as string) ?? hoje());
  const [horaInicio, setHoraInicio] = useState(((o?.["hora_inicio"] as string) ?? "").slice(0, 5));
  const [horaFim, setHoraFim] = useState(((o?.["hora_fim"] as string) ?? "").slice(0, 5));
  const [eventoId, setEventoId] = useState<string | null>((o?.["evento_id"] as string) ?? null);
  const [trajeto, setTrajeto] = useState((o?.["trajeto"] as string) ?? "");
  const [observacoes, setObservacoes] = useState((o?.["observacoes"] as string) ?? "");
  const [status, setStatus] = useState<StatusOS>(
    duplicando ? "AGENDADA" : ((o?.["status"] as StatusOS) ?? "AGENDADA"),
  );
  const [servicos, setServicos] = useState<string[]>(
    (inicial?.servicos ?? []).map((s) => s.tipo_servico_id),
  );
  const [agentes, setAgentes] = useState<LinhaAgente[]>(
    (inicial?.agentes ?? []).map((a) => ({
      agente_id: a.agente_id,
      funcao: a.funcao ?? "",
      hora_chegada: (a.hora_chegada ?? "").slice(0, 5),
      observacao: a.observacao ?? "",
    })),
  );
  const [orientadores, setOrientadores] = useState<LinhaOrientador[]>(
    (inicial?.orientadores ?? []).map((r) => ({
      orientador_id: r.orientador_id,
      observacao: r.observacao ?? "",
    })),
  );
  const [percurso, setPercurso] = useState<PercursoMapa>(
    inicial ? lerPercurso((inicial.ordem as Record<string, unknown>)["percurso"]) : { ...PERCURSO_VAZIO },
  );
  const [interdicoes, setInterdicoes] = useState<InterdicaoMapa[]>(
    (inicial?.interdicoes ?? []).map((i) => ({
      rua: i.rua,
      trecho_inicial: i.trecho_inicial,
      trecho_final: i.trecho_final,
      observacao: i.observacao,
      geometria: i.geometria,
    })),
  );
  const [erros, setErros] = useState<Record<string, string>>({});


  const solicitantesQ = useQuery({ queryKey: ["solicitantes"], queryFn: listarSolicitantes });
  const agentesQ = useQuery({ queryKey: ["agentes"], queryFn: listarAgentes });
  const orientadoresQ = useQuery({ queryKey: ["orientadores"], queryFn: listarOrientadores });
  const eventosQ = useQuery({ queryKey: ["eventos"], queryFn: listarEventos });
  const locaisQ = useQuery({ queryKey: ["locais"], queryFn: listarLocais });
  const tiposQ = useQuery({ queryKey: ["tipos-servico"], queryFn: listarTiposServico });
  const anoEmissao = Number(dataEmissao.slice(0, 4));
  const sugestaoNumeroQ = useQuery({
    queryKey: ["proximo-numero-os", anoEmissao],
    queryFn: () => proximoNumeroOS(anoEmissao),
    enabled: modo !== "editar" && Number.isInteger(anoEmissao),
  });

  useEffect(() => {
    if (modo !== "editar" && !numeroPersonalizado && sugestaoNumeroQ.data) {
      setNumero(sugestaoNumeroQ.data);
    }
  }, [modo, numeroPersonalizado, sugestaoNumeroQ.data]);

  const opcoesLocal = useMemo(
    () => (locaisQ.data ?? []).map((l) => ({ id: l.nome, rotulo: l.nome, detalhe: l.endereco ?? undefined })),
    [locaisQ.data],
  );

  const temInterdicao = useMemo(
    () =>
      (tiposQ.data ?? []).some(
        (t) => servicos.includes(t.id) && t.nome.toLowerCase().includes("interdi"),
      ),
    [tiposQ.data, servicos],
  );

  const [novoTipo, setNovoTipo] = useState("");


  const salvar = useMutation({
    mutationFn: async () => {
      const dados: DadosOS = {
        numero: modo === "editar" ? undefined : numero,
        data_emissao: dataEmissao,
        ipm: ipm.trim() || null,
        remetente: remetente.trim() || null,
        destinatario: destinatario.trim() || null,
        natureza: natureza.trim(),
        solicitante_id: solicitanteId,
        local: local.trim(),
        data_servico: dataServico,
        hora_inicio: horaInicio || null,
        hora_fim: horaFim || null,
        evento_id: eventoId,
        trajeto: trajeto.trim() || null,
        observacoes: observacoes.trim() || null,
        status,
        percurso,
        interdicoes,
        servicos: servicos.map((tipo_servico_id) => ({ tipo_servico_id, detalhe: null })),

        agentes: agentes
          .filter((a) => a.agente_id)
          .map((a) => ({
            agente_id: a.agente_id as string,
            funcao: a.funcao.trim() || null,
            hora_chegada: a.hora_chegada || null,
            observacao: a.observacao.trim() || null,
          })),
        orientadores: orientadores
          .filter((r) => r.orientador_id)
          .map((r) => ({
            orientador_id: r.orientador_id as string,
            observacao: r.observacao.trim() || null,
          })),
      };
      if (modo === "editar" && id) {
        await atualizarOrdem(id, dados);
        return { id, numero: (o?.["numero"] as string) ?? "" };
      }
      return criarOrdem(dados);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      queryClient.invalidateQueries({ queryKey: ["ordem-servico"] });
      toast.success(
        modo === "editar"
          ? "Ordem de serviço atualizada."
          : `Ordem de serviço ${res.numero} criada.`,
      );
      navigate({ to: "/ordens-servico/visualizar/$id", params: { id: res.id } });
    },
    onError: (erro: unknown) => {
      const detalhe = erro && typeof erro === "object" ? (erro as Record<string, unknown>) : {};
      const textoErro = [detalhe["message"], detalhe["details"], detalhe["code"]]
        .filter((item): item is string => typeof item === "string")
        .join(" ");
      const duplicado = textoErro.includes("23505") || textoErro.toLowerCase().includes("já está em uso");
      const msg = duplicado
        ? "Este número de O.S. já está em uso neste ano. Escolha outro número."
        : erro instanceof Error
          ? erro.message
          : "Erro ao salvar.";
      if (duplicado) setErros((atuais) => ({ ...atuais, numero: msg }));
      toast.error(`Não foi possível salvar: ${msg}`);
    },
  });

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const resultado = esquema.safeParse({
      data_emissao: dataEmissao,
      data_servico: dataServico,
      natureza,
      local,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
    });
    const novosErros: Record<string, string> = {};
    if (!resultado.success) {
      for (const item of resultado.error.issues) {
        const campo = String(item.path[0]);
        novosErros[campo] = item.message;
      }
    }
    if (horaInicio && horaFim && horaFim < horaInicio) {
      novosErros["hora_fim"] = "O término deve ser depois do início.";
    }
    if (!servicos.length) novosErros["servicos"] = "Selecione ao menos um serviço.";
    if (modo !== "editar") {
      try {
        const validado = normalizarNumeroOS(numero, anoEmissao);
        setNumero(validado.numero);
      } catch (erro) {
        novosErros["numero"] = erro instanceof Error ? erro.message : "Número inválido.";
      }
    }
    setErros(novosErros);
    if (Object.keys(novosErros).length) {
      toast.error("Revise os campos destacados.");
      return;
    }
    if (modo !== "editar") {
      try {
        const resultadoNumero = await numeroOSDisponivel(numero, anoEmissao);
        setNumero(resultadoNumero.numero);
        if (!resultadoNumero.disponivel) {
          const mensagem = "Este número de O.S. já está em uso neste ano. Escolha outro número.";
          setErros((atuais) => ({ ...atuais, numero: mensagem }));
          toast.error(mensagem);
          return;
        }
      } catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : "Não foi possível validar o número.";
        setErros((atuais) => ({ ...atuais, numero: mensagem }));
        toast.error(mensagem);
        return;
      }
    }
    salvar.mutate();
  }

  const erroTexto = (campo: string) =>
    erros[campo] ? <p className="mt-1 text-xs text-destructive">{erros[campo]}</p> : null;

  return (
    <form onSubmit={enviar} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identificação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="numero_os">Ordem de Serviço Nº</Label>
            <Input
              id="numero_os"
              inputMode="numeric"
              value={numero}
              onChange={(e) => {
                setNumero(e.target.value);
                setNumeroPersonalizado(true);
                setErros((atuais) => ({ ...atuais, numero: "" }));
              }}
              onBlur={() => {
                if (modo === "editar") return;
                try {
                  setNumero(normalizarNumeroOS(numero, anoEmissao).numero);
                } catch {
                  /* A mensagem é exibida no envio. */
                }
              }}
              readOnly={modo === "editar"}
              disabled={modo === "editar"}
              placeholder={sugestaoNumeroQ.isLoading ? "Consultando próximo número…" : "Ex.: 160 ou 160/2026"}
            />
            {erroTexto("numero")}
          </div>
          <div>
            <Label htmlFor="data_emissao">Data de emissão *</Label>
            <Input
              id="data_emissao"
              type="date"
              value={dataEmissao}
              onChange={(e) => setDataEmissao(e.target.value)}
            />
            {erroTexto("data_emissao")}
          </div>
          <div>
            <Label htmlFor="ipm">IPM</Label>
            <Input id="ipm" value={ipm} onChange={(e) => setIpm(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="de">De</Label>
            <Input id="de" value={remetente} onChange={(e) => setRemetente(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="para">Para</Label>
            <Input
              id="para"
              value={destinatario}
              onChange={(e) => setDestinatario(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="status">Situação</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusOS)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_OS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do serviço</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="natureza">Natureza *</Label>
            <Input
              id="natureza"
              value={natureza}
              onChange={(e) => setNatureza(e.target.value)}
              placeholder="Ex.: Apoio de trânsito em desfile cívico"
            />
            {erroTexto("natureza")}
          </div>
          <div>
            <Label>Solicitante</Label>
            <SeletorRegistro
              opcoes={(solicitantesQ.data ?? []).map((s) => ({ id: s.id, rotulo: s.nome }))}
              valor={solicitanteId}
              onChange={setSolicitanteId}
              placeholder="Pesquisar solicitante"
              podeCriar
              onCriar={async (nome) => {
                const novo = await criarSolicitante(nome);
                await queryClient.invalidateQueries({ queryKey: ["solicitantes"] });
                return { id: novo.id, rotulo: novo.nome };
              }}
            />
          </div>
          <div>
            <Label>Evento</Label>
            <SeletorRegistro
              opcoes={(eventosQ.data ?? []).map((e) => ({
                id: e.id,
                rotulo: e.titulo,
                detalhe: e.local ?? undefined,
              }))}
              valor={eventoId}
              onChange={setEventoId}
              placeholder="Pesquisar evento"
            />
          </div>
          <div>
            <Label>Local *</Label>
            <SeletorRegistro
              opcoes={opcoesLocal}
              valor={local || null}
              onChange={(v) => setLocal(v ?? "")}
              placeholder="Pesquisar local"
              podeCriar
              onCriar={async (nome) => {
                const novo = await criarLocal(nome);
                await queryClient.invalidateQueries({ queryKey: ["locais"] });
                return { id: novo.nome, rotulo: novo.nome };
              }}
            />
            {erroTexto("local")}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="data_servico">Data *</Label>
              <Input
                id="data_servico"
                type="date"
                value={dataServico}
                onChange={(e) => setDataServico(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="hora_inicio">Início</Label>
              <Input
                id="hora_inicio"
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="hora_fim">Término</Label>
              <Input
                id="hora_fim"
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
              />
            </div>
            <div className="col-span-3">
              {erroTexto("data_servico")}
              {erroTexto("hora_fim")}
            </div>
          </div>
          <div className="md:col-span-2">
            <Label>Serviços *</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(tiposQ.data ?? []).map((tipo) => (
                <label
                  key={tipo.id}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <Checkbox
                    checked={servicos.includes(tipo.id)}
                    onCheckedChange={(marcado) =>
                      setServicos((atual) =>
                        marcado ? [...atual, tipo.id] : atual.filter((s) => s !== tipo.id),
                      )
                    }
                  />
                  {tipo.nome}
                </label>
              ))}
            </div>
            {erroTexto("servicos")}
            <div className="mt-3 flex gap-2">
              <Input
                value={novoTipo}
                onChange={(e) => setNovoTipo(e.target.value)}
                placeholder="Novo tipo de serviço"
                className="max-w-xs"
              />
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (!novoTipo.trim()) return;
                  try {
                    const criado = await criarTipoServico(novoTipo.trim());
                    setNovoTipo("");
                    await queryClient.invalidateQueries({ queryKey: ["tipos-servico"] });
                    setServicos((a) => [...a, criado.id]);
                    toast.success("Tipo de serviço cadastrado.");
                  } catch {
                    toast.error("Somente gestores podem cadastrar novos tipos de serviço.");
                  }
                }}
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Adicionar tipo
              </Button>
            </div>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="trajeto">Trajeto / Percurso</Label>
            <Textarea
              id="trajeto"
              rows={3}
              value={trajeto}
              onChange={(e) => setTrajeto(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Agentes de trânsito</CardTitle>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setAgentes((a) => [
                ...a,
                { agente_id: null, funcao: "", hora_chegada: "", observacao: "" },
              ])
            }
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Adicionar agente
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {agentes.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum agente designado.</p>
          )}
          {agentes.map((linha, indice) => (
            <div key={indice} className="grid gap-2 md:grid-cols-[2fr_1fr_auto_2fr_auto]">
              <SeletorRegistro
                opcoes={(agentesQ.data ?? []).map((a) => ({
                  id: a.id,
                  rotulo: a.nome,
                  detalhe: a.matricula ?? undefined,
                }))}
                valor={linha.agente_id}
                onChange={(v) =>
                  setAgentes((atual) =>
                    atual.map((l, i) => (i === indice ? { ...l, agente_id: v } : l)),
                  )
                }
                placeholder="Agente"
                podeCriar
                onCriar={async (nome) => {
                  const novo = await criarAgente(nome);
                  await queryClient.invalidateQueries({ queryKey: ["agentes"] });
                  return { id: novo.id, rotulo: novo.nome };
                }}
              />
              <Input
                placeholder="Função"
                value={linha.funcao}
                onChange={(e) =>
                  setAgentes((atual) =>
                    atual.map((l, i) => (i === indice ? { ...l, funcao: e.target.value } : l)),
                  )
                }
              />
              <Input
                type="time"
                aria-label="Horário de chegada"
                value={linha.hora_chegada}
                onChange={(e) =>
                  setAgentes((atual) =>
                    atual.map((l, i) => (i === indice ? { ...l, hora_chegada: e.target.value } : l)),
                  )
                }
              />
              <Input
                placeholder="Observação"
                value={linha.observacao}
                onChange={(e) =>
                  setAgentes((atual) =>
                    atual.map((l, i) => (i === indice ? { ...l, observacao: e.target.value } : l)),
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remover agente"
                onClick={() => setAgentes((atual) => atual.filter((_, i) => i !== indice))}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Orientadores (opcional)</CardTitle>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setOrientadores((a) => [...a, { orientador_id: null, observacao: "" }])
            }
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Adicionar orientador
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {orientadores.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum orientador designado.</p>
          )}
          {orientadores.map((linha, indice) => (
            <div key={indice} className="grid gap-2 md:grid-cols-[2fr_3fr_auto]">
              <SeletorRegistro
                opcoes={(orientadoresQ.data ?? []).map((r) => ({
                  id: r.id,
                  rotulo: r.nome,
                  detalhe: r.matricula ?? undefined,
                }))}
                valor={linha.orientador_id}
                onChange={(v) =>
                  setOrientadores((atual) =>
                    atual.map((l, i) => (i === indice ? { ...l, orientador_id: v } : l)),
                  )
                }
                placeholder="Orientador"
                podeCriar
                onCriar={async (nome) => {
                  const novo = await criarOrientador(nome);
                  await queryClient.invalidateQueries({ queryKey: ["orientadores"] });
                  return { id: novo.id, rotulo: novo.nome };
                }}
              />
              <Input
                placeholder="Observação"
                value={linha.observacao}
                onChange={(e) =>
                  setOrientadores((atual) =>
                    atual.map((l, i) => (i === indice ? { ...l, observacao: e.target.value } : l)),
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remover orientador"
                onClick={() => setOrientadores((atual) => atual.filter((_, i) => i !== indice))}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mapa e percurso</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Marque no mapa o ponto inicial, as ruas do trajeto e o ponto final. O percurso é salvo
            junto com a ordem de serviço.
          </p>
          <MapaOS
            percurso={percurso}
            onPercursoChange={setPercurso}
            interdicoes={interdicoes}
            onInterdicoesChange={setInterdicoes}
            permitirInterdicoes={temInterdicao}
          />
          {!temInterdicao && (
            <p className="mt-2 text-xs text-muted-foreground">
              Selecione um serviço de interdição para registrar ruas interditadas.
            </p>
          )}
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Informações complementares da ordem de serviço"
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={salvar.isPending}>
          {salvar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          {modo === "editar" ? "Salvar alterações" : "Salvar ordem de serviço"}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/ordens-servico" })}>
          Cancelar
        </Button>
      </div>
      {duplicando && (
        <p className="text-xs text-muted-foreground">
          Esta é uma cópia editável. O novo número será gerado somente ao salvar.
        </p>
      )}
    </form>
  );
}
