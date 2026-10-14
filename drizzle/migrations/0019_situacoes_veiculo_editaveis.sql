CREATE TABLE public.situacoes_veiculo (id text PRIMARY KEY DEFAULT gen_random_uuid()::text, nome text NOT NULL CHECK (char_length(btrim(nome)) BETWEEN 2 AND 120), ativo boolean NOT NULL DEFAULT true, ordem integer NOT NULL DEFAULT 100);
GRANT SELECT, INSERT, UPDATE ON public.situacoes_veiculo TO authenticated;
GRANT ALL ON public.situacoes_veiculo TO service_role;
ALTER TABLE public.situacoes_veiculo ENABLE ROW LEVEL SECURITY;
CREATE POLICY situacoes_veiculo_select ON public.situacoes_veiculo FOR SELECT TO authenticated USING (public.acesso_modulo(auth.uid(),'VEICULOS','CONSULTA'));
CREATE POLICY situacoes_veiculo_insert ON public.situacoes_veiculo FOR INSERT TO authenticated WITH CHECK (public.acesso_modulo(auth.uid(),'VEICULOS','OPERADOR'));
CREATE POLICY situacoes_veiculo_update ON public.situacoes_veiculo FOR UPDATE TO authenticated USING (public.acesso_modulo(auth.uid(),'VEICULOS','OPERADOR')) WITH CHECK (public.acesso_modulo(auth.uid(),'VEICULOS','OPERADOR'));
INSERT INTO public.situacoes_veiculo(id,nome,ordem) VALUES ('RETIRADO','Retirado',1),('NOTIFICADO','Notificado',2),('RECOLHIDO','Recolhido',3),('NAO_ABANDONADO','Não está abandonado',4),('TERRENO','Dentro de terreno',5),('OUTROS','Outros',6);
CREATE OR REPLACE FUNCTION public.proteger_situacao_veiculo() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
  IF NEW.id <> OLD.id THEN RAISE EXCEPTION 'O código da situação não pode ser alterado'; END IF;
  IF OLD.ativo AND NOT NEW.ativo AND NOT public.acesso_modulo(auth.uid(),'VEICULOS','EXCLUIR') THEN RAISE EXCEPTION 'Exclusão não autorizada pelo administrador'; END IF;
  RETURN NEW; END $$;
CREATE TRIGGER proteger_situacao_veiculo BEFORE UPDATE ON public.situacoes_veiculo FOR EACH ROW EXECUTE FUNCTION public.proteger_situacao_veiculo();
ALTER TABLE public.veiculos_abandonados DROP CONSTRAINT IF EXISTS veiculos_situacao_check;
ALTER TABLE public.veiculos_abandonados DROP CONSTRAINT IF EXISTS veiculos_abandonados_status_check;
CREATE OR REPLACE FUNCTION public.validar_situacao_veiculo() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
  IF NEW.situacao IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.situacoes_veiculo s WHERE s.id=NEW.situacao AND (s.ativo OR (TG_OP='UPDATE' AND NEW.situacao IS NOT DISTINCT FROM OLD.situacao))) THEN RAISE EXCEPTION 'Selecione uma situação ativa para o veículo'; END IF;
  RETURN NEW; END $$;
CREATE TRIGGER validar_situacao_veiculo BEFORE INSERT OR UPDATE ON public.veiculos_abandonados FOR EACH ROW EXECUTE FUNCTION public.validar_situacao_veiculo();
COMMENT ON TABLE public.situacoes_veiculo IS 'Catálogo editável de situações de veículos; códigos padrão mantêm regras; exclusão lógica preserva registros antigos.';