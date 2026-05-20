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
      alertas: {
        Row: {
          created_at: string
          id: string
          mensagem: string
          nivel_urgencia: Database["public"]["Enums"]["nivel_urgencia"]
          resolvido: boolean
          resolvido_em: string | null
          resolvido_por: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mensagem: string
          nivel_urgencia?: Database["public"]["Enums"]["nivel_urgencia"]
          resolvido?: boolean
          resolvido_em?: string | null
          resolvido_por?: string | null
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mensagem?: string
          nivel_urgencia?: Database["public"]["Enums"]["nivel_urgencia"]
          resolvido?: boolean
          resolvido_em?: string | null
          resolvido_por?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alongamento_logs: {
        Row: {
          created_at: string
          data: string
          duracao_segundos: number | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          duracao_segundos?: number | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          duracao_segundos?: number | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alongamento_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      avisos: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_aviso"]
          conteudo: string
          created_at: string
          created_by: string | null
          id: string
          imagem_url: string | null
          publicado: boolean
          titulo: string
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["categoria_aviso"]
          conteudo: string
          created_at?: string
          created_by?: string | null
          id?: string
          imagem_url?: string | null
          publicado?: boolean
          titulo: string
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_aviso"]
          conteudo?: string
          created_at?: string
          created_by?: string | null
          id?: string
          imagem_url?: string | null
          publicado?: boolean
          titulo?: string
        }
        Relationships: []
      }
      avisos_lidos: {
        Row: {
          aviso_id: string
          id: string
          lido_em: string
          user_id: string
        }
        Insert: {
          aviso_id: string
          id?: string
          lido_em?: string
          user_id: string
        }
        Update: {
          aviso_id?: string
          id?: string
          lido_em?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avisos_lidos_aviso_id_fkey"
            columns: ["aviso_id"]
            isOneToOne: false
            referencedRelation: "avisos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avisos_lidos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_diario: {
        Row: {
          created_at: string
          data: string
          humor_icone: string
          humor_score: number
          id: string
          motivo_texto: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          humor_icone: string
          humor_score: number
          id?: string
          motivo_texto?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          humor_icone?: string
          humor_score?: number
          id?: string
          motivo_texto?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_diario_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conquistas: {
        Row: {
          codigo: string
          descricao: string | null
          icone: string | null
          id: string
          pontos: number | null
          titulo: string
        }
        Insert: {
          codigo: string
          descricao?: string | null
          icone?: string | null
          id?: string
          pontos?: number | null
          titulo: string
        }
        Update: {
          codigo?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          pontos?: number | null
          titulo?: string
        }
        Relationships: []
      }
      desafio_checkins: {
        Row: {
          created_at: string
          data: string
          desafio_id: string
          dificuldade: string | null
          foto_url: string | null
          id: string
          progresso_id: string
          user_id: string
          validado: boolean | null
          validado_em: string | null
          validado_por: string | null
        }
        Insert: {
          created_at?: string
          data?: string
          desafio_id: string
          dificuldade?: string | null
          foto_url?: string | null
          id?: string
          progresso_id: string
          user_id: string
          validado?: boolean | null
          validado_em?: string | null
          validado_por?: string | null
        }
        Update: {
          created_at?: string
          data?: string
          desafio_id?: string
          dificuldade?: string | null
          foto_url?: string | null
          id?: string
          progresso_id?: string
          user_id?: string
          validado?: boolean | null
          validado_em?: string | null
          validado_por?: string | null
        }
        Relationships: []
      }
      desafios: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          dificuldade: string | null
          duracao_dias: number
          id: string
          meta: string
          pontos_recompensa: number
          titulo: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          dificuldade?: string | null
          duracao_dias?: number
          id?: string
          meta: string
          pontos_recompensa?: number
          titulo: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          dificuldade?: string | null
          duracao_dias?: number
          id?: string
          meta?: string
          pontos_recompensa?: number
          titulo?: string
        }
        Relationships: []
      }
      hidratacao_logs: {
        Row: {
          cor_urina: number | null
          created_at: string
          data: string
          id: string
          ml_consumidos: number
          user_id: string
        }
        Insert: {
          cor_urina?: number | null
          created_at?: string
          data?: string
          id?: string
          ml_consumidos: number
          user_id: string
        }
        Update: {
          cor_urina?: number | null
          created_at?: string
          data?: string
          id?: string
          ml_consumidos?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hidratacao_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parametros: {
        Row: {
          chave: string
          descricao: string | null
          updated_at: string
          valor: Json
        }
        Insert: {
          chave: string
          descricao?: string | null
          updated_at?: string
          valor: Json
        }
        Update: {
          chave?: string
          descricao?: string | null
          updated_at?: string
          valor?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          altura: number | null
          avatar_id: number | null
          cargo: string | null
          created_at: string
          exposicao_sol: boolean | null
          grupo_risco: string | null
          id: string
          matricula: string
          nome: string
          ofensiva_dias: number
          peso: number | null
          pontos_acumulados: number
          primeiro_acesso: boolean
          telefone: string | null
          turno: Database["public"]["Enums"]["turno"]
          ultimo_checkin: string | null
          updated_at: string
        }
        Insert: {
          altura?: number | null
          avatar_id?: number | null
          cargo?: string | null
          created_at?: string
          exposicao_sol?: boolean | null
          grupo_risco?: string | null
          id: string
          matricula: string
          nome: string
          ofensiva_dias?: number
          peso?: number | null
          pontos_acumulados?: number
          primeiro_acesso?: boolean
          telefone?: string | null
          turno?: Database["public"]["Enums"]["turno"]
          ultimo_checkin?: string | null
          updated_at?: string
        }
        Update: {
          altura?: number | null
          avatar_id?: number | null
          cargo?: string | null
          created_at?: string
          exposicao_sol?: boolean | null
          grupo_risco?: string | null
          id?: string
          matricula?: string
          nome?: string
          ofensiva_dias?: number
          peso?: number | null
          pontos_acumulados?: number
          primeiro_acesso?: boolean
          telefone?: string | null
          turno?: Database["public"]["Enums"]["turno"]
          ultimo_checkin?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      progresso_desafios: {
        Row: {
          concluido_em: string | null
          desafio_id: string
          foto_url: string | null
          foto_validada: boolean | null
          id: string
          iniciado_em: string
          observacoes: string | null
          status: Database["public"]["Enums"]["status_desafio"]
          user_id: string
        }
        Insert: {
          concluido_em?: string | null
          desafio_id: string
          foto_url?: string | null
          foto_validada?: boolean | null
          id?: string
          iniciado_em?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_desafio"]
          user_id: string
        }
        Update: {
          concluido_em?: string | null
          desafio_id?: string
          foto_url?: string | null
          foto_validada?: boolean | null
          id?: string
          iniciado_em?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_desafio"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_desafios_desafio_id_fkey"
            columns: ["desafio_id"]
            isOneToOne: false
            referencedRelation: "desafios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_desafios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recompensas: {
        Row: {
          ativo: boolean
          created_at: string
          custo_pontos: number
          descricao: string | null
          estoque: number | null
          id: string
          imagem_url: string | null
          titulo: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          custo_pontos: number
          descricao?: string | null
          estoque?: number | null
          id?: string
          imagem_url?: string | null
          titulo: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          custo_pontos?: number
          descricao?: string | null
          estoque?: number | null
          id?: string
          imagem_url?: string | null
          titulo?: string
        }
        Relationships: []
      }
      resgates: {
        Row: {
          created_at: string
          id: string
          pontos_gastos: number
          recompensa_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pontos_gastos: number
          recompensa_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pontos_gastos?: number
          recompensa_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resgates_recompensa_id_fkey"
            columns: ["recompensa_id"]
            isOneToOne: false
            referencedRelation: "recompensas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resgates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saude_logs: {
        Row: {
          classificacao_pressao:
            | Database["public"]["Enums"]["classificacao_pressao"]
            | null
          created_at: string
          data: string
          id: string
          outros_sintomas: string | null
          pressao_diastolica: number | null
          pressao_sistolica: number | null
          sintomas: string[] | null
          user_id: string
        }
        Insert: {
          classificacao_pressao?:
            | Database["public"]["Enums"]["classificacao_pressao"]
            | null
          created_at?: string
          data?: string
          id?: string
          outros_sintomas?: string | null
          pressao_diastolica?: number | null
          pressao_sistolica?: number | null
          sintomas?: string[] | null
          user_id: string
        }
        Update: {
          classificacao_pressao?:
            | Database["public"]["Enums"]["classificacao_pressao"]
            | null
          created_at?: string
          data?: string
          id?: string
          outros_sintomas?: string | null
          pressao_diastolica?: number | null
          pressao_sistolica?: number | null
          sintomas?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saude_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_conquistas: {
        Row: {
          conquista_id: string
          conquistado_em: string
          id: string
          user_id: string
        }
        Insert: {
          conquista_id: string
          conquistado_em?: string
          id?: string
          user_id: string
        }
        Update: {
          conquista_id?: string
          conquistado_em?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_conquistas_conquista_id_fkey"
            columns: ["conquista_id"]
            isOneToOne: false
            referencedRelation: "conquistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_conquistas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "worker"
      categoria_aviso: "informativo" | "saude" | "lembrete" | "urgente"
      classificacao_pressao: "normal" | "alerta" | "alta" | "baixa"
      nivel_urgencia: "info" | "atencao" | "critico"
      status_desafio: "disponivel" | "em_andamento" | "concluido" | "abandonado"
      turno: "diurno" | "noturno"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "worker"],
      categoria_aviso: ["informativo", "saude", "lembrete", "urgente"],
      classificacao_pressao: ["normal", "alerta", "alta", "baixa"],
      nivel_urgencia: ["info", "atencao", "critico"],
      status_desafio: ["disponivel", "em_andamento", "concluido", "abandonado"],
      turno: ["diurno", "noturno"],
    },
  },
} as const
