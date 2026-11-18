CREATE TABLE IF NOT EXISTS public.transporte_termo_estado (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  dados jsonb,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_por uuid
);
GRANT SELECT, INSERT, UPDATE ON public.transporte_termo_estado TO authenticated;
GRANT ALL ON public.transporte_termo_estado TO service_role;
ALTER TABLE public.transporte_termo_estado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "termo_select" ON public.transporte_termo_estado FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.transporte_alvaras_estado WHERE false) OR public.acesso_modulo(auth.uid(), 'TRANSPORTE', 'CONSULTA'));
CREATE POLICY "termo_insert" ON public.transporte_termo_estado FOR INSERT TO authenticated WITH CHECK (public.acesso_modulo(auth.uid(), 'TRANSPORTE', 'OPERADOR'));
CREATE POLICY "termo_update" ON public.transporte_termo_estado FOR UPDATE TO authenticated USING (public.acesso_modulo(auth.uid(), 'TRANSPORTE', 'OPERADOR')) WITH CHECK (public.acesso_modulo(auth.uid(), 'TRANSPORTE', 'OPERADOR'));