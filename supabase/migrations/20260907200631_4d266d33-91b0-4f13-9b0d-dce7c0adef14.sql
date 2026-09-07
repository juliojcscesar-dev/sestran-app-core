CREATE TABLE public.configuracoes (
  chave text PRIMARY KEY,
  valor text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.configuracoes TO authenticated;
GRANT ALL ON public.configuracoes TO service_role;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY configuracoes_select ON public.configuracoes FOR SELECT TO authenticated USING (true);
CREATE POLICY configuracoes_insert ON public.configuracoes FOR INSERT TO authenticated WITH CHECK (public.is_gestor(auth.uid()));
CREATE POLICY configuracoes_update ON public.configuracoes FOR UPDATE TO authenticated USING (public.is_gestor(auth.uid())) WITH CHECK (public.is_gestor(auth.uid()));
CREATE TRIGGER trg_configuracoes_upd BEFORE UPDATE ON public.configuracoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.configuracoes (chave, valor) VALUES
  ('orgao', 'Prefeitura Municipal de Paranavaí'),
  ('secretaria', 'Secretaria Municipal de Trânsito — SESTRAN'),
  ('logo_url', '');