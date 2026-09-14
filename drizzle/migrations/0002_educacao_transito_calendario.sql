ALTER TABLE public.acoes_educativas
  ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'EVENTO_ESCOLA',
  ADD COLUMN IF NOT EXISTS tema_id uuid,
  ADD COLUMN IF NOT EXISTS local text,
  ADD COLUMN IF NOT EXISTS horario_inicio time without time zone,
  ADD COLUMN IF NOT EXISTS horario_fim time without time zone,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS arquivada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS arquivada_em timestamp with time zone,
  ADD COLUMN IF NOT EXISTS arquivada_por uuid,
  ADD COLUMN IF NOT EXISTS criado_por uuid;

UPDATE public.acoes_educativas
SET status = 'AGENDADA'
WHERE status = 'PLANEJADA';

CREATE TABLE public.temas_educativos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.temas_educativos TO authenticated;
GRANT ALL ON public.temas_educativos TO service_role;
ALTER TABLE public.temas_educativos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Temas educativos visiveis a autenticados"
  ON public.temas_educativos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Operadores gerenciam temas educativos"
  ON public.temas_educativos FOR ALL TO authenticated
  USING (public.pode_operar(auth.uid()))
  WITH CHECK (public.pode_operar(auth.uid()));

ALTER TABLE public.acoes_educativas
  ADD CONSTRAINT acoes_educativas_tema_id_fkey
  FOREIGN KEY (tema_id) REFERENCES public.temas_educativos(id);

CREATE TABLE public.acao_educativa_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acao_educativa_id uuid NOT NULL REFERENCES public.acoes_educativas(id) ON DELETE CASCADE,
  user_id uuid,
  acao text NOT NULL,
  alteracoes jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.acao_educativa_historico TO authenticated;
GRANT ALL ON public.acao_educativa_historico TO service_role;
ALTER TABLE public.acao_educativa_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Historico educativo visivel a autenticados"
  ON public.acao_educativa_historico FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sistema registra historico educativo"
  ON public.acao_educativa_historico FOR INSERT TO authenticated
  WITH CHECK (public.pode_operar(auth.uid()));

CREATE OR REPLACE FUNCTION public.validar_acao_educativa()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('AGENDADA', 'EM_ANDAMENTO', 'REALIZADA', 'CANCELADA') THEN
    RAISE EXCEPTION 'Situação inválida para ação educativa';
  END IF;
  IF NEW.categoria NOT IN ('EVENTO_ESCOLA', 'BLITZ_EDUCATIVA', 'PALESTRA', 'OUTRA') THEN
    RAISE EXCEPTION 'Categoria inválida para ação educativa';
  END IF;
  IF NEW.horario_inicio IS NOT NULL AND NEW.horario_fim IS NOT NULL AND NEW.horario_fim <= NEW.horario_inicio THEN
    RAISE EXCEPTION 'O horário final deve ser posterior ao horário inicial';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.registrar_historico_acao_educativa()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_acao text;
  v_alt jsonb := '{}'::jsonb;
  v_campo text;
  v_old jsonb;
  v_new jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.acao_educativa_historico (acao_educativa_id, user_id, acao, alteracoes)
    VALUES (NEW.id, auth.uid(), 'CRIACAO', jsonb_build_object('titulo', NEW.titulo, 'status', NEW.status));
    RETURN NEW;
  END IF;

  v_old := to_jsonb(OLD);
  v_new := to_jsonb(NEW);
  FOR v_campo IN SELECT jsonb_object_keys(v_new) LOOP
    IF v_campo NOT IN ('updated_at') AND (v_old -> v_campo) IS DISTINCT FROM (v_new -> v_campo) THEN
      v_alt := v_alt || jsonb_build_object(v_campo, jsonb_build_object('de', v_old -> v_campo, 'para', v_new -> v_campo));
    END IF;
  END LOOP;

  IF v_alt = '{}'::jsonb THEN RETURN NEW; END IF;
  IF OLD.arquivada IS DISTINCT FROM NEW.arquivada THEN
    v_acao := CASE WHEN NEW.arquivada THEN 'ARQUIVAMENTO' ELSE 'RESTAURACAO' END;
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    v_acao := 'MUDANCA_STATUS';
  ELSE
    v_acao := 'EDICAO';
  END IF;

  INSERT INTO public.acao_educativa_historico (acao_educativa_id, user_id, acao, alteracoes)
  VALUES (NEW.id, auth.uid(), v_acao, v_alt);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_acoes_validar ON public.acoes_educativas;
CREATE TRIGGER trg_acoes_validar
BEFORE INSERT OR UPDATE ON public.acoes_educativas
FOR EACH ROW EXECUTE FUNCTION public.validar_acao_educativa();

DROP TRIGGER IF EXISTS trg_acoes_historico ON public.acoes_educativas;
CREATE TRIGGER trg_acoes_historico
AFTER INSERT OR UPDATE ON public.acoes_educativas
FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_acao_educativa();

DROP TRIGGER IF EXISTS trg_temas_educativos_upd ON public.temas_educativos;
CREATE TRIGGER trg_temas_educativos_upd
BEFORE UPDATE ON public.temas_educativos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_acoes_educativas_data_status
  ON public.acoes_educativas (data_acao, status)
  WHERE arquivada = false;
CREATE INDEX IF NOT EXISTS idx_acoes_educativas_escola
  ON public.acoes_educativas (escola_id);
CREATE INDEX IF NOT EXISTS idx_acoes_educativas_orientador
  ON public.acoes_educativas (orientador_id);
CREATE INDEX IF NOT EXISTS idx_acao_educativa_historico_acao
  ON public.acao_educativa_historico (acao_educativa_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.acoes_educativas TO authenticated;
GRANT ALL ON public.acoes_educativas TO service_role;