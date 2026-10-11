CREATE OR REPLACE FUNCTION public.validar_detalhes_modulo_arquivado() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE registro jsonb; parent_id uuid; arquivado boolean; fase integer;
BEGIN
 IF auth.uid() IS NULL THEN
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
 END IF;
 FOR fase IN 1..2 LOOP
  IF fase=1 AND TG_OP <> 'INSERT' THEN registro:=to_jsonb(OLD);
  ELSIF fase=2 AND TG_OP <> 'DELETE' THEN registro:=to_jsonb(NEW);
  ELSE CONTINUE;
  END IF;
  parent_id:=(registro->>TG_ARGV[1])::uuid;
  IF TG_ARGV[0]='OS' THEN SELECT o.arquivada INTO arquivado FROM public.ordens_servico o WHERE o.id=parent_id;
  ELSE SELECT v.arquivado INTO arquivado FROM public.veiculos_abandonados v WHERE v.id=parent_id;
  END IF;
  IF arquivado AND NOT public.acesso_modulo(auth.uid(),TG_ARGV[0],'EXCLUIR') THEN
   RAISE EXCEPTION 'O administrador precisa autorizar a alteração de detalhes de registros arquivados.' USING ERRCODE='42501';
  END IF;
 END LOOP;
 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.validar_detalhes_modulo_arquivado() FROM PUBLIC;
CREATE TRIGGER proteger_detalhes_arquivo BEFORE INSERT OR UPDATE OR DELETE ON public.ordem_servico_servicos FOR EACH ROW EXECUTE FUNCTION public.validar_detalhes_modulo_arquivado('OS','ordem_servico_id');
CREATE TRIGGER proteger_detalhes_arquivo BEFORE INSERT OR UPDATE OR DELETE ON public.ordem_servico_agentes FOR EACH ROW EXECUTE FUNCTION public.validar_detalhes_modulo_arquivado('OS','ordem_servico_id');
CREATE TRIGGER proteger_detalhes_arquivo BEFORE INSERT OR UPDATE OR DELETE ON public.ordem_servico_orientadores FOR EACH ROW EXECUTE FUNCTION public.validar_detalhes_modulo_arquivado('OS','ordem_servico_id');
CREATE TRIGGER proteger_detalhes_arquivo BEFORE INSERT OR UPDATE OR DELETE ON public.ordem_servico_interdicoes FOR EACH ROW EXECUTE FUNCTION public.validar_detalhes_modulo_arquivado('OS','ordem_servico_id');
CREATE TRIGGER proteger_detalhes_arquivo BEFORE INSERT OR UPDATE OR DELETE ON public.veiculo_fotos FOR EACH ROW EXECUTE FUNCTION public.validar_detalhes_modulo_arquivado('VEICULOS','veiculo_id');