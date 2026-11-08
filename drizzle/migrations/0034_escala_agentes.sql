CREATE TABLE public.escala_agentes_estado (id int PRIMARY KEY DEFAULT 1 CHECK (id = 1), dados jsonb NOT NULL, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por uuid);
GRANT SELECT, INSERT, UPDATE ON public.escala_agentes_estado TO authenticated;
GRANT ALL ON public.escala_agentes_estado TO service_role;
ALTER TABLE public.escala_agentes_estado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin le escala" ON public.escala_agentes_estado FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'ADMINISTRADOR'));
CREATE POLICY "Admin cria escala" ON public.escala_agentes_estado FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'ADMINISTRADOR'));
CREATE POLICY "Admin altera escala" ON public.escala_agentes_estado FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'ADMINISTRADOR')) WITH CHECK (public.has_role(auth.uid(), 'ADMINISTRADOR'));