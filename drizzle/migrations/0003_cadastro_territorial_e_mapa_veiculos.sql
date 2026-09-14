CREATE TABLE public.bairros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  codigo_oficial text,
  fonte text NOT NULL,
  fonte_url text,
  atualizado_em date NOT NULL DEFAULT CURRENT_DATE,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bairros TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bairros TO authenticated;
GRANT ALL ON public.bairros TO service_role;
ALTER TABLE public.bairros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bairros visiveis a autenticados" ON public.bairros FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestores gerenciam bairros" ON public.bairros FOR ALL TO authenticated USING (public.is_gestor(auth.uid())) WITH CHECK (public.is_gestor(auth.uid()));

CREATE TABLE public.ruas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text,
  nome text NOT NULL,
  nome_completo text NOT NULL UNIQUE,
  bairro_id uuid REFERENCES public.bairros(id),
  codigo_oficial text,
  fonte text NOT NULL,
  fonte_url text,
  atualizado_em date NOT NULL DEFAULT CURRENT_DATE,
  geometria jsonb,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ruas TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ruas TO authenticated;
GRANT ALL ON public.ruas TO service_role;
ALTER TABLE public.ruas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ruas visiveis a autenticados" ON public.ruas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestores gerenciam ruas" ON public.ruas FOR ALL TO authenticated USING (public.is_gestor(auth.uid())) WITH CHECK (public.is_gestor(auth.uid()));

ALTER TABLE public.veiculos_abandonados
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS bairro_id uuid REFERENCES public.bairros(id),
  ADD COLUMN IF NOT EXISTS rua_id uuid REFERENCES public.ruas(id);

CREATE TRIGGER trg_bairros_upd BEFORE UPDATE ON public.bairros FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ruas_upd BEFORE UPDATE ON public.ruas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_ruas_nome ON public.ruas (nome_completo);
CREATE INDEX idx_ruas_bairro ON public.ruas (bairro_id);
CREATE INDEX idx_veiculos_coordenadas ON public.veiculos_abandonados (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;