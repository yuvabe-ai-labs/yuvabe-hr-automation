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
      application_notes: {
        Row: {
          id: string
          application_id: string
          author_email: string
          body: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          application_id: string
          author_email: string
          body: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          author_email?: string
          body?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          id: string
          job_id: string | null
          job_code: string | null
          candidate_id: string | null
          candidate_name: string | null
          candidate_email: string | null
          candidate_location: string | null
          candidate_years_of_experience: number | null
          resume_url: string | null
          cover_letter: string | null
          match_score: number | null
          match_summary: string | null
          match_breakdown: Json | null
          must_score: number | null
          preferred_score: number | null
          nice_score: number | null
          scored_at: string | null
          status: string | null
          rejection_reason: string | null
          assigned_interviewer_id: string | null
          received_at: string | null
        }
        Insert: {
          id: string
          job_id?: string | null
          job_code?: string | null
          candidate_id?: string | null
          candidate_name?: string | null
          candidate_email?: string | null
          candidate_location?: string | null
          candidate_years_of_experience?: number | null
          resume_url?: string | null
          cover_letter?: string | null
          match_score?: number | null
          match_summary?: string | null
          match_breakdown?: Json | null
          must_score?: number | null
          preferred_score?: number | null
          nice_score?: number | null
          scored_at?: string | null
          status?: string | null
          rejection_reason?: string | null
          assigned_interviewer_id?: string | null
          received_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string | null
          job_code?: string | null
          candidate_id?: string | null
          candidate_name?: string | null
          candidate_email?: string | null
          candidate_location?: string | null
          candidate_years_of_experience?: number | null
          resume_url?: string | null
          cover_letter?: string | null
          match_score?: number | null
          match_summary?: string | null
          match_breakdown?: Json | null
          must_score?: number | null
          preferred_score?: number | null
          nice_score?: number | null
          scored_at?: string | null
          status?: string | null
          rejection_reason?: string | null
          assigned_interviewer_id?: string | null
          received_at?: string | null
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
          {
            foreignKeyName: "applications_assigned_interviewer_id_fkey"
            columns: ["assigned_interviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          id: string
          name: string | null
          email: string | null
          phone: string | null
          location: string | null
          summary: string | null
          years_of_experience: number | null
          skills: Json | null
          experience: Json | null
          education: Json | null
          links: string | null
          resume_text: string | null
          is_blacklisted: boolean
          blacklist_reason: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          phone?: string | null
          location?: string | null
          summary?: string | null
          years_of_experience?: number | null
          skills?: Json | null
          experience?: Json | null
          education?: Json | null
          links?: string | null
          resume_text?: string | null
          is_blacklisted?: boolean
          blacklist_reason?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          location?: string | null
          summary?: string | null
          years_of_experience?: number | null
          skills?: Json | null
          experience?: Json | null
          education?: Json | null
          links?: string | null
          resume_text?: string | null
          is_blacklisted?: boolean
          blacklist_reason?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          id: string
          code: string | null
          title: string | null
          description: string | null
          criteria: Json | null
          status: string
          department: string | null
          location: string | null
          compensation: string | null
          type: string | null
          level: string | null
          summary: string | null
          responsibilities: Json | null
          requirements: Json | null
          nicetohave: Json | null
          portfoliorequirement: string | null
          benefits_remote: Json | null
          benefits_inperson: Json | null
          workculture: Json | null
          is_paid_listing: boolean
          hiring_manager_id: string | null
          published_at: string | null
          closed_at: string | null
          archived_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          code?: string | null
          title?: string | null
          description?: string | null
          criteria?: Json | null
          status?: string
          department?: string | null
          location?: string | null
          compensation?: string | null
          type?: string | null
          level?: string | null
          summary?: string | null
          responsibilities?: Json | null
          requirements?: Json | null
          nicetohave?: Json | null
          portfoliorequirement?: string | null
          benefits_remote?: Json | null
          benefits_inperson?: Json | null
          workculture?: Json | null
          is_paid_listing?: boolean
          hiring_manager_id?: string | null
          published_at?: string | null
          closed_at?: string | null
          archived_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          code?: string | null
          title?: string | null
          description?: string | null
          criteria?: Json | null
          status?: string
          department?: string | null
          location?: string | null
          compensation?: string | null
          type?: string | null
          level?: string | null
          summary?: string | null
          responsibilities?: Json | null
          requirements?: Json | null
          nicetohave?: Json | null
          portfoliorequirement?: string | null
          benefits_remote?: Json | null
          benefits_inperson?: Json | null
          workculture?: Json | null
          is_paid_listing?: boolean
          hiring_manager_id?: string | null
          published_at?: string | null
          closed_at?: string | null
          archived_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_hiring_manager_id_fkey"
            columns: ["hiring_manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      job_criteria_history: {
        Row: {
          id: string
          job_id: string
          changed_by: string
          changed_at: string
          change_note: string
          criteria_before: Json
          criteria_after: Json
        }
        Insert: {
          id?: string
          job_id: string
          changed_by: string
          changed_at?: string
          change_note?: string
          criteria_before: Json
          criteria_after: Json
        }
        Update: {
          id?: string
          job_id?: string
          changed_by?: string
          changed_at?: string
          change_note?: string
          criteria_before?: Json
          criteria_after?: Json
        }
        Relationships: [
          {
            foreignKeyName: "job_criteria_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          password_hash: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string
          role?: string
          password_hash?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
          password_hash?: string
          created_at?: string
        }
        Relationships: []
      }
      interviews: {
        Row: {
          id: string
          application_id: string
          candidate_id: string
          candidate_name: string
          candidate_email: string
          job_id: string
          job_code: string
          job_title: string
          title: string
          scheduled_at: string
          duration_minutes: number
          timezone: string
          status: string
          notes: string | null
          location: string | null
          meeting_link: string | null
          interviewer_id: string | null
          interviewer_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          candidate_id: string
          candidate_name: string
          candidate_email: string
          job_id: string
          job_code: string
          job_title: string
          title?: string
          scheduled_at: string
          duration_minutes?: number
          timezone?: string
          status?: string
          notes?: string | null
          location?: string | null
          meeting_link?: string | null
          interviewer_id?: string | null
          interviewer_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          candidate_id?: string
          candidate_name?: string
          candidate_email?: string
          job_id?: string
          job_code?: string
          job_title?: string
          title?: string
          scheduled_at?: string
          duration_minutes?: number
          timezone?: string
          status?: string
          notes?: string | null
          location?: string | null
          meeting_link?: string | null
          interviewer_id?: string | null
          interviewer_name?: string | null
          created_at?: string
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
