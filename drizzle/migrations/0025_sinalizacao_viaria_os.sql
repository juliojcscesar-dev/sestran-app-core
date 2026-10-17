CREATE TABLE public.sinalizacao_os (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL,
  pedido text NOT NULL,
  data date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'Aguardando' CHECK (status IN ('Aguardando','Em Execução','Concluída','Cancelada')),
  natureza text NOT NULL,
  endereco text NOT NULL,
  servico text NOT NULL,
  funcionario text,
  observacao text,
  preenchido text,
  cargo text,
  imagens jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(imagens)='array' AND jsonb_array_length(imagens) <= 4),
  criado_por uuid DEFAULT auth.uid(),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sinalizacao_os TO authenticated;
GRANT ALL ON public.sinalizacao_os TO service_role;
ALTER TABLE public.sinalizacao_os ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sin_select" ON public.sinalizacao_os FOR SELECT TO authenticated USING (public.acesso_modulo(auth.uid(),'OS','CONSULTA'));
CREATE POLICY "sin_insert" ON public.sinalizacao_os FOR INSERT TO authenticated WITH CHECK (public.acesso_modulo(auth.uid(),'OS','OPERADOR'));
CREATE POLICY "sin_update" ON public.sinalizacao_os FOR UPDATE TO authenticated USING (public.acesso_modulo(auth.uid(),'OS','OPERADOR')) WITH CHECK (public.acesso_modulo(auth.uid(),'OS','OPERADOR'));
CREATE POLICY "sin_delete" ON public.sinalizacao_os FOR DELETE TO authenticated USING (public.acesso_modulo(auth.uid(),'OS','EXCLUIR'));