ALTER TABLE public.veiculos_abandonados ADD COLUMN situacao text;
ALTER TABLE public.veiculos_abandonados ADD CONSTRAINT veiculos_situacao_check CHECK (situacao IS NULL OR situacao IN ('RETIRADO','NOTIFICADO','RECOLHIDO','NAO_ABANDONADO','TERRENO','OUTROS'));
ALTER TABLE public.veiculos_abandonados DROP CONSTRAINT veiculos_abandonados_status_check;
ALTER TABLE public.veiculos_abandonados ADD CONSTRAINT veiculos_abandonados_status_check CHECK (status IN ('REGISTRADO','REMOVIDO','ARQUIVADO','DENUNCIADO','NOTIFICADO','RECOLHER','RECOLHIDO','RETIRADO','NAO_ABANDONADO','TERRENO','OUTROS'));
CREATE OR REPLACE FUNCTION public.veiculo_regras_status() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.situacao = 'NOTIFICADO' AND NEW.data_notificacao IS NULL THEN
    NEW.data_notificacao := CURRENT_DATE;
  END IF;
  NEW.prazo_recolhimento := CASE WHEN NEW.data_notificacao IS NOT NULL THEN NEW.data_notificacao + 15 ELSE NULL END;
  IF NEW.situacao IS NOT NULL THEN
    IF NEW.situacao = 'NOTIFICADO' THEN
      NEW.status := CASE WHEN NEW.prazo_recolhimento <= CURRENT_DATE THEN 'RECOLHER' ELSE 'NOTIFICADO' END;
    ELSE
      NEW.status := NEW.situacao;
    END IF;
  ELSIF NEW.data_retirada IS NOT NULL THEN NEW.status := 'RETIRADO';
  ELSIF NEW.data_recolhimento IS NOT NULL THEN NEW.status := 'RECOLHIDO';
  ELSIF NEW.data_notificacao IS NOT NULL THEN
    NEW.status := CASE WHEN NEW.prazo_recolhimento <= CURRENT_DATE THEN 'RECOLHER' ELSE 'NOTIFICADO' END;
  ELSE NEW.status := 'DENUNCIADO';
  END IF;
  RETURN NEW;
END; $$;
COMMENT ON COLUMN public.veiculos_abandonados.situacao IS 'Situação informada no cadastro; NULL preserva o fluxo legado por datas.';