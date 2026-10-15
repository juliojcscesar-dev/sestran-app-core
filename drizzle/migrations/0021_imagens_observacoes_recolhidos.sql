ALTER TABLE public.veiculos_recolhidos ADD COLUMN observacoes_imagens jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE OR REPLACE FUNCTION public.validar_imagens_observacoes_recolhidos() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE imagem jsonb;
BEGIN
  IF jsonb_typeof(NEW.observacoes_imagens) <> 'array' THEN
    RAISE EXCEPTION 'As imagens das observações devem ser uma lista.';
  END IF;
  IF jsonb_array_length(NEW.observacoes_imagens) > 3 THEN
    RAISE EXCEPTION 'Adicione no máximo 3 imagens nas observações.';
  END IF;
  FOR imagem IN SELECT value FROM jsonb_array_elements(NEW.observacoes_imagens) LOOP
    IF jsonb_typeof(imagem) <> 'string' OR length(imagem #>> '{}') > 750000 OR (imagem #>> '{}') !~ '^data:image/jpeg;base64,[A-Za-z0-9+/]+={0,2}$' THEN
      RAISE EXCEPTION 'Imagem inválida ou muito grande nas observações.';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validar_imagens_observacoes_recolhidos BEFORE INSERT OR UPDATE OF observacoes_imagens ON public.veiculos_recolhidos FOR EACH ROW EXECUTE FUNCTION public.validar_imagens_observacoes_recolhidos();
COMMENT ON COLUMN public.veiculos_recolhidos.observacoes_imagens IS 'Até três imagens JPEG comprimidas das observações, protegidas pelas permissões existentes do registro.';