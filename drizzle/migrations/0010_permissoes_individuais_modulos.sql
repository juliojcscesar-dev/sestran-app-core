CREATE TABLE public.user_module_permissions (
 user_id uuid NOT NULL,
 modulo text NOT NULL CHECK (modulo IN ('OS','VEICULOS','EDUCACAO')),
 nivel text NOT NULL DEFAULT 'SEM_ACESSO' CHECK (nivel IN ('SEM_ACESSO','CONSULTA','OPERADOR')),
 pode_excluir boolean NOT NULL DEFAULT false,
 atualizado_por uuid,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id, modulo),
 CHECK (NOT pode_excluir OR nivel = 'OPERADOR')
);
GRANT SELECT ON public.user_module_permissions TO authenticated;
GRANT ALL ON public.user_module_permissions TO service_role;
ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY permissoes_leitura ON public.user_module_permissions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'ADMINISTRADOR'));
CREATE OR REPLACE FUNCTION public.acesso_modulo(_user_id uuid, _modulo text, _acao text DEFAULT 'CONSULTA') RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id AND ativo)
 AND (public.has_role(_user_id, 'ADMINISTRADOR') OR EXISTS (
 SELECT 1 FROM public.user_module_permissions p WHERE p.user_id = _user_id AND p.modulo = _modulo
 AND CASE _acao WHEN 'CONSULTA' THEN p.nivel IN ('CONSULTA','OPERADOR') WHEN 'OPERADOR' THEN p.nivel = 'OPERADOR' WHEN 'EXCLUIR' THEN p.nivel = 'OPERADOR' AND p.pode_excluir ELSE false END));
$$;
REVOKE ALL ON FUNCTION public.acesso_modulo(uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.acesso_modulo(uuid,text,text) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.definir_acesso_modulo(_user_id uuid, _modulo text, _nivel text, _pode_excluir boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT public.has_role(auth.uid(), 'ADMINISTRADOR') OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id=auth.uid() AND ativo) THEN RAISE EXCEPTION 'Somente administradores podem liberar acessos.' USING ERRCODE='42501'; END IF;
 IF public.has_role(_user_id, 'ADMINISTRADOR') THEN RAISE EXCEPTION 'Administradores possuem acesso total.'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id=_user_id) THEN RAISE EXCEPTION 'Usuário não encontrado.'; END IF;
 INSERT INTO public.user_module_permissions(user_id,modulo,nivel,pode_excluir,atualizado_por) VALUES(_user_id,_modulo,_nivel,_pode_excluir,auth.uid())
 ON CONFLICT (user_id,modulo) DO UPDATE SET nivel=EXCLUDED.nivel,pode_excluir=EXCLUDED.pode_excluir,atualizado_por=auth.uid(),updated_at=now();
 INSERT INTO public.historico_atividades(user_id,entidade,entidade_id,acao,detalhes) VALUES(auth.uid(),'ACESSO_USUARIO',_user_id,'LIBERACAO',jsonb_build_object('modulo',_modulo,'nivel',_nivel,'pode_excluir',_pode_excluir));
END;
$$;
REVOKE ALL ON FUNCTION public.definir_acesso_modulo(uuid,text,text,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.definir_acesso_modulo(uuid,text,text,boolean) TO authenticated;
DO $$
DECLARE r record; t text; m text; read_expr text; write_expr text; delete_expr text;
BEGIN
 FOR r IN SELECT * FROM (VALUES
 ('ordens_servico','OS'),('ordem_servico_servicos','OS'),('ordem_servico_agentes','OS'),('ordem_servico_orientadores','OS'),('ordem_servico_interdicoes','OS'),('ordem_servico_historico','OS'),('os_contador','OS'),
 ('veiculos_abandonados','VEICULOS'),('veiculo_fotos','VEICULOS'),('veiculo_historico','VEICULOS'),
 ('acoes_educativas','EDUCACAO'),('acao_educativa_historico','EDUCACAO'),
 ('eventos','OS'),('agentes','OS'),('tipos_servico','OS'),('locais','OS'),('solicitantes','OS'),
 ('escolas','EDUCACAO'),('temas_educativos','EDUCACAO'),('orientadores','COMPARTILHADO'),('bairros','TERRITORIO'),('ruas','TERRITORIO'),('configuracoes','DOCUMENTOS')
 ) AS x(tab,mod) LOOP
 t:=r.tab; m:=r.mod;
 FOR read_expr IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP EXECUTE format('DROP POLICY %I ON public.%I',read_expr,t); END LOOP;
 IF m='COMPARTILHADO' THEN
 read_expr:='(public.acesso_modulo(auth.uid(), ''OS'',''CONSULTA'') OR public.acesso_modulo(auth.uid(), ''EDUCACAO'',''CONSULTA''))';
 write_expr:='(public.acesso_modulo(auth.uid(), ''OS'',''OPERADOR'') OR public.acesso_modulo(auth.uid(), ''EDUCACAO'',''OPERADOR''))';
 ELSIF m='TERRITORIO' THEN
 read_expr:='(public.acesso_modulo(auth.uid(), ''OS'',''CONSULTA'') OR public.acesso_modulo(auth.uid(), ''VEICULOS'',''CONSULTA''))';
 write_expr:='public.has_role(auth.uid(), ''ADMINISTRADOR'')';
 ELSIF m='DOCUMENTOS' THEN
 read_expr:='(public.acesso_modulo(auth.uid(), ''OS'',''CONSULTA'') OR public.acesso_modulo(auth.uid(), ''VEICULOS'',''CONSULTA'') OR public.acesso_modulo(auth.uid(), ''EDUCACAO'',''CONSULTA''))';
 write_expr:='public.has_role(auth.uid(), ''ADMINISTRADOR'')';
 ELSE
 read_expr:=format('public.acesso_modulo(auth.uid(), %L, ''CONSULTA'')',m);
 write_expr:=format('public.acesso_modulo(auth.uid(), %L, ''OPERADOR'')',m);
 END IF;
 EXECUTE format('CREATE POLICY modulo_select ON public.%I FOR SELECT TO authenticated USING (%s)',t,read_expr);
 IF t LIKE '%historico' OR t='os_contador' THEN CONTINUE; END IF;
 EXECUTE format('CREATE POLICY modulo_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (%s)',t,write_expr);
 EXECUTE format('CREATE POLICY modulo_update ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)',t,write_expr,write_expr);
 IF t IN ('ordens_servico','veiculos_abandonados','acoes_educativas') THEN delete_expr:=format('public.acesso_modulo(auth.uid(), %L, ''EXCLUIR'')',m);
 ELSIF t LIKE 'ordem_servico_%' OR t='veiculo_fotos' THEN delete_expr:=write_expr;
 ELSE delete_expr:='public.has_role(auth.uid(), ''ADMINISTRADOR'')'; END IF;
 EXECUTE format('CREATE POLICY modulo_delete ON public.%I FOR DELETE TO authenticated USING (%s)',t,delete_expr);
 END LOOP;
END $$;
CREATE OR REPLACE FUNCTION public.validar_arquivamento_modulo() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE m text; antigo boolean; novo boolean;
BEGIN
 m:=TG_ARGV[0]; antigo:=COALESCE((to_jsonb(OLD)->>TG_ARGV[1])::boolean,false); novo:=COALESCE((to_jsonb(NEW)->>TG_ARGV[1])::boolean,false);
 IF auth.uid() IS NOT NULL AND (antigo OR antigo IS DISTINCT FROM novo) AND NOT public.acesso_modulo(auth.uid(),m,'EXCLUIR') THEN RAISE EXCEPTION 'O administrador precisa autorizar o arquivamento ou alteração de registros arquivados.' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER acesso_arquivo_os BEFORE UPDATE ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION public.validar_arquivamento_modulo('OS','arquivada');
CREATE TRIGGER acesso_arquivo_veiculo BEFORE UPDATE ON public.veiculos_abandonados FOR EACH ROW EXECUTE FUNCTION public.validar_arquivamento_modulo('VEICULOS','arquivado');
CREATE TRIGGER acesso_arquivo_educacao BEFORE UPDATE ON public.acoes_educativas FOR EACH ROW EXECUTE FUNCTION public.validar_arquivamento_modulo('EDUCACAO','arquivada');
DROP POLICY profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'ADMINISTRADOR'));
DROP POLICY profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_admin ON public.profiles FOR UPDATE TO authenticated USING(public.has_role(auth.uid(),'ADMINISTRADOR')) WITH CHECK(public.has_role(auth.uid(),'ADMINISTRADOR'));
DROP POLICY roles_select ON public.user_roles;
CREATE POLICY roles_select ON public.user_roles FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'ADMINISTRADOR'));
ALTER POLICY veiculos_fotos_select ON storage.objects USING(bucket_id='veiculos' AND public.acesso_modulo(auth.uid(),'VEICULOS','CONSULTA'));
ALTER POLICY veiculos_fotos_insert ON storage.objects WITH CHECK(bucket_id='veiculos' AND public.acesso_modulo(auth.uid(),'VEICULOS','OPERADOR'));
ALTER POLICY veiculos_fotos_update ON storage.objects USING(bucket_id='veiculos' AND public.acesso_modulo(auth.uid(),'VEICULOS','OPERADOR')) WITH CHECK(bucket_id='veiculos' AND public.acesso_modulo(auth.uid(),'VEICULOS','OPERADOR'));
ALTER POLICY veiculos_fotos_delete ON storage.objects USING(bucket_id='veiculos' AND public.acesso_modulo(auth.uid(),'VEICULOS','OPERADOR'));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.acoes_educativas TO authenticated;
