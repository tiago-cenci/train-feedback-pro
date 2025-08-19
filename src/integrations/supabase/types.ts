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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      corrections: {
        Row: {
          arquivo_url: string | null
          conteudo: string | null
          data_criacao: string | null
          id: string
          personal_id: string
          tipo: Database["public"]["Enums"]["correction_type"]
          video_id: string
        }
        Insert: {
          arquivo_url?: string | null
          conteudo?: string | null
          data_criacao?: string | null
          id?: string
          personal_id: string
          tipo: Database["public"]["Enums"]["correction_type"]
          video_id: string
        }
        Update: {
          arquivo_url?: string | null
          conteudo?: string | null
          data_criacao?: string | null
          id?: string
          personal_id?: string
          tipo?: Database["public"]["Enums"]["correction_type"]
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "corrections_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corrections_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string | null
          descanso: string | null
          id: string
          nome: string
          observacoes: string | null
          ordem: number | null
          repeticoes: string
          series: number
          training_id: string
          updated_at: string | null
          video_demonstracao_url: string | null
        }
        Insert: {
          created_at?: string | null
          descanso?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          ordem?: number | null
          repeticoes: string
          series: number
          training_id: string
          updated_at?: string | null
          video_demonstracao_url?: string | null
        }
        Update: {
          created_at?: string | null
          descanso?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          ordem?: number | null
          repeticoes?: string
          series?: number
          training_id?: string
          updated_at?: string | null
          video_demonstracao_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          nome: string
          role: Database["public"]["Enums"]["user_role"]
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          nome: string
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          anamnese: string | null
          created_at: string | null
          data_inicio: string
          email: string
          fotos_urls: string[] | null
          id: string
          nome: string
          personal_id: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          anamnese?: string | null
          created_at?: string | null
          data_inicio?: string
          email: string
          fotos_urls?: string[] | null
          id?: string
          nome: string
          personal_id: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          anamnese?: string | null
          created_at?: string | null
          data_inicio?: string
          email?: string
          fotos_urls?: string[] | null
          id?: string
          nome?: string
          personal_id?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trainings: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          data_inicial: string
          id: string
          nome: string
          observacoes: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          data_inicial?: string
          id?: string
          nome: string
          observacoes?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          data_inicial?: string
          id?: string
          nome?: string
          observacoes?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trainings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          aluno_id: string
          data_envio: string | null
          exercise_id: string
          id: string
          observacoes: string | null
          video_url: string
        }
        Insert: {
          aluno_id: string
          data_envio?: string | null
          exercise_id: string
          id?: string
          observacoes?: string | null
          video_url: string
        }
        Update: {
          aluno_id?: string
          data_envio?: string | null
          exercise_id?: string
          id?: string
          observacoes?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          aluno_id: string
          created_at: string
          data_fim: string | null
          data_inicio: string
          duracao_minutos: number | null
          finalizado: boolean
          id: string
          observacoes: string | null
          training_id: string
          updated_at: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          duracao_minutos?: number | null
          finalizado?: boolean
          id?: string
          observacoes?: string | null
          training_id: string
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          duracao_minutos?: number | null
          finalizado?: boolean
          id?: string
          observacoes?: string | null
          training_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_sets: {
        Row: {
          carga: number | null
          created_at: string
          exercise_id: string
          id: string
          observacoes: string | null
          repeticoes: number
          serie_numero: number
          updated_at: string
          workout_session_id: string
        }
        Insert: {
          carga?: number | null
          created_at?: string
          exercise_id: string
          id?: string
          observacoes?: string | null
          repeticoes: number
          serie_numero: number
          updated_at?: string
          workout_session_id: string
        }
        Update: {
          carga?: number | null
          created_at?: string
          exercise_id?: string
          id?: string
          observacoes?: string | null
          repeticoes?: number
          serie_numero?: number
          updated_at?: string
          workout_session_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      publish_program: {
        Args: { p_program_id: string }
        Returns: undefined
      }
    }
    Enums: {
      correction_type: "texto" | "foto" | "video"
      user_role: "personal" | "aluno"
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
      correction_type: ["texto", "foto", "video"],
      user_role: ["personal", "aluno"],
    },
  },
} as const
