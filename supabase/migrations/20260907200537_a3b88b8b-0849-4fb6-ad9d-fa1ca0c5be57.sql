-- ============ Tipos de serviço ============
CREATE TABLE public.tipos_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipos_servico TO authenticated;
GRANT ALL ON public.tipos_servico TO service_role;
ALTER TABLE public.tipos_servico ENABLE ROW LEVEL SECURITY;
CREATE POLICY tipos_servico_select ON public.tipos_servico FOR SELECT TO authenticated USING (true);
CREATE POLICY tipos_servico_write ON public.tipos_servico FOR ALL TO authenticated USING (public.is_gestor(auth.uid())) WITH CHECK (public.is_gestor(auth.uid()));
CREATE TRIGGER trg_tipos_servico_upd BEFORE UPDATE ON public.tipos_servico FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.tipos_servico (nome, ordem) VALUES
  ('Interdição', 1),
  ('Interdição de ruas', 2),
  ('Apoio', 3),
  ('Orientação de trânsito', 4),
  ('Patrulhamento', 5),
  ('Sinalização', 6),
  ('Outro', 7);

-- ============ Locais ============
CREATE TABLE public.locais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  endereco text,
  bairro text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locais TO authenticated;
GRANT ALL ON public.locais TO service_role;
ALTER TABLE public.locais ENABLE ROW LEVEL SECURITY;
CREATE POLICY locais_select ON public.locais FOR SELECT TO authenticated USING (true);
CREATE POLICY locais_insert ON public.locais FOR INSERT TO authenticated WITH CHECK (public.pode_operar(auth.uid()));
CREATE POLICY locais_update ON public.locais FOR UPDATE TO authenticated USING (public.is_gestor(auth.uid())) WITH CHECK (public.is_gestor(auth.uid()));
CREATE POLICY locais_delete ON public.locais FOR DELETE TO authenticated USING (public.is_gestor(auth.uid()));
CREATE TRIGGER trg_locais_upd BEFORE UPDATE ON public.locais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Ordens de serviço: novos campos ============
ALTER TABLE public.ordens_servico
  ALTER COLUMN titulo DROP NOT NULL,
  ALTER COLUMN numero DROP DEFAULT,
  ADD COLUMN ano integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::int,
  ADD COLUMN sequencial integer,
  ADD COLUMN data_emissao date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN ipm text,
  ADD COLUMN remetente text,
  ADD COLUMN destinatario text,
  ADD COLUMN natureza text,
  ADD COLUMN trajeto text,
  ADD COLUMN arquivada boolean NOT NULL DEFAULT false,
  ADD COLUMN arquivada_em timestamptz,
  ADD COLUMN arquivada_por uuid;

UPDATE public.ordens_servico SET status = 'AGENDADA' WHERE status NOT IN ('AGENDADA','EM_ANDAMENTO','EXECUTADA','CANCELADA');
ALTER TABLE public.ordens_servico DROP CONSTRAINT IF EXISTS ordens_servico_status_check;
ALTER TABLE public.ordens_servico DROP CONSTRAINT IF EXISTS ordens_servico_tipo_check;
ALTER TABLE public.ordens_servico ALTER COLUMN status SET DEFAULT 'AGENDADA';
ALTER TABLE public.ordens_servico ADD CONSTRAINT ordens_servico_status_check
  CHECK (status IN ('AGENDADA','EM_ANDAMENTO','EXECUTADA','CANCELADA'));

CREATE UNIQUE INDEX ordens_servico_numero_ano_uidx ON public.ordens_servico (ano, sequencial);

-- ============ Numeração 001/2026 ============
CREATE TABLE public.os_contador (
  ano integer PRIMARY KEY,
  ultimo integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.os_contador TO authenticated;
GRANT ALL ON public.os_contador TO service_role;
ALTER TABLE public.os_contador ENABLE ROW LEVEL SECURITY;
CREATE POLICY os_contador_select ON public.os_contador FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.gerar_numero_os()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ano integer;
  v_seq integer;
BEGIN
  v_ano := COALESCE(NEW.ano, EXTRACT(YEAR FROM COALESCE(NEW.data_emissao, CURRENT_DATE))::int);
  INSERT INTO public.os_contador (ano, ultimo) VALUES (v_ano, 1)
  ON CONFLICT (ano) DO UPDATE SET ultimo = public.os_contador.ultimo + 1
  RETURNING ultimo INTO v_seq;
  NEW.ano := v_ano;
  NEW.sequencial := v_seq;
  NEW.numero := lpad(v_seq::text, 3, '0') || '/' || v_ano::text;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.gerar_numero_os() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_os_numero BEFORE INSERT ON public.ordens_servico
FOR EACH ROW EXECUTE FUNCTION public.gerar_numero_os();

-- ============ Serviços da O.S. ============
CREATE TABLE public.ordem_servico_servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_servico_id uuid NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  tipo_servico_id uuid NOT NULL REFERENCES public.tipos_servico(id) ON DELETE RESTRICT,
  detalhe text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ordem_servico_id, tipo_servico_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordem_servico_servicos TO authenticated;
GRANT ALL ON public.ordem_servico_servicos TO service_role;
ALTER TABLE public.ordem_servico_servicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY oss_select ON public.ordem_servico_servicos FOR SELECT TO authenticated USING (true);
CREATE POLICY oss_write ON public.ordem_servico_servicos FOR ALL TO authenticated USING (public.pode_operar(auth.uid())) WITH CHECK (public.pode_operar(auth.uid()));

-- ============ Orientadores da O.S. ============
CREATE TABLE public.ordem_servico_orientadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_servico_id uuid NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  orientador_id uuid NOT NULL REFERENCES public.orientadores(id) ON DELETE RESTRICT,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ordem_servico_id, orientador_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordem_servico_orientadores TO authenticated;
GRANT ALL ON public.ordem_servico_orientadores TO service_role;
ALTER TABLE public.ordem_servico_orientadores ENABLE ROW LEVEL SECURITY;
CREATE POLICY oso_select ON public.ordem_servico_orientadores FOR SELECT TO authenticated USING (true);
CREATE POLICY oso_write ON public.ordem_servico_orientadores FOR ALL TO authenticated USING (public.pode_operar(auth.uid())) WITH CHECK (public.pode_operar(auth.uid()));

-- ============ Agentes: chegada e observação ============
ALTER TABLE public.ordem_servico_agentes
  ADD COLUMN hora_chegada time,
  ADD COLUMN observacao text;
ALTER TABLE public.ordem_servico_agentes
  ADD CONSTRAINT osa_unico UNIQUE (ordem_servico_id, agente_id);

-- ============ Histórico da O.S. ============
CREATE TABLE public.ordem_servico_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_servico_id uuid NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  user_id uuid,
  acao text NOT NULL,
  alteracoes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX osh_os_idx ON public.ordem_servico_historico (ordem_servico_id, created_at DESC);
GRANT SELECT, INSERT ON public.ordem_servico_historico TO authenticated;
GRANT ALL ON public.ordem_servico_historico TO service_role;
ALTER TABLE public.ordem_servico_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY osh_select ON public.ordem_servico_historico FOR SELECT TO authenticated USING (true);
CREATE POLICY osh_insert ON public.ordem_servico_historico FOR INSERT TO authenticated WITH CHECK (public.pode_operar(auth.uid()));

CREATE OR REPLACE FUNCTION public.registrar_historico_os()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_acao text;
  v_alt jsonb := '{}'::jsonb;
  v_campo text;
  v_old jsonb;
  v_new jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.ordem_servico_historico (ordem_servico_id, user_id, acao, alteracoes)
    VALUES (NEW.id, auth.uid(), 'CRIACAO', jsonb_build_object('numero', NEW.numero, 'status', NEW.status));
    RETURN NEW;
  END IF;

  v_old := to_jsonb(OLD);
  v_new := to_jsonb(NEW);
  FOR v_campo IN SELECT jsonb_object_keys(v_new) LOOP
    IF v_campo NOT IN ('updated_at') AND (v_old -> v_campo) IS DISTINCT FROM (v_new -> v_campo) THEN
      v_alt := v_alt || jsonb_build_object(v_campo, jsonb_build_object('de', v_old -> v_campo, 'para', v_new -> v_campo));
    END IF;
  END LOOP;

  IF v_alt = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  IF OLD.arquivada IS DISTINCT FROM NEW.arquivada THEN
    v_acao := CASE WHEN NEW.arquivada THEN 'ARQUIVAMENTO' ELSE 'RESTAURACAO' END;
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    v_acao := 'MUDANCA_STATUS';
  ELSE
    v_acao := 'EDICAO';
  END IF;

  INSERT INTO public.ordem_servico_historico (ordem_servico_id, user_id, acao, alteracoes)
  VALUES (NEW.id, auth.uid(), v_acao, v_alt);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.registrar_historico_os() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_os_historico AFTER INSERT OR UPDATE ON public.ordens_servico
FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_os();

-- ============ Arquivamento restrito a gestores; sem exclusão ============
DROP POLICY IF EXISTS os_delete ON public.ordens_servico;
DROP POLICY IF EXISTS os_update ON public.ordens_servico;
CREATE POLICY os_update ON public.ordens_servico FOR UPDATE TO authenticated
USING (public.pode_operar(auth.uid()) AND (NOT arquivada OR public.is_gestor(auth.uid())))
WITH CHECK (
  public.pode_operar(auth.uid())
  AND (arquivada = false OR public.is_gestor(auth.uid()))
);