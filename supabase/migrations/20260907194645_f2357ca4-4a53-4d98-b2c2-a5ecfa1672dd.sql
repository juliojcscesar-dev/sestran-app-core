CREATE TYPE public.app_role AS ENUM ('ADMINISTRADOR','GESTOR','OPERADOR','CONSULTA');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  nome_completo text NOT NULL,
  email text,
  cargo text,
  telefone text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_gestor(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('ADMINISTRADOR','GESTOR'));
$$;

CREATE OR REPLACE FUNCTION public.pode_operar(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('ADMINISTRADOR','GESTOR','OPERADOR'));
$$;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'ADMINISTRADOR'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'ADMINISTRADOR'));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'ADMINISTRADOR'));
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'ADMINISTRADOR'));

CREATE POLICY "roles_select" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_gestor(auth.uid()));

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Novo usuário: cria perfil e papel padrão CONSULTA
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome_completo, email, cargo)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome_completo', split_part(NEW.email,'@',1)), NEW.email, NEW.raw_user_meta_data->>'cargo');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'CONSULTA') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CADASTROS
CREATE TABLE public.agentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  matricula text UNIQUE,
  telefone text,
  email text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.orientadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  matricula text UNIQUE,
  telefone text,
  email text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.solicitantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'ORGAO_PUBLICO' CHECK (tipo IN ('ORGAO_PUBLICO','EMPRESA','PESSOA_FISICA','ENTIDADE')),
  documento text,
  telefone text,
  email text,
  endereco text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.escolas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  rede text NOT NULL DEFAULT 'MUNICIPAL' CHECK (rede IN ('MUNICIPAL','ESTADUAL','PARTICULAR','FEDERAL')),
  endereco text,
  bairro text,
  diretor text,
  telefone text,
  email text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  tipo text,
  local text,
  endereco text,
  data_inicio timestamptz NOT NULL,
  data_fim timestamptz,
  publico_estimado integer CHECK (publico_estimado IS NULL OR publico_estimado >= 0),
  status text NOT NULL DEFAULT 'PLANEJADO' CHECK (status IN ('PLANEJADO','CONFIRMADO','EM_ANDAMENTO','CONCLUIDO','CANCELADO')),
  solicitante_id uuid REFERENCES public.solicitantes(id) ON DELETE SET NULL,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE SEQUENCE public.os_numero_seq;
CREATE TABLE public.ordens_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE DEFAULT ('OS-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.os_numero_seq')::text, 5, '0')),
  titulo text NOT NULL,
  descricao text,
  tipo text NOT NULL DEFAULT 'APOIO_EVENTO' CHECK (tipo IN ('APOIO_EVENTO','SINALIZACAO','FISCALIZACAO','EDUCACAO','OUTRO')),
  evento_id uuid REFERENCES public.eventos(id) ON DELETE SET NULL,
  solicitante_id uuid REFERENCES public.solicitantes(id) ON DELETE SET NULL,
  local text,
  data_servico date NOT NULL,
  hora_inicio time,
  hora_fim time,
  prioridade text NOT NULL DEFAULT 'NORMAL' CHECK (prioridade IN ('BAIXA','NORMAL','ALTA','URGENTE')),
  status text NOT NULL DEFAULT 'ABERTA' CHECK (status IN ('ABERTA','EM_EXECUCAO','CONCLUIDA','CANCELADA')),
  observacoes text,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ordem_servico_agentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_servico_id uuid NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  agente_id uuid NOT NULL REFERENCES public.agentes(id) ON DELETE CASCADE,
  funcao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ordem_servico_id, agente_id)
);

CREATE TABLE public.veiculos_abandonados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placa text,
  marca text,
  modelo text,
  cor text,
  endereco text NOT NULL,
  bairro text,
  data_constatacao date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'REGISTRADO' CHECK (status IN ('REGISTRADO','NOTIFICADO','REMOVIDO','ARQUIVADO')),
  observacoes text,
  registrado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.acoes_educativas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  escola_id uuid REFERENCES public.escolas(id) ON DELETE SET NULL,
  orientador_id uuid REFERENCES public.orientadores(id) ON DELETE SET NULL,
  data_acao date NOT NULL,
  publico_alvo text,
  participantes integer CHECK (participantes IS NULL OR participantes >= 0),
  status text NOT NULL DEFAULT 'PLANEJADA' CHECK (status IN ('PLANEJADA','REALIZADA','CANCELADA')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.historico_atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  entidade text NOT NULL,
  entidade_id uuid,
  acao text NOT NULL,
  detalhes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agentes, public.orientadores, public.solicitantes, public.escolas, public.eventos, public.ordens_servico, public.ordem_servico_agentes, public.veiculos_abandonados, public.acoes_educativas TO authenticated;
GRANT SELECT, INSERT ON public.historico_atividades TO authenticated;
GRANT ALL ON public.agentes, public.orientadores, public.solicitantes, public.escolas, public.eventos, public.ordens_servico, public.ordem_servico_agentes, public.veiculos_abandonados, public.acoes_educativas, public.historico_atividades TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.os_numero_seq TO authenticated, service_role;

ALTER TABLE public.agentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orientadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordem_servico_agentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos_abandonados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acoes_educativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_atividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agentes_select" ON public.agentes FOR SELECT TO authenticated USING (true);
CREATE POLICY "agentes_write" ON public.agentes FOR ALL TO authenticated USING (public.is_gestor(auth.uid())) WITH CHECK (public.is_gestor(auth.uid()));
CREATE POLICY "orientadores_select" ON public.orientadores FOR SELECT TO authenticated USING (true);
CREATE POLICY "orientadores_write" ON public.orientadores FOR ALL TO authenticated USING (public.is_gestor(auth.uid())) WITH CHECK (public.is_gestor(auth.uid()));
CREATE POLICY "solicitantes_select" ON public.solicitantes FOR SELECT TO authenticated USING (true);
CREATE POLICY "solicitantes_write" ON public.solicitantes FOR ALL TO authenticated USING (public.is_gestor(auth.uid())) WITH CHECK (public.is_gestor(auth.uid()));
CREATE POLICY "escolas_select" ON public.escolas FOR SELECT TO authenticated USING (true);
CREATE POLICY "escolas_write" ON public.escolas FOR ALL TO authenticated USING (public.is_gestor(auth.uid())) WITH CHECK (public.is_gestor(auth.uid()));
CREATE POLICY "eventos_select" ON public.eventos FOR SELECT TO authenticated USING (true);
CREATE POLICY "eventos_write" ON public.eventos FOR ALL TO authenticated USING (public.is_gestor(auth.uid())) WITH CHECK (public.is_gestor(auth.uid()));
CREATE POLICY "acoes_select" ON public.acoes_educativas FOR SELECT TO authenticated USING (true);
CREATE POLICY "acoes_write" ON public.acoes_educativas FOR ALL TO authenticated USING (public.is_gestor(auth.uid())) WITH CHECK (public.is_gestor(auth.uid()));

CREATE POLICY "os_select" ON public.ordens_servico FOR SELECT TO authenticated USING (true);
CREATE POLICY "os_insert" ON public.ordens_servico FOR INSERT TO authenticated WITH CHECK (public.pode_operar(auth.uid()));
CREATE POLICY "os_update" ON public.ordens_servico FOR UPDATE TO authenticated USING (public.pode_operar(auth.uid())) WITH CHECK (public.pode_operar(auth.uid()));
CREATE POLICY "os_delete" ON public.ordens_servico FOR DELETE TO authenticated USING (public.is_gestor(auth.uid()));

CREATE POLICY "osa_select" ON public.ordem_servico_agentes FOR SELECT TO authenticated USING (true);
CREATE POLICY "osa_write" ON public.ordem_servico_agentes FOR ALL TO authenticated USING (public.pode_operar(auth.uid())) WITH CHECK (public.pode_operar(auth.uid()));

CREATE POLICY "veiculos_select" ON public.veiculos_abandonados FOR SELECT TO authenticated USING (true);
CREATE POLICY "veiculos_insert" ON public.veiculos_abandonados FOR INSERT TO authenticated WITH CHECK (public.pode_operar(auth.uid()));
CREATE POLICY "veiculos_update" ON public.veiculos_abandonados FOR UPDATE TO authenticated USING (public.pode_operar(auth.uid())) WITH CHECK (public.pode_operar(auth.uid()));
CREATE POLICY "veiculos_delete" ON public.veiculos_abandonados FOR DELETE TO authenticated USING (public.is_gestor(auth.uid()));

CREATE POLICY "hist_select" ON public.historico_atividades FOR SELECT TO authenticated USING (public.is_gestor(auth.uid()));
CREATE POLICY "hist_insert" ON public.historico_atividades FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_agentes_upd BEFORE UPDATE ON public.agentes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_orientadores_upd BEFORE UPDATE ON public.orientadores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_solicitantes_upd BEFORE UPDATE ON public.solicitantes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_escolas_upd BEFORE UPDATE ON public.escolas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_eventos_upd BEFORE UPDATE ON public.eventos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_os_upd BEFORE UPDATE ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_veiculos_upd BEFORE UPDATE ON public.veiculos_abandonados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_acoes_upd BEFORE UPDATE ON public.acoes_educativas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();