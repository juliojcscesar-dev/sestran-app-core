ALTER TABLE public.user_module_permissions DROP CONSTRAINT IF EXISTS user_module_permissions_modulo_check;
ALTER TABLE public.user_module_permissions ADD CONSTRAINT user_module_permissions_modulo_check CHECK (modulo = ANY (ARRAY['OS','VEICULOS','EDUCACAO','CREDENCIAIS','SINALIZACAO']));
INSERT INTO public.user_module_permissions(user_id,modulo,nivel,pode_excluir,pode_relatorio,atualizado_por)
SELECT user_id,'SINALIZACAO',nivel,pode_excluir,pode_relatorio,atualizado_por FROM public.user_module_permissions WHERE modulo='OS'
ON CONFLICT (user_id,modulo) DO NOTHING;
DROP POLICY IF EXISTS "sin_select" ON public.sinalizacao_os;
DROP POLICY IF EXISTS "sin_insert" ON public.sinalizacao_os;
DROP POLICY IF EXISTS "sin_update" ON public.sinalizacao_os;
DROP POLICY IF EXISTS "sin_delete" ON public.sinalizacao_os;
CREATE POLICY "sin_select" ON public.sinalizacao_os FOR SELECT TO authenticated USING (public.acesso_modulo(auth.uid(),'SINALIZACAO','CONSULTA'));
CREATE POLICY "sin_insert" ON public.sinalizacao_os FOR INSERT TO authenticated WITH CHECK (public.acesso_modulo(auth.uid(),'SINALIZACAO','OPERADOR'));
CREATE POLICY "sin_update" ON public.sinalizacao_os FOR UPDATE TO authenticated USING (public.acesso_modulo(auth.uid(),'SINALIZACAO','OPERADOR')) WITH CHECK (public.acesso_modulo(auth.uid(),'SINALIZACAO','OPERADOR'));
CREATE POLICY "sin_delete" ON public.sinalizacao_os FOR DELETE TO authenticated USING (public.acesso_modulo(auth.uid(),'SINALIZACAO','EXCLUIR'));