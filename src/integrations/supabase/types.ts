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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          related_order_id: string | null
          target_admin_id: string | null
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          related_order_id?: string | null
          target_admin_id?: string | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          related_order_id?: string | null
          target_admin_id?: string | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      admin_suspension_notifications: {
        Row: {
          class_name: string | null
          created_at: string | null
          id: string
          is_handled: boolean | null
          is_read: boolean | null
          reason: string | null
          request_id: string | null
          student_id: string | null
          student_name: string | null
          teacher_id: string | null
          teacher_name: string | null
        }
        Insert: {
          class_name?: string | null
          created_at?: string | null
          id?: string
          is_handled?: boolean | null
          is_read?: boolean | null
          reason?: string | null
          request_id?: string | null
          student_id?: string | null
          student_name?: string | null
          teacher_id?: string | null
          teacher_name?: string | null
        }
        Update: {
          class_name?: string | null
          created_at?: string | null
          id?: string
          is_handled?: boolean | null
          is_read?: boolean | null
          reason?: string | null
          request_id?: string | null
          student_id?: string | null
          student_name?: string | null
          teacher_id?: string | null
          teacher_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_suspension_notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "suspension_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          creator_sector: string | null
          id: string
          is_active: boolean | null
          target_roles: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          creator_sector?: string | null
          id?: string
          is_active?: boolean | null
          target_roles?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          creator_sector?: string | null
          id?: string
          is_active?: boolean | null
          target_roles?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      call_history: {
        Row: {
          call_type: string | null
          caller_id: string | null
          created_at: string | null
          duration: number | null
          id: string
          receiver_id: string | null
          status: string | null
        }
        Insert: {
          call_type?: string | null
          caller_id?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          receiver_id?: string | null
          status?: string | null
        }
        Update: {
          call_type?: string | null
          caller_id?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          receiver_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      chat_group_members: {
        Row: {
          group_id: string
          id: string
          is_admin: boolean | null
          joined_at: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          is_admin?: boolean | null
          joined_at?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          is_admin?: boolean | null
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_group_messages: {
        Row: {
          content: string | null
          created_at: string | null
          file_name: string | null
          file_url: string | null
          group_id: string
          id: string
          message_type: string | null
          sender_id: string
          voice_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          group_id: string
          id?: string
          message_type?: string | null
          sender_id: string
          voice_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          group_id?: string
          id?: string
          message_type?: string | null
          sender_id?: string
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_groups: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          file_name: string | null
          file_url: string | null
          group_id: string | null
          id: string
          is_deleted_by_receiver: boolean | null
          is_deleted_by_sender: boolean | null
          is_read: boolean | null
          message_type: string | null
          receiver_id: string | null
          sender_id: string
          voice_url: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          group_id?: string | null
          id?: string
          is_deleted_by_receiver?: boolean | null
          is_deleted_by_sender?: boolean | null
          is_read?: boolean | null
          message_type?: string | null
          receiver_id?: string | null
          sender_id: string
          voice_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          group_id?: string | null
          id?: string
          is_deleted_by_receiver?: boolean | null
          is_deleted_by_sender?: boolean | null
          is_read?: boolean | null
          message_type?: string | null
          receiver_id?: string | null
          sender_id?: string
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      class_students: {
        Row: {
          class_id: string
          enrolled_at: string | null
          id: string
          is_active: boolean | null
          student_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string | null
          id?: string
          is_active?: boolean | null
          student_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string | null
          id?: string
          is_active?: boolean | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_session: string | null
          class_level: string
          class_teacher_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          section: string | null
        }
        Insert: {
          academic_session?: string | null
          class_level: string
          class_teacher_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          section?: string | null
        }
        Update: {
          academic_session?: string | null
          class_level?: string
          class_teacher_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          section?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          date: string | null
          description: string | null
          id: string
          location: string | null
          sector: string | null
          status: string | null
          target_audience: string[] | null
          time: string | null
          title: string
          type: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          id?: string
          location?: string | null
          sector?: string | null
          status?: string | null
          target_audience?: string[] | null
          time?: string | null
          title: string
          type?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          id?: string
          location?: string | null
          sector?: string | null
          status?: string | null
          target_audience?: string[] | null
          time?: string | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      exam_approval_notifications: {
        Row: {
          action: string
          created_at: string | null
          exam_id: string | null
          id: string
          is_read: boolean | null
          message: string | null
          teacher_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          exam_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          teacher_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          exam_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_approval_notifications_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          answers: Json | null
          exam_id: string
          id: string
          score: number | null
          started_at: string | null
          student_id: string | null
          submitted_at: string | null
          time_remaining: number | null
          token_number: string | null
          total_questions: number | null
        }
        Insert: {
          answers?: Json | null
          exam_id: string
          id?: string
          score?: number | null
          started_at?: string | null
          student_id?: string | null
          submitted_at?: string | null
          time_remaining?: number | null
          token_number?: string | null
          total_questions?: number | null
        }
        Update: {
          answers?: Json | null
          exam_id?: string
          id?: string
          score?: number | null
          started_at?: string | null
          student_id?: string | null
          submitted_at?: string | null
          time_remaining?: number | null
          token_number?: string | null
          total_questions?: number | null
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
          created_at: string | null
          exam_id: string
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_order: number | null
          question_text: string
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          exam_id: string
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_order?: number | null
          question_text: string
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          exam_id?: string
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_order?: number | null
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
          attempt_id: string | null
          created_at: string | null
          exam_id: string | null
          id: string
          percentage: number | null
          score: number | null
          status: string | null
          student_id: string | null
          total_questions: number | null
        }
        Insert: {
          approved_at?: string | null
          attempt_id?: string | null
          created_at?: string | null
          exam_id?: string | null
          id?: string
          percentage?: number | null
          score?: number | null
          status?: string | null
          student_id?: string | null
          total_questions?: number | null
        }
        Update: {
          approved_at?: string | null
          attempt_id?: string | null
          created_at?: string | null
          exam_id?: string | null
          id?: string
          percentage?: number | null
          score?: number | null
          status?: string | null
          student_id?: string | null
          total_questions?: number | null
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
          created_at: string | null
          created_by: string
          exam_id: string
          id: string
          student_id: string | null
          token_number: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          exam_id: string
          id?: string
          student_id?: string | null
          token_number: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
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
          approved_at: string | null
          approved_by: string | null
          class_level: string | null
          created_at: string | null
          created_by: string | null
          duration_minutes: number
          exam_type: string
          grade: string | null
          id: string
          marks_per_question: number | null
          randomize_questions: boolean | null
          rejection_reason: string | null
          status: string
          submitted_for_approval_at: string | null
          title: string
          total_marks: number | null
          total_questions: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          class_level?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number
          exam_type?: string
          grade?: string | null
          id?: string
          marks_per_question?: number | null
          randomize_questions?: boolean | null
          rejection_reason?: string | null
          status?: string
          submitted_for_approval_at?: string | null
          title: string
          total_marks?: number | null
          total_questions?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          class_level?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number
          exam_type?: string
          grade?: string | null
          id?: string
          marks_per_question?: number | null
          randomize_questions?: boolean | null
          rejection_reason?: string | null
          status?: string
          submitted_for_approval_at?: string | null
          title?: string
          total_marks?: number | null
          total_questions?: number | null
        }
        Relationships: []
      }
      homework: {
        Row: {
          class_level: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          is_active: boolean | null
          subject: string | null
          title: string
          total_marks: number | null
        }
        Insert: {
          class_level?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_active?: boolean | null
          subject?: string | null
          title: string
          total_marks?: number | null
        }
        Update: {
          class_level?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_active?: boolean | null
          subject?: string | null
          title?: string
          total_marks?: number | null
        }
        Relationships: []
      }
      homework_submissions: {
        Row: {
          created_at: string | null
          feedback: string | null
          file_url: string | null
          grade: number | null
          homework_id: string
          id: string
          status: string | null
          student_id: string
          student_name: string | null
          submission_text: string | null
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          file_url?: string | null
          grade?: number | null
          homework_id: string
          id?: string
          status?: string | null
          student_id: string
          student_name?: string | null
          submission_text?: string | null
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          file_url?: string | null
          grade?: number | null
          homework_id?: string
          id?: string
          status?: string | null
          student_id?: string
          student_name?: string | null
          submission_text?: string | null
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
          alert_threshold: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          store_item_id: string | null
        }
        Insert: {
          alert_threshold?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          store_item_id?: string | null
        }
        Update: {
          alert_threshold?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          store_item_id?: string | null
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
      missed_calls: {
        Row: {
          call_type: string | null
          caller_id: string | null
          created_at: string | null
          id: string
          is_seen: boolean | null
          receiver_id: string | null
        }
        Insert: {
          call_type?: string | null
          caller_id?: string | null
          created_at?: string | null
          id?: string
          is_seen?: boolean | null
          receiver_id?: string | null
        }
        Update: {
          call_type?: string | null
          caller_id?: string | null
          created_at?: string | null
          id?: string
          is_seen?: boolean | null
          receiver_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admission_no: string | null
          avatar: string | null
          class_grade: string | null
          created_at: string | null
          date_of_birth: string | null
          department: string | null
          email: string | null
          gender: string | null
          id: string
          is_profile_complete: boolean | null
          is_super_admin: boolean | null
          is_suspended: boolean | null
          must_change_password: boolean | null
          name: string | null
          phone: string | null
          sector: string | null
          teacher_id: string | null
        }
        Insert: {
          admission_no?: string | null
          avatar?: string | null
          class_grade?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          gender?: string | null
          id: string
          is_profile_complete?: boolean | null
          is_super_admin?: boolean | null
          is_suspended?: boolean | null
          must_change_password?: boolean | null
          name?: string | null
          phone?: string | null
          sector?: string | null
          teacher_id?: string | null
        }
        Update: {
          admission_no?: string | null
          avatar?: string | null
          class_grade?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          is_profile_complete?: boolean | null
          is_super_admin?: boolean | null
          is_suspended?: boolean | null
          must_change_password?: boolean | null
          name?: string | null
          phone?: string | null
          sector?: string | null
          teacher_id?: string | null
        }
        Relationships: []
      }
      report_card_subjects: {
        Row: {
          created_at: string | null
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
          created_at?: string | null
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
          created_at?: string | null
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
          academic_session: string | null
          admission_no: string | null
          average_score: number | null
          class_level: string
          class_teacher_comments: string | null
          class_teacher_name: string | null
          club_organization: string | null
          conduct_percentage: number | null
          conduct_rating: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          gender: string | null
          head_teacher_comments: string | null
          head_teacher_name: string | null
          id: string
          next_term_begins: string | null
          passport_photo_url: string | null
          percentage: number | null
          position: string | null
          student_id: string | null
          student_name: string
          term: string | null
          times_absent: number | null
          times_present: number | null
          total_obtainable_score: number | null
          total_school_opened: number | null
          total_score_obtained: number | null
        }
        Insert: {
          academic_session?: string | null
          admission_no?: string | null
          average_score?: number | null
          class_level: string
          class_teacher_comments?: string | null
          class_teacher_name?: string | null
          club_organization?: string | null
          conduct_percentage?: number | null
          conduct_rating?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          gender?: string | null
          head_teacher_comments?: string | null
          head_teacher_name?: string | null
          id?: string
          next_term_begins?: string | null
          passport_photo_url?: string | null
          percentage?: number | null
          position?: string | null
          student_id?: string | null
          student_name: string
          term?: string | null
          times_absent?: number | null
          times_present?: number | null
          total_obtainable_score?: number | null
          total_school_opened?: number | null
          total_score_obtained?: number | null
        }
        Update: {
          academic_session?: string | null
          admission_no?: string | null
          average_score?: number | null
          class_level?: string
          class_teacher_comments?: string | null
          class_teacher_name?: string | null
          club_organization?: string | null
          conduct_percentage?: number | null
          conduct_rating?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          gender?: string | null
          head_teacher_comments?: string | null
          head_teacher_name?: string | null
          id?: string
          next_term_begins?: string | null
          passport_photo_url?: string | null
          percentage?: number | null
          position?: string | null
          student_id?: string | null
          student_name?: string
          term?: string | null
          times_absent?: number | null
          times_present?: number | null
          total_obtainable_score?: number | null
          total_school_opened?: number | null
          total_score_obtained?: number | null
        }
        Relationships: []
      }
      result_codes: {
        Row: {
          code: string
          created_at: string | null
          exam_type: string | null
          id: string
          is_used: boolean | null
          student_id: string | null
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          exam_type?: string | null
          id?: string
          is_used?: boolean | null
          student_id?: string | null
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          exam_type?: string | null
          id?: string
          is_used?: boolean | null
          student_id?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      result_upload_notifications: {
        Row: {
          class_name: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          result_type: string | null
          student_name: string | null
          teacher_id: string | null
          teacher_name: string | null
          title: string
          type: string | null
        }
        Insert: {
          class_name?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          result_type?: string | null
          student_name?: string | null
          teacher_id?: string | null
          teacher_name?: string | null
          title: string
          type?: string | null
        }
        Update: {
          class_name?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          result_type?: string | null
          student_name?: string | null
          teacher_id?: string | null
          teacher_name?: string | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      secondary_affective_traits: {
        Row: {
          attendance: number | null
          attitude_to_school: number | null
          honesty: number | null
          id: string
          neatness: number | null
          punctuality: number | null
          relationship_with_staff: number | null
          relationship_with_students: number | null
          reliability: number | null
          report_card_id: string
          self_control: number | null
        }
        Insert: {
          attendance?: number | null
          attitude_to_school?: number | null
          honesty?: number | null
          id?: string
          neatness?: number | null
          punctuality?: number | null
          relationship_with_staff?: number | null
          relationship_with_students?: number | null
          reliability?: number | null
          report_card_id: string
          self_control?: number | null
        }
        Update: {
          attendance?: number | null
          attitude_to_school?: number | null
          honesty?: number | null
          id?: string
          neatness?: number | null
          punctuality?: number | null
          relationship_with_staff?: number | null
          relationship_with_students?: number | null
          reliability?: number | null
          report_card_id?: string
          self_control?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "secondary_affective_traits_report_card_id_fkey"
            columns: ["report_card_id"]
            isOneToOne: false
            referencedRelation: "secondary_report_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      secondary_psychomotor_skills: {
        Row: {
          creative_arts: number | null
          general_reasoning: number | null
          handwriting: number | null
          id: string
          musical_skills: number | null
          physical_education: number | null
          reading: number | null
          report_card_id: string
          verbal_fluency: number | null
        }
        Insert: {
          creative_arts?: number | null
          general_reasoning?: number | null
          handwriting?: number | null
          id?: string
          musical_skills?: number | null
          physical_education?: number | null
          reading?: number | null
          report_card_id: string
          verbal_fluency?: number | null
        }
        Update: {
          creative_arts?: number | null
          general_reasoning?: number | null
          handwriting?: number | null
          id?: string
          musical_skills?: number | null
          physical_education?: number | null
          reading?: number | null
          report_card_id?: string
          verbal_fluency?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "secondary_psychomotor_skills_report_card_id_fkey"
            columns: ["report_card_id"]
            isOneToOne: false
            referencedRelation: "secondary_report_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      secondary_report_cards: {
        Row: {
          academic_session: string | null
          admission_no: string | null
          age: number | null
          approved_at: string | null
          arm: string | null
          class_average: number | null
          class_level: string
          class_teacher_remark: string | null
          created_at: string | null
          created_by: string | null
          days_absent: number | null
          days_present: number | null
          days_school_opened: number | null
          gender: string | null
          highest_average: number | null
          id: string
          lowest_average: number | null
          next_term_begins: string | null
          position_in_class: number | null
          principal_remark: string | null
          rejection_reason: string | null
          status: string | null
          student_average: number | null
          student_id: string | null
          student_name: string
          student_total_score: number | null
          term: string | null
          total_students: number | null
          updated_at: string | null
        }
        Insert: {
          academic_session?: string | null
          admission_no?: string | null
          age?: number | null
          approved_at?: string | null
          arm?: string | null
          class_average?: number | null
          class_level: string
          class_teacher_remark?: string | null
          created_at?: string | null
          created_by?: string | null
          days_absent?: number | null
          days_present?: number | null
          days_school_opened?: number | null
          gender?: string | null
          highest_average?: number | null
          id?: string
          lowest_average?: number | null
          next_term_begins?: string | null
          position_in_class?: number | null
          principal_remark?: string | null
          rejection_reason?: string | null
          status?: string | null
          student_average?: number | null
          student_id?: string | null
          student_name: string
          student_total_score?: number | null
          term?: string | null
          total_students?: number | null
          updated_at?: string | null
        }
        Update: {
          academic_session?: string | null
          admission_no?: string | null
          age?: number | null
          approved_at?: string | null
          arm?: string | null
          class_average?: number | null
          class_level?: string
          class_teacher_remark?: string | null
          created_at?: string | null
          created_by?: string | null
          days_absent?: number | null
          days_present?: number | null
          days_school_opened?: number | null
          gender?: string | null
          highest_average?: number | null
          id?: string
          lowest_average?: number | null
          next_term_begins?: string | null
          position_in_class?: number | null
          principal_remark?: string | null
          rejection_reason?: string | null
          status?: string | null
          student_average?: number | null
          student_id?: string | null
          student_name?: string
          student_total_score?: number | null
          term?: string | null
          total_students?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      secondary_report_subjects: {
        Row: {
          ca1_score: number | null
          ca2_score: number | null
          class_average: number | null
          created_at: string | null
          exam_score: number | null
          grade: string | null
          id: string
          report_card_id: string
          subject_name: string
          teacher_remark: string | null
          total_score: number | null
        }
        Insert: {
          ca1_score?: number | null
          ca2_score?: number | null
          class_average?: number | null
          created_at?: string | null
          exam_score?: number | null
          grade?: string | null
          id?: string
          report_card_id: string
          subject_name: string
          teacher_remark?: string | null
          total_score?: number | null
        }
        Update: {
          ca1_score?: number | null
          ca2_score?: number | null
          class_average?: number | null
          created_at?: string | null
          exam_score?: number | null
          grade?: string | null
          id?: string
          report_card_id?: string
          subject_name?: string
          teacher_remark?: string | null
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "secondary_report_subjects_report_card_id_fkey"
            columns: ["report_card_id"]
            isOneToOne: false
            referencedRelation: "secondary_report_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      store_items: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          rating: number | null
          stock: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price?: number
          rating?: number | null
          stock?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          rating?: number | null
          stock?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      store_orders: {
        Row: {
          created_at: string | null
          delivery_address: string | null
          id: string
          items: Json
          notes: string | null
          order_date: string | null
          phone_number: string | null
          status: string | null
          total_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_address?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_date?: string | null
          phone_number?: string | null
          status?: string | null
          total_amount?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivery_address?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_date?: string | null
          phone_number?: string | null
          status?: string | null
          total_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      student_results: {
        Row: {
          created_at: string | null
          exam_id: string | null
          grade: string | null
          id: string
          student_id: string
          subject: string
          total_score: number | null
        }
        Insert: {
          created_at?: string | null
          exam_id?: string | null
          grade?: string | null
          id?: string
          student_id: string
          subject: string
          total_score?: number | null
        }
        Update: {
          created_at?: string | null
          exam_id?: string | null
          grade?: string | null
          id?: string
          student_id?: string
          subject?: string
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      suspension_requests: {
        Row: {
          created_at: string | null
          id: string
          reason: string
          requested_by: string | null
          reviewed_by: string | null
          status: string | null
          student_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason: string
          requested_by?: string | null
          reviewed_by?: string | null
          status?: string | null
          student_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string
          requested_by?: string | null
          reviewed_by?: string | null
          status?: string | null
          student_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      teacher_assignments: {
        Row: {
          class_level: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_class_teacher: boolean | null
          subject: string | null
          teacher_id: string
        }
        Insert: {
          class_level: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_class_teacher?: boolean | null
          subject?: string | null
          teacher_id: string
        }
        Update: {
          class_level?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_class_teacher?: boolean | null
          subject?: string | null
          teacher_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_default_password: { Args: never; Returns: string }
      generate_teacher_id: { Args: never; Returns: string }
      get_exam_question_count: { Args: { p_exam_id: string }; Returns: number }
      get_exam_questions_for_attempt: {
        Args: { p_exam_attempt_id: string }
        Returns: {
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
        Args: { p_teacher_id: string }
        Returns: {
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
          sector: string
        }[]
      }
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
