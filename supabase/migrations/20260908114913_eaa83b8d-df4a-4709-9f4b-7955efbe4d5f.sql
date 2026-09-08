ALTER TABLE public.ordens_servico
  ADD COLUMN IF NOT EXISTS percurso jsonb,
  ADD COLUMN IF NOT EXISTS mapa_imagem text;

CREATE TABLE IF NOT EXISTS public.ordem_servico_interdicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_servico_id uuid NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  rua text NOT NULL,
  trecho_inicial text,
  trecho_final text,
  observacao text,
  geometria jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordem_servico_interdicoes TO authenticated;
GRANT ALL ON public.ordem_servico_interdicoes TO service_role;

ALTER TABLE public.ordem_servico_interdicoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS osi_select ON public.ordem_servico_interdicoes;
CREATE POLICY osi_select ON public.ordem_servico_interdicoes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS osi_write ON public.ordem_servico_interdicoes;
CREATE POLICY osi_write ON public.ordem_servico_interdicoes FOR ALL TO authenticated
  USING (public.pode_operar(auth.uid())) WITH CHECK (public.pode_operar(auth.uid()));

DROP TRIGGER IF EXISTS trg_osi_upd ON public.ordem_servico_interdicoes;
CREATE TRIGGER trg_osi_upd BEFORE UPDATE ON public.ordem_servico_interdicoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_osi_ordem ON public.ordem_servico_interdicoes(ordem_servico_id);