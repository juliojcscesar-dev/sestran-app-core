CREATE OR REPLACE FUNCTION public.gerar_numero_os()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ano integer;
  v_seq integer;
  v_numero text;
  v_partes text[];
BEGIN
  v_ano := COALESCE(NEW.ano, EXTRACT(YEAR FROM COALESCE(NEW.data_emissao, CURRENT_DATE))::int);
  v_numero := btrim(COALESCE(NEW.numero, ''));

  IF v_numero <> '' THEN
    IF v_numero !~ '^[0-9]+(/[0-9]{4})?$' THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Número da O.S. inválido. Use somente o número ou o formato número/ano.';
    END IF;

    v_partes := regexp_split_to_array(v_numero, '/');
    v_seq := v_partes[1]::integer;

    IF v_seq < 1 THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'O número da O.S. deve ser maior que zero.';
    END IF;

    IF array_length(v_partes, 1) = 2 AND v_partes[2]::integer <> v_ano THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'O ano do número da O.S. deve corresponder ao ano da data de emissão.';
    END IF;

    INSERT INTO public.os_contador (ano, ultimo)
    VALUES (v_ano, v_seq)
    ON CONFLICT (ano) DO UPDATE
      SET ultimo = GREATEST(public.os_contador.ultimo, EXCLUDED.ultimo);
  ELSE
    INSERT INTO public.os_contador (ano, ultimo)
    VALUES (v_ano, 1)
    ON CONFLICT (ano) DO UPDATE
      SET ultimo = public.os_contador.ultimo + 1
    RETURNING ultimo INTO v_seq;
  END IF;

  NEW.ano := v_ano;
  NEW.sequencial := v_seq;
  NEW.numero := lpad(v_seq::text, 3, '0') || '/' || v_ano::text;
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'Este número de O.S. já está em uso neste ano.';
END;
$$;

REVOKE ALL ON FUNCTION public.gerar_numero_os() FROM PUBLIC, anon, authenticated;