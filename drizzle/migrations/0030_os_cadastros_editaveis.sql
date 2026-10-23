ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.proteger_exclusao_cadastro_os()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.ativo IS DISTINCT FROM NEW.ativo
     AND NOT (public.acesso_modulo(auth.uid(),'OS','EXCLUIR')
       OR (TG_TABLE_NAME = 'orientadores' AND public.acesso_modulo(auth.uid(),'EDUCACAO','EXCLUIR'))) THEN
    RAISE EXCEPTION 'O administrador precisa autorizar a exclusão de nomes neste módulo.' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS proteger_exclusao_cadastro_os ON public.solicitantes;
CREATE TRIGGER proteger_exclusao_cadastro_os BEFORE UPDATE ON public.solicitantes FOR EACH ROW EXECUTE FUNCTION public.proteger_exclusao_cadastro_os();
DROP TRIGGER IF EXISTS proteger_exclusao_cadastro_os ON public.eventos;
CREATE TRIGGER proteger_exclusao_cadastro_os BEFORE UPDATE ON public.eventos FOR EACH ROW EXECUTE FUNCTION public.proteger_exclusao_cadastro_os();
DROP TRIGGER IF EXISTS proteger_exclusao_cadastro_os ON public.locais;
CREATE TRIGGER proteger_exclusao_cadastro_os BEFORE UPDATE ON public.locais FOR EACH ROW EXECUTE FUNCTION public.proteger_exclusao_cadastro_os();
DROP TRIGGER IF EXISTS proteger_exclusao_cadastro_os ON public.agentes;
CREATE TRIGGER proteger_exclusao_cadastro_os BEFORE UPDATE ON public.agentes FOR EACH ROW EXECUTE FUNCTION public.proteger_exclusao_cadastro_os();
DROP TRIGGER IF EXISTS proteger_exclusao_cadastro_os ON public.orientadores;
CREATE TRIGGER proteger_exclusao_cadastro_os BEFORE UPDATE ON public.orientadores FOR EACH ROW EXECUTE FUNCTION public.proteger_exclusao_cadastro_os();