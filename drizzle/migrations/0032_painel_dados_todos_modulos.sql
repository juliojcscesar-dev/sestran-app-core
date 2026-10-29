CREATE OR REPLACE FUNCTION public.painel_dados(_os_inicio date, _os_fim date, _edu_inicio date, _edu_fim date, _hoje date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid := auth.uid(); res jsonb;
BEGIN
  IF u IS NULL OR NOT (public.acesso_modulo(u,'OS') OR public.acesso_modulo(u,'VEICULOS') OR public.acesso_modulo(u,'EDUCACAO')
      OR public.acesso_modulo(u,'CREDENCIAIS') OR public.acesso_modulo(u,'SINALIZACAO')) THEN
    RAISE EXCEPTION 'O painel fica disponível após a liberação de algum módulo pelo administrador.' USING ERRCODE = '42501';
  END IF;

  WITH c AS (
    SELECT CASE WHEN tipo IN ('PCD','RENOVACAO_PCD','TEMPORARIA_PCD') THEN 'PCD' ELSE 'IDOSO' END AS grupo,
           (substring(btrim(coalesce(numero_registro,'')) from '^[0-9]+'))::numeric AS n,
           data_validade, data_emissao, criado_em
    FROM public.credenciais_vagas
  ), r AS (
    SELECT DISTINCT ON (grupo, n) * FROM c WHERE n IS NOT NULL ORDER BY grupo, n, data_emissao DESC, criado_em DESC
  ), h AS (
    SELECT *, row_number() OVER (PARTITION BY grupo, numero ORDER BY id) AS rn FROM public.credenciais_historico
  ), m AS (
    SELECT h.grupo,
           CASE WHEN r.n IS NULL THEN h.validade ELSE r.data_validade END AS validade,
           CASE WHEN r.n IS NULL THEN h.validade_indeterminada ELSE false END AS indet,
           CASE WHEN r.n IS NULL THEN h.situacao END AS situacao
    FROM h LEFT JOIN r ON h.rn = 1 AND r.grupo = h.grupo AND r.n = h.numero
    UNION ALL
    SELECT r.grupo, r.data_validade, false, NULL FROM r
    WHERE NOT EXISTS (SELECT 1 FROM public.credenciais_historico x WHERE x.grupo = r.grupo AND x.numero = r.n)
    UNION ALL
    SELECT c.grupo, c.data_validade, false, NULL FROM c WHERE c.n IS NULL
  )
  SELECT jsonb_build_object(
    'os', jsonb_build_object(
      'mes', coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.data_servico, x.hora_inicio) FROM (
        SELECT id, numero, titulo, data_servico, hora_inicio, hora_fim, status, "local" FROM public.ordens_servico
        WHERE NOT arquivada AND data_servico BETWEEN _os_inicio AND _os_fim) x), '[]'::jsonb),
      'proximas', coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.data_servico, x.hora_inicio) FROM (
        SELECT id, numero, titulo, data_servico, hora_inicio, hora_fim, status, "local" FROM public.ordens_servico
        WHERE NOT arquivada AND data_servico >= _hoje AND status::text IN ('AGENDADA','EM_ANDAMENTO')
        ORDER BY data_servico, hora_inicio LIMIT 20) x), '[]'::jsonb),
      'agendadas', (SELECT count(*) FROM public.ordens_servico WHERE NOT arquivada AND status::text = 'AGENDADA'),
      'executadas', (SELECT count(*) FROM public.ordens_servico WHERE NOT arquivada AND status::text = 'EXECUTADA')),
    'educacao', jsonb_build_object(
      'mes', coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.data_acao, x.horario_inicio) FROM (
        SELECT id, titulo, data_acao, horario_inicio, horario_fim, status, "local" FROM public.acoes_educativas
        WHERE NOT arquivada AND data_acao BETWEEN _edu_inicio AND _edu_fim) x), '[]'::jsonb),
      'proximas', coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.data_acao, x.horario_inicio) FROM (
        SELECT id, titulo, data_acao, horario_inicio, horario_fim, status, "local" FROM public.acoes_educativas
        WHERE NOT arquivada AND data_acao >= _hoje AND status::text IN ('AGENDADA','PLANEJADA','EM_ANDAMENTO')
        ORDER BY data_acao, horario_inicio LIMIT 20) x), '[]'::jsonb),
      'agendadas', (SELECT count(*) FROM public.acoes_educativas WHERE NOT arquivada AND status::text IN ('AGENDADA','PLANEJADA')),
      'realizadas', (SELECT count(*) FROM public.acoes_educativas WHERE NOT arquivada AND status::text = 'REALIZADA')),
    'veiculos', coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC, x.id) FROM (
      SELECT id, marca, modelo, placa, endereco, bairro, status, situacao, data_verificacao, data_notificacao, data_recolhimento,
             data_retirada, prazo_recolhimento, created_at
      FROM public.veiculos_abandonados WHERE NOT arquivado) x), '[]'::jsonb),
    'sinalizacao', coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.criado_em DESC) FROM (
      SELECT id, numero, data, natureza, endereco, pedido, funcionario, status, criado_em FROM public.sinalizacao_os) x), '[]'::jsonb),
    'credenciais', (SELECT jsonb_build_object(
      'total', count(*),
      'validas', count(*) FILTER (WHERE NOT indet AND validade > _hoje + 90),
      'idosos', count(*) FILTER (WHERE grupo = 'IDOSO'),
      'pcd', count(*) FILTER (WHERE grupo = 'PCD'),
      'vencidas', count(*) FILTER (WHERE NOT indet AND validade < _hoje),
      'ocorrencia', count(*) FILTER (WHERE coalesce(situacao, '') <> '')) FROM m)
  ) INTO res;
  RETURN res;
END;
$$;
REVOKE ALL ON FUNCTION public.painel_dados(date, date, date, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.painel_dados(date, date, date, date, date) TO authenticated, service_role;
COMMENT ON FUNCTION public.painel_dados(date, date, date, date, date) IS 'Resumo do Painel para qualquer usuário ativo com algum módulo liberado; não abre os módulos nem permite alterações.';