ALTER TABLE public.user_module_permissions ADD COLUMN IF NOT EXISTS pode_relatorio boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.definir_acesso_modulo(_user_id uuid, _modulo text, _nivel text, _pode_excluir boolean, _pode_relatorio boolean)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
 IF NOT public.has_role(auth.uid(), 'ADMINISTRADOR') OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id=auth.uid() AND ativo) THEN RAISE EXCEPTION 'Somente administradores podem liberar acessos.' USING ERRCODE='42501'; END IF;
 IF public.has_role(_user_id, 'ADMINISTRADOR') THEN RAISE EXCEPTION 'Administradores possuem acesso total.'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id=_user_id) THEN RAISE EXCEPTION 'Usuário não encontrado.'; END IF;
 INSERT INTO public.user_module_permissions(user_id,modulo,nivel,pode_excluir,pode_relatorio,atualizado_por) VALUES(_user_id,_modulo,_nivel,_pode_excluir AND _nivel='OPERADOR',_pode_relatorio AND _nivel<>'SEM_ACESSO',auth.uid())
 ON CONFLICT (user_id,modulo) DO UPDATE SET nivel=EXCLUDED.nivel,pode_excluir=EXCLUDED.pode_excluir,pode_relatorio=EXCLUDED.pode_relatorio,atualizado_por=auth.uid(),updated_at=now();
 INSERT INTO public.historico_atividades(user_id,entidade,entidade_id,acao,detalhes) VALUES(auth.uid(),'ACESSO_USUARIO',_user_id,'LIBERACAO',jsonb_build_object('modulo',_modulo,'nivel',_nivel,'pode_excluir',_pode_excluir,'pode_relatorio',_pode_relatorio));
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.definir_acesso_modulo(uuid,text,text,boolean,boolean) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.definir_acesso_modulo(uuid,text,text,boolean,boolean) TO authenticated;