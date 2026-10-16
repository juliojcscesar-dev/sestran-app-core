ALTER TABLE public.user_module_permissions DROP CONSTRAINT IF EXISTS user_module_permissions_modulo_check;
ALTER TABLE public.user_module_permissions ADD CONSTRAINT user_module_permissions_modulo_check CHECK (modulo = ANY (ARRAY['OS','VEICULOS','EDUCACAO','CREDENCIAIS']));

CREATE TABLE public.credenciais_vagas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('IDOSO','PCD','RENOVACAO_IDOSO','RENOVACAO_PCD','TEMPORARIA_PCD')),
  nome text NOT NULL CHECK (length(trim(nome)) > 0 AND length(nome) <= 200),
  tipo_documento text NOT NULL DEFAULT 'CPF' CHECK (tipo_documento IN ('CPF','RG','CNH')),
  numero_documento text NOT NULL CHECK (length(trim(numero_documento)) > 0 AND length(numero_documento) <= 40),
  nascimento date, telefone text, endereco text, numero text, bairro text, observacoes text,
  numero_registro text,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  conferente text, data_conferencia date,
  data_emissao date NOT NULL DEFAULT CURRENT_DATE,
  data_validade date,
  tempo_validade text,
  validade_manual boolean NOT NULL DEFAULT false,
  permitir_sem_checklist boolean NOT NULL DEFAULT false,
  criado_por uuid DEFAULT auth.uid(),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX credenciais_vagas_emissao_idx ON public.credenciais_vagas (data_emissao);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credenciais_vagas TO authenticated;
GRANT ALL ON public.credenciais_vagas TO service_role;
ALTER TABLE public.credenciais_vagas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Consulta credenciais" ON public.credenciais_vagas FOR SELECT TO authenticated USING (public.acesso_modulo(auth.uid(),'CREDENCIAIS','CONSULTA'));
CREATE POLICY "Cria credenciais" ON public.credenciais_vagas FOR INSERT TO authenticated WITH CHECK (public.acesso_modulo(auth.uid(),'CREDENCIAIS','OPERADOR'));
CREATE POLICY "Edita credenciais" ON public.credenciais_vagas FOR UPDATE TO authenticated USING (public.acesso_modulo(auth.uid(),'CREDENCIAIS','OPERADOR')) WITH CHECK (public.acesso_modulo(auth.uid(),'CREDENCIAIS','OPERADOR'));
CREATE POLICY "Exclui credenciais" ON public.credenciais_vagas FOR DELETE TO authenticated USING (public.acesso_modulo(auth.uid(),'CREDENCIAIS','EXCLUIR'));

CREATE OR REPLACE FUNCTION public.tocar_credencial_vaga() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN NEW.criado_por := OLD.criado_por; NEW.criado_em := OLD.criado_em; END IF;
  NEW.atualizado_em := now();
  RETURN NEW;
END $$;
CREATE TRIGGER tocar_credencial_vaga BEFORE INSERT OR UPDATE ON public.credenciais_vagas FOR EACH ROW EXECUTE FUNCTION public.tocar_credencial_vaga();