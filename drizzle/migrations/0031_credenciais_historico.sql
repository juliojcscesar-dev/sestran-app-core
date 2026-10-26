CREATE TABLE public.credenciais_historico (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  grupo text NOT NULL CHECK (grupo IN ('IDOSO','PCD')),
  numero integer NOT NULL,
  nome text,
  nascimento date,
  validade date,
  validade_indeterminada boolean NOT NULL DEFAULT false,
  documento text,
  telefone text,
  cid text,
  determinacao text,
  situacao text,
  observacoes text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credenciais_historico TO authenticated;
GRANT ALL ON public.credenciais_historico TO service_role;
ALTER TABLE public.credenciais_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Consulta histórico de credenciais" ON public.credenciais_historico
  FOR SELECT TO authenticated
  USING (public.acesso_modulo(auth.uid(), 'CREDENCIAIS', 'CONSULTA'));
CREATE INDEX credenciais_historico_grupo_numero_idx ON public.credenciais_historico (grupo, numero);
COMMENT ON TABLE public.credenciais_historico IS 'Base histórica somente leitura das credenciais Idoso/PcD já emitidas antes do sistema.';