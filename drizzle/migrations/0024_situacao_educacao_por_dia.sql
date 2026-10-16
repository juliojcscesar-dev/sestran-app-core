CREATE OR REPLACE FUNCTION public.aplicar_situacao_automatica_acao()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT NEW.status_manual AND NEW.status <> 'CANCELADA' AND NOT coalesce(NEW.arquivada,false) THEN
    NEW.status := coalesce(public.situacao_por_dia(NEW.data_acao, 'REALIZADA'), NEW.status);
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.atualizar_situacoes_automaticas()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.ordens_servico SET status = s.novo FROM (
    SELECT id, public.situacao_por_dia(data_servico, 'EXECUTADA') novo FROM public.ordens_servico
    WHERE NOT status_manual AND status <> 'CANCELADA' AND NOT arquivada) s
  WHERE ordens_servico.id = s.id AND s.novo IS NOT NULL AND ordens_servico.status::text <> s.novo;
  UPDATE public.acoes_educativas SET status = s.novo FROM (
    SELECT id, public.situacao_por_dia(data_acao, 'REALIZADA') novo FROM public.acoes_educativas
    WHERE NOT status_manual AND status <> 'CANCELADA' AND NOT arquivada) s
  WHERE acoes_educativas.id = s.id AND s.novo IS NOT NULL AND acoes_educativas.status::text <> s.novo;
END $$;