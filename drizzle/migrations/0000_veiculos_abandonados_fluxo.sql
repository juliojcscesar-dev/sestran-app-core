ALTER TABLE public.veiculos_abandonados
  ADD COLUMN IF NOT EXISTS chassi text,
  ADD COLUMN IF NOT EXISTS tipo_denuncia text NOT NULL DEFAULT 'INFORMAL',
  ADD COLUMN IF NOT EXISTS numero_denuncia text,
  ADD COLUMN IF NOT EXISTS data_verificacao date,
  ADD COLUMN IF NOT EXISTS data_notificacao date,
  ADD COLUMN IF NOT EXISTS data_recolhimento date,
  ADD COLUMN IF NOT EXISTS data_retirada date,
  ADD COLUMN IF NOT EXISTS prazo_recolhimento date,
  ADD COLUMN IF NOT EXISTS arquivado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS arquivado_em timestamptz,
  ADD COLUMN IF NOT EXISTS arquivado_por uuid;

ALTER TABLE public.veiculos_abandonados ALTER COLUMN status SET DEFAULT 'DENUNCIADO';

UPDATE public.veiculos_abandonados SET status = 'DENUNCIADO' WHERE status = 'REGISTRADO';

CREATE OR REPLACE FUNCTION public.veiculo_regras_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.data_notificacao IS NOT NULL THEN
    NEW.prazo_recolhimento := NEW.data_notificacao + 15;
  ELSE
    NEW.prazo_recolhimento := NULL;
  END IF;

  IF NEW.data_retirada IS NOT NULL THEN
    NEW.status := 'RETIRADO';
  ELSIF NEW.data_recolhimento IS NOT NULL THEN
    NEW.status := 'RECOLHIDO';
  ELSIF NEW.data_notificacao IS NOT NULL THEN
    IF NEW.prazo_recolhimento <= CURRENT_DATE THEN
      NEW.status := 'RECOLHER';
    ELSE
      NEW.status := 'NOTIFICADO';
    END IF;
  ELSE
    NEW.status := 'DENUNCIADO';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_veiculos_status ON public.veiculos_abandonados;
CREATE TRIGGER trg_veiculos_status
BEFORE INSERT OR UPDATE ON public.veiculos_abandonados
FOR EACH ROW EXECUTE FUNCTION public.veiculo_regras_status();

CREATE TABLE IF NOT EXISTS public.veiculo_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id uuid NOT NULL REFERENCES public.veiculos_abandonados(id) ON DELETE CASCADE,
  caminho text NOT NULL,
  url text NOT NULL,
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.veiculo_fotos TO authenticated;
GRANT ALL ON public.veiculo_fotos TO service_role;
ALTER TABLE public.veiculo_fotos ENABLE ROW LEVEL SECURITY;
CREATE POLICY vfotos_select ON public.veiculo_fotos FOR SELECT TO authenticated USING (true);
CREATE POLICY vfotos_write ON public.veiculo_fotos FOR ALL TO authenticated
  USING (public.pode_operar(auth.uid())) WITH CHECK (public.pode_operar(auth.uid()));

CREATE TABLE IF NOT EXISTS public.veiculo_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id uuid NOT NULL REFERENCES public.veiculos_abandonados(id) ON DELETE CASCADE,
  user_id uuid,
  acao text NOT NULL,
  alteracoes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.veiculo_historico TO authenticated;
GRANT ALL ON public.veiculo_historico TO service_role;
ALTER TABLE public.veiculo_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY vhist_select ON public.veiculo_historico FOR SELECT TO authenticated USING (true);
CREATE POLICY vhist_insert ON public.veiculo_historico FOR INSERT TO authenticated
  WITH CHECK (public.pode_operar(auth.uid()));

CREATE OR REPLACE FUNCTION public.registrar_historico_veiculo()
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
    INSERT INTO public.veiculo_historico (veiculo_id, user_id, acao, alteracoes)
    VALUES (NEW.id, auth.uid(), 'CRIACAO', jsonb_build_object('status', NEW.status));
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

  IF OLD.arquivado IS DISTINCT FROM NEW.arquivado THEN
    v_acao := CASE WHEN NEW.arquivado THEN 'ARQUIVAMENTO' ELSE 'RESTAURACAO' END;
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    v_acao := 'MUDANCA_STATUS';
  ELSE
    v_acao := 'EDICAO';
  END IF;

  INSERT INTO public.veiculo_historico (veiculo_id, user_id, acao, alteracoes)
  VALUES (NEW.id, auth.uid(), v_acao, v_alt);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_veiculos_hist ON public.veiculos_abandonados;
CREATE TRIGGER trg_veiculos_hist
AFTER INSERT OR UPDATE ON public.veiculos_abandonados
FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_veiculo();

CREATE INDEX IF NOT EXISTS idx_veiculos_status ON public.veiculos_abandonados(status);
CREATE INDEX IF NOT EXISTS idx_veiculos_bairro ON public.veiculos_abandonados(bairro);
