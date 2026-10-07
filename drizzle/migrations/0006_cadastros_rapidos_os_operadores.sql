CREATE POLICY eventos_insert_operador ON public.eventos FOR INSERT TO authenticated WITH CHECK (public.pode_operar(auth.uid()));
CREATE POLICY agentes_insert_operador ON public.agentes FOR INSERT TO authenticated WITH CHECK (public.pode_operar(auth.uid()));
CREATE POLICY orientadores_insert_operador ON public.orientadores FOR INSERT TO authenticated WITH CHECK (public.pode_operar(auth.uid()));