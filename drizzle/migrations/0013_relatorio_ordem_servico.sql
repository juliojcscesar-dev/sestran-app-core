ALTER TABLE public.ordens_servico
  ADD COLUMN IF NOT EXISTS relatorio_texto text,
  ADD COLUMN IF NOT EXISTS relatorio_imagens jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.ordens_servico
  ADD CONSTRAINT os_relatorio_imagens_array
  CHECK (jsonb_typeof(relatorio_imagens) = 'array' AND jsonb_array_length(relatorio_imagens) <= 6);