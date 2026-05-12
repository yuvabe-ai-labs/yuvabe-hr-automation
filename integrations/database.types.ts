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
      applications: {
        Row: {
          candidate_email: string | null
          candidate_id: string | null
          candidate_location: string | null
          candidate_name: string | null
          candidate_years_of_experience: number | null
          cover_letter: string | null
          id: string
          job_code: string | null
          job_id: string | null
          match_breakdown: Json | null
          match_score: number | null
          match_summary: string | null
          received_at: string | null
          resume_url: string | null
          status: string | null
        }
        Insert: {
          candidate_email?: string | null
          candidate_id?: string | null
          candidate_location?: string | null
          candidate_name?: string | null
          candidate_years_of_experience?: number | null
          cover_letter?: string | null
          id: string
          job_code?: string | null
          job_id?: string | null
          match_breakdown?: Json | null
          match_score?: number | null
          match_summary?: string | null
          received_at?: string | null
          resume_url?: string | null
          status?: string | null
        }
        Update: {
          candidate_email?: string | null
          candidate_id?: string | null
          candidate_location?: string | null
          candidate_name?: string | null
          candidate_years_of_experience?: number | null
          cover_letter?: string | null
          id?: string
          job_code?: string | null
          job_id?: string | null
          match_breakdown?: Json | null
          match_score?: number | null
          match_summary?: string | null
          received_at?: string | null
          resume_url?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          created_at: string | null
          education: Json | null
          email: string | null
          experience: Json | null
          id: string
          links: string | null
          location: string | null
          name: string | null
          phone: string | null
          resume_text: string | null
          skills: Json | null
          summary: string | null
          years_of_experience: number | null
        }
        Insert: {
          created_at?: string | null
          education?: Json | null
          email?: string | null
          experience?: Json | null
          id: string
          links?: string | null
          location?: string | null
          name?: string | null
          phone?: string | null
          resume_text?: string | null
          skills?: Json | null
          summary?: string | null
          years_of_experience?: number | null
        }
        Update: {
          created_at?: string | null
          education?: Json | null
          email?: string | null
          experience?: Json | null
          id?: string
          links?: string | null
          location?: string | null
          name?: string | null
          phone?: string | null
          resume_text?: string | null
          skills?: Json | null
          summary?: string | null
          years_of_experience?: number | null
        }
        Relationships: []
      }
      google_tokens: {
        Row: {
          access_token: string
          expiry_date: number
          id: string
          refresh_token: string
          updated_at: string
        }
        Insert: {
          access_token: string
          expiry_date: number
          id?: string
          refresh_token: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          expiry_date?: number
          id?: string
          refresh_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      interviews: {
        Row: {
          application_id: string
          candidate_email: string
          candidate_id: string
          candidate_name: string
          created_at: string
          duration_minutes: number
          google_event_id: string
          google_meet_link: string
          id: string
          job_code: string
          job_id: string
          job_title: string
          notes: string | null
          scheduled_at: string
          status: string
          timezone: string
        }
        Insert: {
          application_id: string
          candidate_email: string
          candidate_id: string
          candidate_name: string
          created_at?: string
          duration_minutes?: number
          google_event_id: string
          google_meet_link: string
          id: string
          job_code: string
          job_id: string
          job_title: string
          notes?: string | null
          scheduled_at: string
          status?: string
          timezone?: string
        }
        Update: {
          application_id?: string
          candidate_email?: string
          candidate_id?: string
          candidate_name?: string
          created_at?: string
          duration_minutes?: number
          google_event_id?: string
          google_meet_link?: string
          id?: string
          job_code?: string
          job_id?: string
          job_title?: string
          notes?: string | null
          scheduled_at?: string
          status?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          archived_at: string | null
          benefits_inperson: Json | null
          benefits_remote: Json | null
          code: string | null
          compensation: string | null
          created_at: string | null
          criteria: Json | null
          department: string | null
          description: string | null
          id: string
          level: string | null
          location: string | null
          nicetohave: Json | null
          portfoliorequirement: string | null
          requirements: Json | null
          responsibilities: Json | null
          summary: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          workculture: Json | null
        }
        Insert: {
          archived_at?: string | null
          benefits_inperson?: Json | null
          benefits_remote?: Json | null
          code?: string | null
          compensation?: string | null
          created_at?: string | null
          criteria?: Json | null
          department?: string | null
          description?: string | null
          id: string
          level?: string | null
          location?: string | null
          nicetohave?: Json | null
          portfoliorequirement?: string | null
          requirements?: Json | null
          responsibilities?: Json | null
          summary?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          workculture?: Json | null
        }
        Update: {
          archived_at?: string | null
          benefits_inperson?: Json | null
          benefits_remote?: Json | null
          code?: string | null
          compensation?: string | null
          created_at?: string | null
          criteria?: Json | null
          department?: string | null
          description?: string | null
          id?: string
          level?: string | null
          location?: string | null
          nicetohave?: Json | null
          portfoliorequirement?: string | null
          requirements?: Json | null
          responsibilities?: Json | null
          summary?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          workculture?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
