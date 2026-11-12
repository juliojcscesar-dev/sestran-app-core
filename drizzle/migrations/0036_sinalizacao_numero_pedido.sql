ALTER TABLE public.sinalizacao_os ADD COLUMN IF NOT EXISTS numero_pedido text;
COMMENT ON COLUMN public.sinalizacao_os.numero_pedido IS 'Nº do pedido (GEO ou IPM); opcional.';