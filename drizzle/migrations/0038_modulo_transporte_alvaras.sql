ALTER TABLE public.user_module_permissions DROP CONSTRAINT IF EXISTS user_module_permissions_modulo_check;
ALTER TABLE public.user_module_permissions ADD CONSTRAINT user_module_permissions_modulo_check CHECK (modulo = ANY (ARRAY['OS','VEICULOS','EDUCACAO','CREDENCIAIS','SINALIZACAO','TRANSPORTE']));
CREATE TABLE IF NOT EXISTS public.transporte_alvaras_estado (
  id integer PRIMARY KEY CHECK (id = 1),
  registros jsonb,
  tipos_veiculo jsonb,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_por uuid
);
GRANT SELECT, INSERT, UPDATE ON public.transporte_alvaras_estado TO authenticated;
GRANT ALL ON public.transporte_alvaras_estado TO service_role;
ALTER TABLE public.transporte_alvaras_estado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tra_select" ON public.transporte_alvaras_estado FOR SELECT TO authenticated USING (public.acesso_modulo(auth.uid(),'TRANSPORTE','CONSULTA'));
CREATE POLICY "tra_insert" ON public.transporte_alvaras_estado FOR INSERT TO authenticated WITH CHECK (public.acesso_modulo(auth.uid(),'TRANSPORTE','OPERADOR'));
CREATE POLICY "tra_update" ON public.transporte_alvaras_estado FOR UPDATE TO authenticated USING (public.acesso_modulo(auth.uid(),'TRANSPORTE','OPERADOR')) WITH CHECK (public.acesso_modulo(auth.uid(),'TRANSPORTE','OPERADOR'));