-- Histórico: valores muito longos (mapa em imagem, imagens do relatório, percurso)
-- eram gravados por extenso, estourando a largura da tela e inchando o banco.
-- Passamos a gravar um resumo legível, preservando a informação de que o campo mudou.

CREATE OR REPLACE FUNCTION public.resumo_valor_hist(v jsonb)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN v IS NULL OR v = 'null'::jsonb THEN 'vazio'
    WHEN jsonb_typeof(v) = 'string' AND (v #>> '{}') LIKE 'data:%' THEN 'imagem'
    WHEN LENGTH(v::text) > 300 THEN 'conteúdo extenso (' || LENGTH(v::text) || ' caracteres)'
    ELSE v::text
  END;
$$;

CREATE OR REPLACE FUNCTION public.resumo_alteracoes_hist(alteracoes jsonb)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_object_agg(
      chave,
      CASE
        WHEN jsonb_typeof(valor) = 'object' AND (valor ? 'de' OR valor ? 'para')
        THEN jsonb_build_object(
               'de', public.resumo_valor_hist(valor -> 'de'),
               'para', public.resumo_valor_hist(valor -> 'para'))
        ELSE valor
      END
    ),
    '{}'::jsonb
  )
  FROM jsonb_each(alteracoes) AS t(chave, valor);
$$;

GRANT EXECUTE ON FUNCTION public.resumo_valor_hist(jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.resumo_alteracoes_hist(jsonb) TO authenticated, service_role;

-- Gatilho da Ordem de Serviço
CREATE OR REPLACE FUNCTION public.registrar_historico_os()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_acao text;
  v_alt jsonb := '{}'::jsonb;
  v_campo text;
  v_old jsonb;
  v_new jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.ordem_servico_historico (ordem_servico_id, user_id, acao, alteracoes)
    VALUES (NEW.id, auth.uid(), 'CRIACAO', jsonb_build_object('numero', NEW.numero, 'status', NEW.status));
    RETURN NEW;
  END IF;

  v_old := to_jsonb(OLD);
  v_new := to_jsonb(NEW);
  FOR v_campo IN SELECT jsonb_object_keys(v_new) LOOP
    IF v_campo NOT IN ('updated_at') AND (v_old -> v_campo) IS DISTINCT FROM (v_new -> v_campo) THEN
      v_alt := v_alt || jsonb_build_object(v_campo, jsonb_build_object(
        'de', public.resumo_valor_hist(v_old -> v_campo),
        'para', public.resumo_valor_hist(v_new -> v_campo)));
    END IF;
  END LOOP;

  IF v_alt = '{}'::jsonb THEN RETURN NEW; END IF;

  IF OLD.arquivada IS DISTINCT FROM NEW.arquivada THEN
    v_acao := CASE WHEN NEW.arquivada THEN 'ARQUIVAMENTO' ELSE 'RESTAURACAO' END;
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    v_acao := 'MUDANCA_STATUS';
  ELSE
    v_acao := 'EDICAO';
  END IF;

  INSERT INTO public.ordem_servico_historico (ordem_servico_id, user_id, acao, alteracoes)
  VALUES (NEW.id, auth.uid(), v_acao, v_alt);
  RETURN NEW;
END;
$function$;

-- Gatilho da Ação Educativa
CREATE OR REPLACE FUNCTION public.registrar_historico_acao_educativa()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_acao text;
  v_alt jsonb := '{}'::jsonb;
  v_campo text;
  v_old jsonb;
  v_new jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.acao_educativa_historico (acao_educativa_id, user_id, acao, alteracoes)
    VALUES (NEW.id, auth.uid(), 'CRIACAO', jsonb_build_object('titulo', NEW.titulo, 'status', NEW.status));
    RETURN NEW;
  END IF;

  v_old := to_jsonb(OLD);
  v_new := to_jsonb(NEW);
  FOR v_campo IN SELECT jsonb_object_keys(v_new) LOOP
    IF v_campo NOT IN ('updated_at') AND (v_old -> v_campo) IS DISTINCT FROM (v_new -> v_campo) THEN
      v_alt := v_alt || jsonb_build_object(v_campo, jsonb_build_object(
        'de', public.resumo_valor_hist(v_old -> v_campo),
        'para', public.resumo_valor_hist(v_new -> v_campo)));
    END IF;
  END LOOP;

  IF v_alt = '{}'::jsonb THEN RETURN NEW; END IF;

  IF OLD.arquivada IS DISTINCT FROM NEW.arquivada THEN
    v_acao := CASE WHEN NEW.arquivada THEN 'ARQUIVAMENTO' ELSE 'RESTAURACAO' END;
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    v_acao := 'MUDANCA_STATUS';
  ELSE
    v_acao := 'EDICAO';
  END IF;

  INSERT INTO public.acao_educativa_historico (acao_educativa_id, user_id, acao, alteracoes)
  VALUES (NEW.id, auth.uid(), v_acao, v_alt);
  RETURN NEW;
END;
$function$;

-- Gatilho do Veículo Abandonado
CREATE OR REPLACE FUNCTION public.registrar_historico_veiculo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_acao text;
  v_alt jsonb := '{}'::jsonb;
  v_campo text;
  v_old jsonb;
  v_new jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.veiculo_historico (veiculo_id, user_id, acao, alteracoes)
    VALUES (NEW.id, auth.uid(), 'CRIACAO', jsonb_build_object('status', NEW.status));
    RETURN NEW;
  END IF;

  v_old := to_jsonb(OLD);
  v_new := to_jsonb(NEW);
  FOR v_campo IN SELECT jsonb_object_keys(v_new) LOOP
    IF v_campo NOT IN ('updated_at') AND (v_old -> v_campo) IS DISTINCT FROM (v_new -> v_campo) THEN
      v_alt := v_alt || jsonb_build_object(v_campo, jsonb_build_object(
        'de', public.resumo_valor_hist(v_old -> v_campo),
        'para', public.resumo_valor_hist(v_new -> v_campo)));
    END IF;
  END LOOP;

  IF v_alt = '{}'::jsonb THEN RETURN NEW; END IF;

  IF OLD.arquivado IS DISTINCT FROM NEW.arquivado THEN
    v_acao := CASE WHEN NEW.arquivado THEN 'ARQUIVAMENTO' ELSE 'RESTAURACAO' END;
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    v_acao := 'MUDANCA_STATUS';
  ELSE
    v_acao := 'EDICAO';
  END IF;

  INSERT INTO public.veiculo_historico (veiculo_id, user_id, acao, alteracoes)
  VALUES (NEW.id, auth.uid(), v_acao, v_alt);
  RETURN NEW;
END;
$function$;

-- Registros de histórico já gravados com conteúdo extenso: mantém a marca da
-- alteração, mas sem o texto/base64 por extenso.
UPDATE public.ordem_servico_historico
   SET alteracoes = public.resumo_alteracoes_hist(alteracoes)
 WHERE LENGTH(alteracoes::text) > 300;

UPDATE public.acao_educativa_historico
   SET alteracoes = public.resumo_alteracoes_hist(alteracoes)
 WHERE LENGTH(alteracoes::text) > 300;

UPDATE public.veiculo_historico
   SET alteracoes = public.resumo_alteracoes_hist(alteracoes)
 WHERE LENGTH(alteracoes::text) > 300;