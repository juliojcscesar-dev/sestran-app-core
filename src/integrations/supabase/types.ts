export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      acao_educativa_historico: {
        Row: {
          acao: string
          acao_educativa_id: string
          alteracoes: Json | null
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          acao: string
          acao_educativa_id: string
          alteracoes?: Json | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          acao?: string
          acao_educativa_id?: string
          alteracoes?: Json | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acao_educativa_historico_acao_educativa_id_fkey"
            columns: ["acao_educativa_id"]
            isOneToOne: false
            referencedRelation: "acoes_educativas"
            referencedColumns: ["id"]
          },
        ]
      }
      acoes_educativas: {
        Row: {
          arquivada: boolean
          arquivada_em: string | null
          arquivada_por: string | null
          bairro: string | null
          categoria: string
          created_at: string
          criado_por: string | null
          data_acao: string
          descricao: string | null
          endereco: string | null
          equipe: string | null
          escola_id: string | null
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          local: string | null
          numero_endereco: string | null
          observacoes: string | null
          orientador_id: string | null
          participantes: number | null
          publico_alvo: string | null
          relatorio_imagens: Json
          relatorio_texto: string | null
          status: string
          status_manual: boolean
          tema_id: string | null
          tipo_atividade: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          arquivada?: boolean
          arquivada_em?: string | null
          arquivada_por?: string | null
          bairro?: string | null
          categoria?: string
          created_at?: string
          criado_por?: string | null
          data_acao: string
          descricao?: string | null
          endereco?: string | null
          equipe?: string | null
          escola_id?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          local?: string | null
          numero_endereco?: string | null
          observacoes?: string | null
          orientador_id?: string | null
          participantes?: number | null
          publico_alvo?: string | null
          relatorio_imagens?: Json
          relatorio_texto?: string | null
          status?: string
          status_manual?: boolean
          tema_id?: string | null
          tipo_atividade?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          arquivada?: boolean
          arquivada_em?: string | null
          arquivada_por?: string | null
          bairro?: string | null
          categoria?: string
          created_at?: string
          criado_por?: string | null
          data_acao?: string
          descricao?: string | null
          endereco?: string | null
          equipe?: string | null
          escola_id?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          local?: string | null
          numero_endereco?: string | null
          observacoes?: string | null
          orientador_id?: string | null
          participantes?: number | null
          publico_alvo?: string | null
          relatorio_imagens?: Json
          relatorio_texto?: string | null
          status?: string
          status_manual?: boolean
          tema_id?: string | null
          tipo_atividade?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acoes_categoria_catalogo_fkey"
            columns: ["categoria"]
            isOneToOne: false
            referencedRelation: "categorias_educativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acoes_educativas_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acoes_educativas_orientador_id_fkey"
            columns: ["orientador_id"]
            isOneToOne: false
            referencedRelation: "orientadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acoes_educativas_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "temas_educativos"
            referencedColumns: ["id"]
          },
        ]
      }
      agentes: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          id: string
          matricula: string | null
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          matricula?: string | null
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          matricula?: string | null
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bairros: {
        Row: {
          ativo: boolean
          atualizado_em: string
          codigo_oficial: string | null
          created_at: string
          fonte: string
          fonte_url: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          codigo_oficial?: string | null
          created_at?: string
          fonte: string
          fonte_url?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          codigo_oficial?: string | null
          created_at?: string
          fonte?: string
          fonte_url?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      categorias_educativas: {
        Row: {
          ativo: boolean
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          id?: string
          nome?: string
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          chave: string
          updated_at: string
          valor: string | null
        }
        Insert: {
          chave: string
          updated_at?: string
          valor?: string | null
        }
        Update: {
          chave?: string
          updated_at?: string
          valor?: string | null
        }
        Relationships: []
      }
      credenciais_historico: {
        Row: {
          cid: string | null
          criado_em: string
          determinacao: string | null
          documento: string | null
          grupo: string
          id: number
          nascimento: string | null
          nome: string | null
          numero: number
          observacoes: string | null
          situacao: string | null
          telefone: string | null
          validade: string | null
          validade_indeterminada: boolean
        }
        Insert: {
          cid?: string | null
          criado_em?: string
          determinacao?: string | null
          documento?: string | null
          grupo: string
          id?: never
          nascimento?: string | null
          nome?: string | null
          numero: number
          observacoes?: string | null
          situacao?: string | null
          telefone?: string | null
          validade?: string | null
          validade_indeterminada?: boolean
        }
        Update: {
          cid?: string | null
          criado_em?: string
          determinacao?: string | null
          documento?: string | null
          grupo?: string
          id?: never
          nascimento?: string | null
          nome?: string | null
          numero?: number
          observacoes?: string | null
          situacao?: string | null
          telefone?: string | null
          validade?: string | null
          validade_indeterminada?: boolean
        }
        Relationships: []
      }
      credenciais_vagas: {
        Row: {
          atualizado_em: string
          bairro: string | null
          checklist: Json
          conferente: string | null
          criado_em: string
          criado_por: string | null
          data_conferencia: string | null
          data_emissao: string
          data_validade: string | null
          endereco: string | null
          id: string
          nascimento: string | null
          nome: string
          numero: string | null
          numero_documento: string
          numero_registro: string | null
          observacoes: string | null
          permitir_sem_checklist: boolean
          telefone: string | null
          tempo_validade: string | null
          tipo: string
          tipo_documento: string
          validade_manual: boolean
        }
        Insert: {
          atualizado_em?: string
          bairro?: string | null
          checklist?: Json
          conferente?: string | null
          criado_em?: string
          criado_por?: string | null
          data_conferencia?: string | null
          data_emissao?: string
          data_validade?: string | null
          endereco?: string | null
          id?: string
          nascimento?: string | null
          nome: string
          numero?: string | null
          numero_documento: string
          numero_registro?: string | null
          observacoes?: string | null
          permitir_sem_checklist?: boolean
          telefone?: string | null
          tempo_validade?: string | null
          tipo: string
          tipo_documento?: string
          validade_manual?: boolean
        }
        Update: {
          atualizado_em?: string
          bairro?: string | null
          checklist?: Json
          conferente?: string | null
          criado_em?: string
          criado_por?: string | null
          data_conferencia?: string | null
          data_emissao?: string
          data_validade?: string | null
          endereco?: string | null
          id?: string
          nascimento?: string | null
          nome?: string
          numero?: string | null
          numero_documento?: string
          numero_registro?: string | null
          observacoes?: string | null
          permitir_sem_checklist?: boolean
          telefone?: string | null
          tempo_validade?: string | null
          tipo?: string
          tipo_documento?: string
          validade_manual?: boolean
        }
        Relationships: []
      }
      escala_agentes_estado: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          dados: Json
          id: number
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          dados: Json
          id?: number
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          dados?: Json
          id?: number
        }
        Relationships: []
      }
      escolas: {
        Row: {
          ativo: boolean
          bairro: string | null
          created_at: string
          diretor: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          rede: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          created_at?: string
          diretor?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          rede?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          created_at?: string
          diretor?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          rede?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      eventos: {
        Row: {
          ativo: boolean
          created_at: string
          criado_por: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          endereco: string | null
          id: string
          local: string | null
          publico_estimado: number | null
          solicitante_id: string | null
          status: string
          tipo: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          criado_por?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          endereco?: string | null
          id?: string
          local?: string | null
          publico_estimado?: number | null
          solicitante_id?: string | null
          status?: string
          tipo?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          criado_por?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          endereco?: string | null
          id?: string
          local?: string | null
          publico_estimado?: number | null
          solicitante_id?: string | null
          status?: string
          tipo?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "solicitantes"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_atividades: {
        Row: {
          acao: string
          created_at: string
          detalhes: Json | null
          entidade: string
          entidade_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          detalhes?: Json | null
          entidade: string
          entidade_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          detalhes?: Json | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      locais: {
        Row: {
          ativo: boolean
          bairro: string | null
          created_at: string
          endereco: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      ordem_servico_agentes: {
        Row: {
          agente_id: string
          created_at: string
          funcao: string | null
          hora_chegada: string | null
          id: string
          observacao: string | null
          ordem_servico_id: string
        }
        Insert: {
          agente_id: string
          created_at?: string
          funcao?: string | null
          hora_chegada?: string | null
          id?: string
          observacao?: string | null
          ordem_servico_id: string
        }
        Update: {
          agente_id?: string
          created_at?: string
          funcao?: string | null
          hora_chegada?: string | null
          id?: string
          observacao?: string | null
          ordem_servico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordem_servico_agentes_agente_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "agentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordem_servico_agentes_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      ordem_servico_historico: {
        Row: {
          acao: string
          alteracoes: Json | null
          created_at: string
          id: string
          ordem_servico_id: string
          user_id: string | null
        }
        Insert: {
          acao: string
          alteracoes?: Json | null
          created_at?: string
          id?: string
          ordem_servico_id: string
          user_id?: string | null
        }
        Update: {
          acao?: string
          alteracoes?: Json | null
          created_at?: string
          id?: string
          ordem_servico_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordem_servico_historico_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      ordem_servico_interdicoes: {
        Row: {
          created_at: string
          geometria: Json | null
          id: string
          observacao: string | null
          ordem_servico_id: string
          rua: string
          trecho_final: string | null
          trecho_inicial: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          geometria?: Json | null
          id?: string
          observacao?: string | null
          ordem_servico_id: string
          rua: string
          trecho_final?: string | null
          trecho_inicial?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          geometria?: Json | null
          id?: string
          observacao?: string | null
          ordem_servico_id?: string
          rua?: string
          trecho_final?: string | null
          trecho_inicial?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordem_servico_interdicoes_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      ordem_servico_orientadores: {
        Row: {
          created_at: string
          id: string
          observacao: string | null
          ordem_servico_id: string
          orientador_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          observacao?: string | null
          ordem_servico_id: string
          orientador_id: string
        }
        Update: {
          created_at?: string
          id?: string
          observacao?: string | null
          ordem_servico_id?: string
          orientador_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordem_servico_orientadores_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordem_servico_orientadores_orientador_id_fkey"
            columns: ["orientador_id"]
            isOneToOne: false
            referencedRelation: "orientadores"
            referencedColumns: ["id"]
          },
        ]
      }
      ordem_servico_servicos: {
        Row: {
          created_at: string
          detalhe: string | null
          id: string
          ordem_servico_id: string
          tipo_servico_id: string
        }
        Insert: {
          created_at?: string
          detalhe?: string | null
          id?: string
          ordem_servico_id: string
          tipo_servico_id: string
        }
        Update: {
          created_at?: string
          detalhe?: string | null
          id?: string
          ordem_servico_id?: string
          tipo_servico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordem_servico_servicos_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordem_servico_servicos_tipo_servico_id_fkey"
            columns: ["tipo_servico_id"]
            isOneToOne: false
            referencedRelation: "tipos_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          ano: number
          arquivada: boolean
          arquivada_em: string | null
          arquivada_por: string | null
          created_at: string
          criado_por: string | null
          data_emissao: string
          data_servico: string
          descricao: string | null
          destinatario: string | null
          evento_id: string | null
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          ipm: string | null
          ipm_respondido: boolean
          local: string | null
          mapa_imagem: string | null
          natureza: string | null
          numero: string
          observacoes: string | null
          paginas_extras: Json
          percurso: Json | null
          prioridade: string
          relatorio_imagens: Json
          relatorio_texto: string | null
          remetente: string | null
          responsavel: string | null
          sequencial: number | null
          solicitante_id: string | null
          status: string
          status_manual: boolean
          telefone: string | null
          tipo: string
          titulo: string | null
          trajeto: string | null
          updated_at: string
        }
        Insert: {
          ano?: number
          arquivada?: boolean
          arquivada_em?: string | null
          arquivada_por?: string | null
          created_at?: string
          criado_por?: string | null
          data_emissao?: string
          data_servico: string
          descricao?: string | null
          destinatario?: string | null
          evento_id?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          ipm?: string | null
          ipm_respondido?: boolean
          local?: string | null
          mapa_imagem?: string | null
          natureza?: string | null
          numero: string
          observacoes?: string | null
          paginas_extras?: Json
          percurso?: Json | null
          prioridade?: string
          relatorio_imagens?: Json
          relatorio_texto?: string | null
          remetente?: string | null
          responsavel?: string | null
          sequencial?: number | null
          solicitante_id?: string | null
          status?: string
          status_manual?: boolean
          telefone?: string | null
          tipo?: string
          titulo?: string | null
          trajeto?: string | null
          updated_at?: string
        }
        Update: {
          ano?: number
          arquivada?: boolean
          arquivada_em?: string | null
          arquivada_por?: string | null
          created_at?: string
          criado_por?: string | null
          data_emissao?: string
          data_servico?: string
          descricao?: string | null
          destinatario?: string | null
          evento_id?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          ipm?: string | null
          ipm_respondido?: boolean
          local?: string | null
          mapa_imagem?: string | null
          natureza?: string | null
          numero?: string
          observacoes?: string | null
          paginas_extras?: Json
          percurso?: Json | null
          prioridade?: string
          relatorio_imagens?: Json
          relatorio_texto?: string | null
          remetente?: string | null
          responsavel?: string | null
          sequencial?: number | null
          solicitante_id?: string | null
          status?: string
          status_manual?: boolean
          telefone?: string | null
          tipo?: string
          titulo?: string | null
          trajeto?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "solicitantes"
            referencedColumns: ["id"]
          },
        ]
      }
      orientadores: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          id: string
          matricula: string | null
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          matricula?: string | null
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          matricula?: string | null
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      os_contador: {
        Row: {
          ano: number
          ultimo: number
        }
        Insert: {
          ano: number
          ultimo?: number
        }
        Update: {
          ano?: number
          ultimo?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          cargo: string | null
          created_at: string
          email: string | null
          id: string
          nome_completo: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          cargo?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome_completo: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          cargo?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome_completo?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ruas: {
        Row: {
          ativo: boolean
          atualizado_em: string
          bairro_id: string | null
          codigo_oficial: string | null
          created_at: string
          fonte: string
          fonte_url: string | null
          geometria: Json | null
          id: string
          nome: string
          nome_completo: string
          tipo: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          bairro_id?: string | null
          codigo_oficial?: string | null
          created_at?: string
          fonte: string
          fonte_url?: string | null
          geometria?: Json | null
          id?: string
          nome: string
          nome_completo: string
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          bairro_id?: string | null
          codigo_oficial?: string | null
          created_at?: string
          fonte?: string
          fonte_url?: string | null
          geometria?: Json | null
          id?: string
          nome?: string
          nome_completo?: string
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ruas_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "bairros"
            referencedColumns: ["id"]
          },
        ]
      }
      sinalizacao_os: {
        Row: {
          atualizado_em: string
          cargo: string | null
          chefe_imediato: string | null
          criado_em: string
          criado_por: string | null
          data: string
          endereco: string
          fonte_tamanho: number
          funcionario: string | null
          id: string
          imagens: Json
          natureza: string
          numero: string
          numero_pedido: string | null
          observacao: string | null
          pedido: string
          preenchido: string | null
          servico: string
          status: string
        }
        Insert: {
          atualizado_em?: string
          cargo?: string | null
          chefe_imediato?: string | null
          criado_em?: string
          criado_por?: string | null
          data?: string
          endereco: string
          fonte_tamanho?: number
          funcionario?: string | null
          id?: string
          imagens?: Json
          natureza: string
          numero: string
          numero_pedido?: string | null
          observacao?: string | null
          pedido: string
          preenchido?: string | null
          servico: string
          status?: string
        }
        Update: {
          atualizado_em?: string
          cargo?: string | null
          chefe_imediato?: string | null
          criado_em?: string
          criado_por?: string | null
          data?: string
          endereco?: string
          fonte_tamanho?: number
          funcionario?: string | null
          id?: string
          imagens?: Json
          natureza?: string
          numero?: string
          numero_pedido?: string | null
          observacao?: string | null
          pedido?: string
          preenchido?: string | null
          servico?: string
          status?: string
        }
        Relationships: []
      }
      situacoes_veiculo: {
        Row: {
          ativo: boolean
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      solicitantes: {
        Row: {
          ativo: boolean
          created_at: string
          documento: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          documento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          documento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      temas_educativos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      tipos_servico: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_module_permissions: {
        Row: {
          atualizado_por: string | null
          modulo: string
          nivel: string
          pode_backup: boolean
          pode_excluir: boolean
          pode_relatorio: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          atualizado_por?: string | null
          modulo: string
          nivel?: string
          pode_backup?: boolean
          pode_excluir?: boolean
          pode_relatorio?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          atualizado_por?: string | null
          modulo?: string
          nivel?: string
          pode_backup?: boolean
          pode_excluir?: boolean
          pode_relatorio?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      veiculo_fotos: {
        Row: {
          caminho: string
          created_at: string
          descricao: string | null
          id: string
          tamanho: number
          url: string
          veiculo_id: string
        }
        Insert: {
          caminho: string
          created_at?: string
          descricao?: string | null
          id?: string
          tamanho?: number
          url: string
          veiculo_id: string
        }
        Update: {
          caminho?: string
          created_at?: string
          descricao?: string | null
          id?: string
          tamanho?: number
          url?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "veiculo_fotos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos_abandonados"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculo_historico: {
        Row: {
          acao: string
          alteracoes: Json | null
          created_at: string
          id: string
          user_id: string | null
          veiculo_id: string
        }
        Insert: {
          acao: string
          alteracoes?: Json | null
          created_at?: string
          id?: string
          user_id?: string | null
          veiculo_id: string
        }
        Update: {
          acao?: string
          alteracoes?: Json | null
          created_at?: string
          id?: string
          user_id?: string | null
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "veiculo_historico_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos_abandonados"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculos_abandonados: {
        Row: {
          arquivado: boolean
          arquivado_em: string | null
          arquivado_por: string | null
          bairro: string | null
          bairro_id: string | null
          chassi: string | null
          cor: string | null
          created_at: string
          data_constatacao: string
          data_notificacao: string | null
          data_recolhimento: string | null
          data_retirada: string | null
          data_verificacao: string | null
          endereco: string
          id: string
          latitude: number | null
          longitude: number | null
          marca: string | null
          modelo: string | null
          numero_denuncia: string | null
          observacoes: string | null
          placa: string | null
          prazo_recolhimento: string | null
          registrado_por: string | null
          rua_id: string | null
          situacao: string | null
          status: string
          tipo_denuncia: string
          updated_at: string
        }
        Insert: {
          arquivado?: boolean
          arquivado_em?: string | null
          arquivado_por?: string | null
          bairro?: string | null
          bairro_id?: string | null
          chassi?: string | null
          cor?: string | null
          created_at?: string
          data_constatacao?: string
          data_notificacao?: string | null
          data_recolhimento?: string | null
          data_retirada?: string | null
          data_verificacao?: string | null
          endereco: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          marca?: string | null
          modelo?: string | null
          numero_denuncia?: string | null
          observacoes?: string | null
          placa?: string | null
          prazo_recolhimento?: string | null
          registrado_por?: string | null
          rua_id?: string | null
          situacao?: string | null
          status?: string
          tipo_denuncia?: string
          updated_at?: string
        }
        Update: {
          arquivado?: boolean
          arquivado_em?: string | null
          arquivado_por?: string | null
          bairro?: string | null
          bairro_id?: string | null
          chassi?: string | null
          cor?: string | null
          created_at?: string
          data_constatacao?: string
          data_notificacao?: string | null
          data_recolhimento?: string | null
          data_retirada?: string | null
          data_verificacao?: string | null
          endereco?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          marca?: string | null
          modelo?: string | null
          numero_denuncia?: string | null
          observacoes?: string | null
          placa?: string | null
          prazo_recolhimento?: string | null
          registrado_por?: string | null
          rua_id?: string | null
          situacao?: string | null
          status?: string
          tipo_denuncia?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_abandonados_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "bairros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veiculos_abandonados_rua_id_fkey"
            columns: ["rua_id"]
            isOneToOne: false
            referencedRelation: "ruas"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculos_recolhidos: {
        Row: {
          agente: string | null
          atualizado_em: string
          categoria: string | null
          chassi: string | null
          checklist: Json
          cor: string | null
          criado_em: string
          criado_por: string | null
          data_notificacao: string | null
          data_recolhimento: string
          data_vistoria: string | null
          documento: string | null
          endereco: string | null
          hora_recolhimento: string | null
          id: string
          local_encontrado: string | null
          marca: string
          modelo: string
          motivo: string | null
          numero_documento: string | null
          obs_vistoria: string | null
          observacoes: string | null
          observacoes_imagens: Json
          placa: string | null
          proprietario: string | null
          situacao: string
          telefone: string | null
          tipo_documento: string | null
          vistoriador: string | null
        }
        Insert: {
          agente?: string | null
          atualizado_em?: string
          categoria?: string | null
          chassi?: string | null
          checklist?: Json
          cor?: string | null
          criado_em?: string
          criado_por?: string | null
          data_notificacao?: string | null
          data_recolhimento: string
          data_vistoria?: string | null
          documento?: string | null
          endereco?: string | null
          hora_recolhimento?: string | null
          id?: string
          local_encontrado?: string | null
          marca: string
          modelo: string
          motivo?: string | null
          numero_documento?: string | null
          obs_vistoria?: string | null
          observacoes?: string | null
          observacoes_imagens?: Json
          placa?: string | null
          proprietario?: string | null
          situacao?: string
          telefone?: string | null
          tipo_documento?: string | null
          vistoriador?: string | null
        }
        Update: {
          agente?: string | null
          atualizado_em?: string
          categoria?: string | null
          chassi?: string | null
          checklist?: Json
          cor?: string | null
          criado_em?: string
          criado_por?: string | null
          data_notificacao?: string | null
          data_recolhimento?: string
          data_vistoria?: string | null
          documento?: string | null
          endereco?: string | null
          hora_recolhimento?: string | null
          id?: string
          local_encontrado?: string | null
          marca?: string
          modelo?: string
          motivo?: string | null
          numero_documento?: string | null
          obs_vistoria?: string | null
          observacoes?: string | null
          observacoes_imagens?: Json
          placa?: string | null
          proprietario?: string | null
          situacao?: string
          telefone?: string | null
          tipo_documento?: string | null
          vistoriador?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acesso_modulo: {
        Args: { _acao?: string; _modulo: string; _user_id: string }
        Returns: boolean
      }
      atualizar_situacoes_automaticas: { Args: never; Returns: undefined }
      definir_acesso_modulo:
        | {
            Args: {
              _modulo: string
              _nivel: string
              _pode_excluir: boolean
              _user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              _modulo: string
              _nivel: string
              _pode_excluir: boolean
              _pode_relatorio: boolean
              _user_id: string
            }
            Returns: undefined
          }
      definir_backup_modulo: {
        Args: { _modulo: string; _pode_backup: boolean; _user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_gestor: { Args: { _user_id: string }; Returns: boolean }
      painel_dados: {
        Args: {
          _edu_fim: string
          _edu_inicio: string
          _hoje: string
          _os_fim: string
          _os_inicio: string
        }
        Returns: Json
      }
      pode_operar: { Args: { _user_id: string }; Returns: boolean }
      resumo_alteracoes_hist: { Args: { alteracoes: Json }; Returns: Json }
      resumo_valor_hist: { Args: { v: Json }; Returns: string }
      situacao_por_dia: {
        Args: { _concluida: string; _data: string }
        Returns: string
      }
      situacao_por_horario: {
        Args: { _concluida: string; _data: string; _fim: string; _ini: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "ADMINISTRADOR" | "GESTOR" | "OPERADOR" | "CONSULTA"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["ADMINISTRADOR", "GESTOR", "OPERADOR", "CONSULTA"],
    },
  },
} as const
