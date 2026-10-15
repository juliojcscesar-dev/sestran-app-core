CREATE TABLE public.veiculos_recolhidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marca text NOT NULL CHECK (length(trim(marca)) BETWEEN 1 AND 80),
  modelo text NOT NULL CHECK (length(trim(modelo)) BETWEEN 1 AND 80),
  placa text, chassi text, cor text, categoria text,
  data_notificacao date,
  data_recolhimento date NOT NULL,
  hora_recolhimento time,
  local_encontrado text, motivo text, agente text, documento text, observacoes text,
  proprietario text, tipo_documento text, numero_documento text, endereco text, telefone text,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(checklist) = 'array'),
  obs_vistoria text, vistoriador text, data_vistoria date,
  situacao text NOT NULL DEFAULT 'No pátio' CHECK (situacao IN ('No pátio','Aguardando vistoria','Vistoria concluída','Em análise administrativa','Em processo de liberação','Liberado','Encaminhado para destinação')),
  criado_por uuid DEFAULT auth.uid(),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.veiculos_recolhidos TO authenticated;
GRANT ALL ON public.veiculos_recolhidos TO service_role;
ALTER TABLE public.veiculos_recolhidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recolhidos consulta" ON public.veiculos_recolhidos FOR SELECT TO authenticated USING (public.acesso_modulo(auth.uid(),'VEICULOS','CONSULTA'));
CREATE POLICY "recolhidos inserir" ON public.veiculos_recolhidos FOR INSERT TO authenticated WITH CHECK (public.acesso_modulo(auth.uid(),'VEICULOS','OPERADOR'));
CREATE POLICY "recolhidos editar" ON public.veiculos_recolhidos FOR UPDATE TO authenticated USING (public.acesso_modulo(auth.uid(),'VEICULOS','OPERADOR')) WITH CHECK (public.acesso_modulo(auth.uid(),'VEICULOS','OPERADOR'));
CREATE POLICY "recolhidos excluir" ON public.veiculos_recolhidos FOR DELETE TO authenticated USING (public.acesso_modulo(auth.uid(),'VEICULOS','EXCLUIR'));
CREATE OR REPLACE FUNCTION public.tocar_veiculo_recolhido() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.atualizado_em := now(); IF TG_OP = 'UPDATE' THEN NEW.criado_por := OLD.criado_por; NEW.criado_em := OLD.criado_em; END IF; RETURN NEW; END $$;
CREATE TRIGGER veiculos_recolhidos_tocar BEFORE INSERT OR UPDATE ON public.veiculos_recolhidos FOR EACH ROW EXECUTE FUNCTION public.tocar_veiculo_recolhido();