ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS status_manual boolean NOT NULL DEFAULT false;
ALTER TABLE public.acoes_educativas ADD COLUMN IF NOT EXISTS status_manual boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.situacao_por_horario(_data date, _ini time, _fim time, _concluida text)
RETURNS text LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE agora timestamp := (now() AT TIME ZONE 'America/Sao_Paulo'); i timestamp; f timestamp;
BEGIN
  IF _data IS NULL THEN RETURN NULL; END IF;
  i := _data + coalesce(_ini, time '00:00');
  IF _fim IS NULL THEN f := _data + interval '1 day';
  ELSE f := _data + _fim; IF _ini IS NOT NULL AND _fim <= _ini THEN f := f + interval '1 day'; END IF; END IF;
  IF agora < i THEN RETURN 'AGENDADA'; ELSIF agora < f THEN RETURN 'EM_ANDAMENTO'; ELSE RETURN _concluida; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.aplicar_situacao_automatica_os() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT NEW.status_manual AND NEW.status <> 'CANCELADA' AND NOT coalesce(NEW.arquivada,false) THEN
    NEW.status := coalesce(public.situacao_por_horario(NEW.data_servico, NEW.hora_inicio, NEW.hora_fim, 'EXECUTADA'), NEW.status);
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.aplicar_situacao_automatica_acao() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT NEW.status_manual AND NEW.status <> 'CANCELADA' AND NOT coalesce(NEW.arquivada,false) THEN
    NEW.status := coalesce(public.situacao_por_horario(NEW.data_acao, NEW.horario_inicio, NEW.horario_fim, 'REALIZADA'), NEW.status);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS situacao_automatica_os ON public.ordens_servico;
CREATE TRIGGER situacao_automatica_os BEFORE INSERT OR UPDATE ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION public.aplicar_situacao_automatica_os();
DROP TRIGGER IF EXISTS situacao_automatica_acao ON public.acoes_educativas;
CREATE TRIGGER situacao_automatica_acao BEFORE INSERT OR UPDATE ON public.acoes_educativas FOR EACH ROW EXECUTE FUNCTION public.aplicar_situacao_automatica_acao();

CREATE OR REPLACE FUNCTION public.atualizar_situacoes_automaticas() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.ordens_servico SET status = s.novo FROM (
    SELECT id, public.situacao_por_horario(data_servico, hora_inicio, hora_fim, 'EXECUTADA') novo FROM public.ordens_servico
    WHERE NOT status_manual AND status <> 'CANCELADA' AND NOT arquivada) s
  WHERE ordens_servico.id = s.id AND s.novo IS NOT NULL AND ordens_servico.status::text <> s.novo;
  UPDATE public.acoes_educativas SET status = s.novo FROM (
    SELECT id, public.situacao_por_horario(data_acao, horario_inicio, horario_fim, 'REALIZADA') novo FROM public.acoes_educativas
    WHERE NOT status_manual AND status <> 'CANCELADA' AND NOT arquivada) s
  WHERE acoes_educativas.id = s.id AND s.novo IS NOT NULL AND acoes_educativas.status::text <> s.novo;
END $$;
REVOKE ALL ON FUNCTION public.atualizar_situacoes_automaticas() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.atualizar_situacoes_automaticas() TO authenticated;
SELECT public.atualizar_situacoes_automaticas();