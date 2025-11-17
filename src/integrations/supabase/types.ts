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
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_order_id: string | null
          target_admin_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_order_id?: string | null
          target_admin_id?: string | null
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_order_id?: string | null
          target_admin_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "store_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          target_roles: string[]
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          target_roles?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          target_roles?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          date: string
          description: string | null
          id: string
          location: string | null
          status: string
          time: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          date: string
          description?: string | null
          id?: string
          location?: string | null
          status?: string
          time?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          date?: string
          description?: string | null
          id?: string
          location?: string | null
          status?: string
          time?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          answers: Json
          exam_id: string
          id: string
          score: number | null
          started_at: string
          student_id: string
          submitted_at: string | null
          time_remaining: number | null
          token_number: string
          total_questions: number
        }
        Insert: {
          answers?: Json
          exam_id: string
          id?: string
          score?: number | null
          started_at?: string
          student_id: string
          submitted_at?: string | null
          time_remaining?: number | null
          token_number: string
          total_questions: number
        }
        Update: {
          answers?: Json
          exam_id?: string
          id?: string
          score?: number | null
          started_at?: string
          student_id?: string
          submitted_at?: string | null
          time_remaining?: number | null
          token_number?: string
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          correct_answer: string
          created_at: string
          exam_id: string
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_order: number
          question_text: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          exam_id: string
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_order: number
          question_text: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          exam_id?: string
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_order?: number
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attempt_id: string
          created_at: string
          exam_id: string
          id: string
          percentage: number
          score: number
          status: Database["public"]["Enums"]["result_status"]
          student_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attempt_id: string
          created_at?: string
          exam_id: string
          id?: string
          percentage: number
          score: number
          status?: Database["public"]["Enums"]["result_status"]
          student_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attempt_id?: string
          created_at?: string
          exam_id?: string
          id?: string
          percentage?: number
          score?: number
          status?: Database["public"]["Enums"]["result_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_tokens: {
        Row: {
          created_at: string
          created_by: string
          exam_id: string
          id: string
          student_id: string | null
          token_number: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          exam_id: string
          id?: string
          student_id?: string | null
          token_number: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          exam_id?: string
          id?: string
          student_id?: string | null
          token_number?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_tokens_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string
          created_by: string
          duration_minutes: number
          exam_type: Database["public"]["Enums"]["exam_type"]
          id: string
          randomize_questions: boolean | null
          status: Database["public"]["Enums"]["exam_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          duration_minutes?: number
          exam_type?: Database["public"]["Enums"]["exam_type"]
          id?: string
          randomize_questions?: boolean | null
          status?: Database["public"]["Enums"]["exam_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          duration_minutes?: number
          exam_type?: Database["public"]["Enums"]["exam_type"]
          id?: string
          randomize_questions?: boolean | null
          status?: Database["public"]["Enums"]["exam_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      homework: {
        Row: {
          class_level: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string
          id: string
          is_active: boolean
          subject: string
          title: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          class_level: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date: string
          id?: string
          is_active?: boolean
          subject: string
          title: string
          total_marks?: number
          updated_at?: string
        }
        Update: {
          class_level?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string
          id?: string
          is_active?: boolean
          subject?: string
          title?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: []
      }
      homework_submissions: {
        Row: {
          file_url: string | null
          graded_at: string | null
          homework_id: string
          id: string
          marks_obtained: number | null
          status: string
          student_id: string
          student_name: string
          submission_text: string | null
          submitted_at: string
          teacher_feedback: string | null
        }
        Insert: {
          file_url?: string | null
          graded_at?: string | null
          homework_id: string
          id?: string
          marks_obtained?: number | null
          status?: string
          student_id: string
          student_name: string
          submission_text?: string | null
          submitted_at?: string
          teacher_feedback?: string | null
        }
        Update: {
          file_url?: string | null
          graded_at?: string | null
          homework_id?: string
          id?: string
          marks_obtained?: number | null
          status?: string
          student_id?: string
          student_name?: string
          submission_text?: string | null
          submitted_at?: string
          teacher_feedback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_alerts: {
        Row: {
          alert_threshold: number
          created_at: string
          created_by: string
          current_stock: number
          id: string
          is_active: boolean | null
          item_name: string
          store_item_id: string | null
          updated_at: string
        }
        Insert: {
          alert_threshold?: number
          created_at?: string
          created_by: string
          current_stock?: number
          id?: string
          is_active?: boolean | null
          item_name: string
          store_item_id?: string | null
          updated_at?: string
        }
        Update: {
          alert_threshold?: number
          created_at?: string
          created_by?: string
          current_stock?: number
          id?: string
          is_active?: boolean | null
          item_name?: string
          store_item_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_alerts_store_item_id_fkey"
            columns: ["store_item_id"]
            isOneToOne: false
            referencedRelation: "store_items"
            referencedColumns: ["id"]
          },
        ]
      }
      report_card_subjects: {
        Row: {
          created_at: string
          exam_score: number | null
          grade: string | null
          half_term_score: number | null
          id: string
          report_card_id: string
          subject_name: string
          teacher_remark: string | null
          total_score: number | null
        }
        Insert: {
          created_at?: string
          exam_score?: number | null
          grade?: string | null
          half_term_score?: number | null
          id?: string
          report_card_id: string
          subject_name: string
          teacher_remark?: string | null
          total_score?: number | null
        }
        Update: {
          created_at?: string
          exam_score?: number | null
          grade?: string | null
          half_term_score?: number | null
          id?: string
          report_card_id?: string
          subject_name?: string
          teacher_remark?: string | null
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "report_card_subjects_report_card_id_fkey"
            columns: ["report_card_id"]
            isOneToOne: false
            referencedRelation: "report_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      report_cards: {
        Row: {
          academic_session: string
          admission_no: string
          average_score: number | null
          class_level: string
          class_teacher_comments: string | null
          class_teacher_name: string | null
          club_organization: string | null
          conduct_percentage: number | null
          conduct_rating: string | null
          created_at: string
          created_by: string
          date_of_birth: string | null
          gender: string | null
          head_teacher_comments: string | null
          head_teacher_name: string | null
          id: string
          is_exemplary: boolean | null
          next_term_begins: string | null
          other_activities: string[] | null
          passport_photo_url: string | null
          percentage: number | null
          position: string | null
          school_sports: string[] | null
          student_id: string
          student_name: string
          term: string
          times_absent: number | null
          times_present: number | null
          total_obtainable_score: number | null
          total_school_opened: number | null
          total_score_obtained: number | null
          updated_at: string
        }
        Insert: {
          academic_session: string
          admission_no: string
          average_score?: number | null
          class_level: string
          class_teacher_comments?: string | null
          class_teacher_name?: string | null
          club_organization?: string | null
          conduct_percentage?: number | null
          conduct_rating?: string | null
          created_at?: string
          created_by: string
          date_of_birth?: string | null
          gender?: string | null
          head_teacher_comments?: string | null
          head_teacher_name?: string | null
          id?: string
          is_exemplary?: boolean | null
          next_term_begins?: string | null
          other_activities?: string[] | null
          passport_photo_url?: string | null
          percentage?: number | null
          position?: string | null
          school_sports?: string[] | null
          student_id: string
          student_name: string
          term: string
          times_absent?: number | null
          times_present?: number | null
          total_obtainable_score?: number | null
          total_school_opened?: number | null
          total_score_obtained?: number | null
          updated_at?: string
        }
        Update: {
          academic_session?: string
          admission_no?: string
          average_score?: number | null
          class_level?: string
          class_teacher_comments?: string | null
          class_teacher_name?: string | null
          club_organization?: string | null
          conduct_percentage?: number | null
          conduct_rating?: string | null
          created_at?: string
          created_by?: string
          date_of_birth?: string | null
          gender?: string | null
          head_teacher_comments?: string | null
          head_teacher_name?: string | null
          id?: string
          is_exemplary?: boolean | null
          next_term_begins?: string | null
          other_activities?: string[] | null
          passport_photo_url?: string | null
          percentage?: number | null
          position?: string | null
          school_sports?: string[] | null
          student_id?: string
          student_name?: string
          term?: string
          times_absent?: number | null
          times_present?: number | null
          total_obtainable_score?: number | null
          total_school_opened?: number | null
          total_score_obtained?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      result_codes: {
        Row: {
          code: string
          created_at: string
          exam_type: string
          id: string
          is_used: boolean
          student_id: string
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          exam_type: string
          id?: string
          is_used?: boolean
          student_id: string
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          exam_type?: string
          id?: string
          is_used?: boolean
          student_id?: string
          used_at?: string | null
        }
        Relationships: []
      }
      store_items: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_file: string | null
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          rating: number | null
          stock: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_file?: string | null
          image_url?: string | null
          is_active?: boolean
          name: string
          price: number
          rating?: number | null
          stock?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_file?: string | null
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          rating?: number | null
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      store_orders: {
        Row: {
          delivery_address: string | null
          id: string
          items: Json
          notes: string | null
          order_date: string
          phone_number: string | null
          status: string
          total_amount: number
          user_id: string
        }
        Insert: {
          delivery_address?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_date?: string
          phone_number?: string | null
          status?: string
          total_amount: number
          user_id: string
        }
        Update: {
          delivery_address?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_date?: string
          phone_number?: string | null
          status?: string
          total_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      student_results: {
        Row: {
          academic_session: string
          admission_no: string
          class_level: string
          created_at: string
          created_by: string
          exam_score: number
          grade: string
          grade_letter: string | null
          half_term_score: number
          id: string
          remark: string | null
          result_type: string
          student_id: string
          student_name: string
          subject: string
          term: string
          total_score: number
          updated_at: string
        }
        Insert: {
          academic_session: string
          admission_no: string
          class_level: string
          created_at?: string
          created_by: string
          exam_score?: number
          grade: string
          grade_letter?: string | null
          half_term_score?: number
          id?: string
          remark?: string | null
          result_type: string
          student_id: string
          student_name: string
          subject: string
          term: string
          total_score?: number
          updated_at?: string
        }
        Update: {
          academic_session?: string
          admission_no?: string
          class_level?: string
          created_at?: string
          created_by?: string
          exam_score?: number
          grade?: string
          grade_letter?: string | null
          half_term_score?: number
          id?: string
          remark?: string | null
          result_type?: string
          student_id?: string
          student_name?: string
          subject?: string
          term?: string
          total_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      teacher_assignments: {
        Row: {
          academic_session: string
          assigned_at: string
          assigned_by: string
          class_level: string
          id: string
          is_active: boolean
          subject: string
          teacher_id: string
          teacher_name: string
        }
        Insert: {
          academic_session: string
          assigned_at?: string
          assigned_by: string
          class_level: string
          id?: string
          is_active?: boolean
          subject: string
          teacher_id: string
          teacher_name: string
        }
        Update: {
          academic_session?: string
          assigned_at?: string
          assigned_by?: string
          class_level?: string
          id?: string
          is_active?: boolean
          subject?: string
          teacher_id?: string
          teacher_name?: string
        }
        Relationships: []
      }
      video_content: {
        Row: {
          created_at: string
          description: string | null
          duration: string | null
          id: string
          status: string
          subject: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          uploaded_by: string
          video_url: string | null
          views: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          status?: string
          subject: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          uploaded_by: string
          video_url?: string | null
          views?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          status?: string
          subject?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string
          video_url?: string | null
          views?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_submit_expired_attempts: { Args: never; Returns: undefined }
      check_inventory_levels: { Args: never; Returns: undefined }
      get_exam_question_count: { Args: { exam_id: string }; Returns: number }
      get_exam_questions_for_attempt: {
        Args: { exam_attempt_id: string }
        Returns: {
          created_at: string
          exam_id: string
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_order: number
          question_text: string
        }[]
      }
      get_exam_questions_for_review: {
        Args: { exam_attempt_id: string }
        Returns: {
          correct_answer: string
          created_at: string
          exam_id: string
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_order: number
          question_text: string
        }[]
      }
      get_exam_statistics: {
        Args: { creator_id?: string }
        Returns: {
          created_by: string
          exam_id: string
          students_completed: number
          students_not_started: number
          students_taking: number
          title: string
          total_students: number
        }[]
      }
      search_teachers: {
        Args: { search_term: string }
        Returns: {
          email: string
          id: string
          name: string
        }[]
      }
    }
    Enums: {
      exam_status: "draft" | "active" | "completed"
      exam_type: "entrance" | "cbt"
      result_status: "pending" | "approved" | "rejected"
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
      exam_status: ["draft", "active", "completed"],
      exam_type: ["entrance", "cbt"],
      result_status: ["pending", "approved", "rejected"],
    },
  },
} as const
