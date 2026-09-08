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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      acoes_educativas: {
        Row: {
          created_at: string
          data_acao: string
          descricao: string | null
          escola_id: string | null
          id: string
          orientador_id: string | null
          participantes: number | null
          publico_alvo: string | null
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_acao: string
          descricao?: string | null
          escola_id?: string | null
          id?: string
          orientador_id?: string | null
          participantes?: number | null
          publico_alvo?: string | null
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_acao?: string
          descricao?: string | null
          escola_id?: string | null
          id?: string
          orientador_id?: string | null
          participantes?: number | null
          publico_alvo?: string | null
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
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
          local: string | null
          mapa_imagem: string | null
          natureza: string | null
          numero: string
          observacoes: string | null
          percurso: Json | null
          prioridade: string
          remetente: string | null
          sequencial: number | null
          solicitante_id: string | null
          status: string
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
          local?: string | null
          mapa_imagem?: string | null
          natureza?: string | null
          numero: string
          observacoes?: string | null
          percurso?: Json | null
          prioridade?: string
          remetente?: string | null
          sequencial?: number | null
          solicitante_id?: string | null
          status?: string
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
          local?: string | null
          mapa_imagem?: string | null
          natureza?: string | null
          numero?: string
          observacoes?: string | null
          percurso?: Json | null
          prioridade?: string
          remetente?: string | null
          sequencial?: number | null
          solicitante_id?: string | null
          status?: string
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
      veiculos_abandonados: {
        Row: {
          bairro: string | null
          cor: string | null
          created_at: string
          data_constatacao: string
          endereco: string
          id: string
          marca: string | null
          modelo: string | null
          observacoes: string | null
          placa: string | null
          registrado_por: string | null
          status: string
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cor?: string | null
          created_at?: string
          data_constatacao?: string
          endereco: string
          id?: string
          marca?: string | null
          modelo?: string | null
          observacoes?: string | null
          placa?: string | null
          registrado_por?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cor?: string | null
          created_at?: string
          data_constatacao?: string
          endereco?: string
          id?: string
          marca?: string | null
          modelo?: string | null
          observacoes?: string | null
          placa?: string | null
          registrado_por?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_gestor: { Args: { _user_id: string }; Returns: boolean }
      pode_operar: { Args: { _user_id: string }; Returns: boolean }
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
