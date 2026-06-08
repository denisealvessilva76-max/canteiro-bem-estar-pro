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
      alertas_vermelhos: {
        Row: {
          ativo: boolean
          created_at: string
          expira_em: string | null
          id: string
          mensagem: string
          tipo: string
          titulo: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          expira_em?: string | null
          id?: string
          mensagem: string
          tipo?: string
          titulo: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          expira_em?: string | null
          id?: string
          mensagem?: string
          tipo?: string
          titulo?: string
        }
        Relationships: []
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
      ciclo_menstrual: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string
          fluxo: string | null
          id: string
          observacoes: string | null
          sintomas: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          fluxo?: string | null
          id?: string
          observacoes?: string | null
          sintomas?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          fluxo?: string | null
          id?: string
          observacoes?: string | null
          sintomas?: string[] | null
          user_id?: string
        }
        Relationships: []
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
      cupons: {
        Row: {
          codigo: string
          created_at: string
          descricao: string
          expira_em: string | null
          id: string
          marco_tipo: string
          marco_valor: number
          status: string
          usado_em: string | null
          user_id: string
          valor_desconto: number | null
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao: string
          expira_em?: string | null
          id?: string
          marco_tipo: string
          marco_valor: number
          status?: string
          usado_em?: string | null
          user_id: string
          valor_desconto?: number | null
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string
          expira_em?: string | null
          id?: string
          marco_tipo?: string
          marco_valor?: number
          status?: string
          usado_em?: string | null
          user_id?: string
          valor_desconto?: number | null
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
          gps_capturado_em: string | null
          gps_lat: number | null
          gps_lng: number | null
          id: string
          motivo_recusa: string | null
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
          gps_capturado_em?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          motivo_recusa?: string | null
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
          gps_capturado_em?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          motivo_recusa?: string | null
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
      estresse_logs: {
        Row: {
          created_at: string
          id: string
          nivel: number
          observacao: string | null
          semana: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nivel: number
          observacao?: string | null
          semana?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nivel?: number
          observacao?: string | null
          semana?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estresse_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      hidratacao_qr_codes: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          id: string
          localizacao: string
          ml_padrao: number
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          id?: string
          localizacao: string
          ml_padrao?: number
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          id?: string
          localizacao?: string
          ml_padrao?: number
        }
        Relationships: []
      }
      jogo_scores: {
        Row: {
          acertos: number | null
          categoria: string
          created_at: string
          id: string
          jogo: string
          pontos: number
          total: number | null
          user_id: string
        }
        Insert: {
          acertos?: number | null
          categoria: string
          created_at?: string
          id?: string
          jogo: string
          pontos?: number
          total?: number | null
          user_id: string
        }
        Update: {
          acertos?: number | null
          categoria?: string
          created_at?: string
          id?: string
          jogo?: string
          pontos?: number
          total?: number | null
          user_id?: string
        }
        Relationships: []
      }
      odonto_dicas: {
        Row: {
          ativo: boolean
          conteudo: string
          created_at: string
          id: string
          ordem: number
          titulo: string
        }
        Insert: {
          ativo?: boolean
          conteudo: string
          created_at?: string
          id?: string
          ordem?: number
          titulo: string
        }
        Update: {
          ativo?: boolean
          conteudo?: string
          created_at?: string
          id?: string
          ordem?: number
          titulo?: string
        }
        Relationships: []
      }
      odonto_logs: {
        Row: {
          created_at: string
          data: string
          id: string
          periodo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          periodo: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          periodo?: string
          user_id?: string
        }
        Relationships: []
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
      pilulas_dia: {
        Row: {
          ativo: boolean
          categoria: string | null
          created_at: string
          data_publicacao: string
          descricao: string | null
          id: string
          media_url: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          data_publicacao?: string
          descricao?: string | null
          id?: string
          media_url?: string | null
          tipo?: string
          titulo: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          data_publicacao?: string
          descricao?: string | null
          id?: string
          media_url?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      pilulas_views: {
        Row: {
          id: string
          pilula_id: string
          user_id: string
          visto_em: string
        }
        Insert: {
          id?: string
          pilula_id: string
          user_id: string
          visto_em?: string
        }
        Update: {
          id?: string
          pilula_id?: string
          user_id?: string
          visto_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "pilulas_views_pilula_id_fkey"
            columns: ["pilula_id"]
            isOneToOne: false
            referencedRelation: "pilulas_dia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilulas_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          altura: number | null
          avatar_id: number | null
          avatar_url: string | null
          cargo: string | null
          contrato: string | null
          created_at: string
          data_nascimento: string | null
          empreiteira: string | null
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
          avatar_url?: string | null
          cargo?: string | null
          contrato?: string | null
          created_at?: string
          data_nascimento?: string | null
          empreiteira?: string | null
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
          avatar_url?: string | null
          cargo?: string | null
          contrato?: string | null
          created_at?: string
          data_nascimento?: string | null
          empreiteira?: string | null
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
      push_diagnosticos: {
        Row: {
          backend_gravado: string
          created_at: string
          detalhes: Json
          endpoint: string | null
          entrega: string
          id: string
          inscricao_local: string
          permissao: string
          service_worker: string
          suporte: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          backend_gravado: string
          created_at?: string
          detalhes?: Json
          endpoint?: string | null
          entrega: string
          id?: string
          inscricao_local: string
          permissao: string
          service_worker: string
          suporte: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          backend_gravado?: string
          created_at?: string
          detalhes?: Json
          endpoint?: string | null
          entrega?: string
          id?: string
          inscricao_local?: string
          permissao?: string
          service_worker?: string
          suporte?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quiz_obra_perguntas: {
        Row: {
          ativo: boolean
          categoria: string
          correta: number
          created_at: string
          id: string
          opcoes: Json
          pergunta: string
          semana: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string
          correta: number
          created_at?: string
          id?: string
          opcoes: Json
          pergunta: string
          semana?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          correta?: number
          created_at?: string
          id?: string
          opcoes?: Json
          pergunta?: string
          semana?: string
        }
        Relationships: []
      }
      quiz_obra_respostas: {
        Row: {
          acertou: boolean
          id: string
          pergunta_id: string
          respondido_em: string
          resposta: number
          user_id: string
        }
        Insert: {
          acertou: boolean
          id?: string
          pergunta_id: string
          respondido_em?: string
          resposta: number
          user_id: string
        }
        Update: {
          acertou?: boolean
          id?: string
          pergunta_id?: string
          respondido_em?: string
          resposta?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_obra_respostas_pergunta_id_fkey"
            columns: ["pergunta_id"]
            isOneToOne: false
            referencedRelation: "quiz_obra_perguntas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_obra_respostas_user_id_fkey"
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
      reportes_bug: {
        Row: {
          componente: string | null
          created_at: string
          descricao: string
          id: string
          resolvido_em: string | null
          rota: string | null
          screenshot_url: string | null
          severidade: string
          status: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          componente?: string | null
          created_at?: string
          descricao: string
          id?: string
          resolvido_em?: string | null
          rota?: string | null
          screenshot_url?: string | null
          severidade?: string
          status?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          componente?: string | null
          created_at?: string
          descricao?: string
          id?: string
          resolvido_em?: string | null
          rota?: string | null
          screenshot_url?: string | null
          severidade?: string
          status?: string
          user_agent?: string | null
          user_id?: string
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
      secon_chamados: {
        Row: {
          comprovado_em: string | null
          comprovante_url: string | null
          created_at: string
          gps_capturado_em: string | null
          gps_lat: number | null
          gps_lng: number | null
          id: string
          observacoes: string | null
          status: string
          telefone_discado: string
          user_id: string
        }
        Insert: {
          comprovado_em?: string | null
          comprovante_url?: string | null
          created_at?: string
          gps_capturado_em?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          observacoes?: string | null
          status?: string
          telefone_discado?: string
          user_id: string
        }
        Update: {
          comprovado_em?: string | null
          comprovante_url?: string | null
          created_at?: string
          gps_capturado_em?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          observacoes?: string | null
          status?: string
          telefone_discado?: string
          user_id?: string
        }
        Relationships: []
      }
      ubs_clinicas: {
        Row: {
          ativo: boolean
          cidade: string | null
          created_at: string
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          tipo: string
        }
        Insert: {
          ativo?: boolean
          cidade?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          tipo?: string
        }
        Update: {
          ativo?: boolean
          cidade?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          tipo?: string
        }
        Relationships: []
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
      conceder_medalha: {
        Args: { _codigo: string; _user_id: string }
        Returns: undefined
      }
      gerar_codigo_cupom: { Args: never; Returns: string }
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
