ALTER TABLE public.user_module_permissions ADD COLUMN IF NOT EXISTS pode_backup boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.definir_backup_modulo(_user_id uuid, _modulo text, _pode_backup boolean)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
 IF NOT public.has_role(auth.uid(), 'ADMINISTRADOR') OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id=auth.uid() AND ativo) THEN RAISE EXCEPTION 'Somente administradores podem liberar backup.' USING ERRCODE='42501'; END IF;
 IF public.has_role(_user_id, 'ADMINISTRADOR') THEN RAISE EXCEPTION 'Administradores possuem acesso total.'; END IF;
 UPDATE public.user_module_permissions SET pode_backup = _pode_backup AND nivel<>'SEM_ACESSO', atualizado_por=auth.uid(), updated_at=now() WHERE user_id=_user_id AND modulo=_modulo;
 IF NOT FOUND THEN RAISE EXCEPTION 'Libere primeiro o acesso ao módulo.'; END IF;
 INSERT INTO public.historico_atividades(user_id,entidade,entidade_id,acao,detalhes) VALUES(auth.uid(),'ACESSO_USUARIO',_user_id,'LIBERACAO',jsonb_build_object('modulo',_modulo,'pode_backup',_pode_backup));
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.definir_backup_modulo(uuid,text,boolean) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.definir_backup_modulo(uuid,text,boolean) TO authenticated;