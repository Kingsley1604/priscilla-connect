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
      admin_suspension_notifications: {
        Row: {
          class_name: string
          created_at: string | null
          id: string
          is_handled: boolean | null
          is_read: boolean | null
          reason: string
          request_id: string
          student_id: string
          student_name: string
          teacher_id: string
          teacher_name: string
        }
        Insert: {
          class_name: string
          created_at?: string | null
          id?: string
          is_handled?: boolean | null
          is_read?: boolean | null
          reason: string
          request_id: string
          student_id: string
          student_name: string
          teacher_id: string
          teacher_name: string
        }
        Update: {
          class_name?: string
          created_at?: string | null
          id?: string
          is_handled?: boolean | null
          is_read?: boolean | null
          reason?: string
          request_id?: string
          student_id?: string
          student_name?: string
          teacher_id?: string
          teacher_name?: string
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
          content: string
          created_at: string
          created_by: string
          creator_sector: string | null
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
          creator_sector?: string | null
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
          creator_sector?: string | null
          id?: string
          is_active?: boolean
          target_roles?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      call_history: {
        Row: {
          call_duration: number | null
          call_status: string
          call_type: string
          caller_id: string
          created_at: string
          ended_at: string | null
          id: string
          receiver_id: string
          started_at: string
        }
        Insert: {
          call_duration?: number | null
          call_status?: string
          call_type?: string
          caller_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          receiver_id: string
          started_at?: string
        }
        Update: {
          call_duration?: number | null
          call_status?: string
          call_type?: string
          caller_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          receiver_id?: string
          started_at?: string
        }
        Relationships: []
      }
      chat_group_members: {
        Row: {
          group_id: string
          id: string
          is_admin: boolean | null
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          is_admin?: boolean | null
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          is_admin?: boolean | null
          joined_at?: string
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
          content: string
          created_at: string
          file_name: string | null
          file_url: string | null
          group_id: string
          id: string
          message_type: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          group_id: string
          id?: string
          message_type?: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          group_id?: string
          id?: string
          message_type?: string
          sender_id?: string
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
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          is_deleted_by_receiver: boolean | null
          is_deleted_by_sender: boolean | null
          is_read: boolean | null
          message_type: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_deleted_by_receiver?: boolean | null
          is_deleted_by_sender?: boolean | null
          is_read?: boolean | null
          message_type?: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_deleted_by_receiver?: boolean | null
          is_deleted_by_sender?: boolean | null
          is_read?: boolean | null
          message_type?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      class_students: {
        Row: {
          class_id: string
          enrolled_at: string | null
          enrolled_by: string
          id: string
          is_active: boolean | null
          student_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string | null
          enrolled_by: string
          id?: string
          is_active?: boolean | null
          student_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string | null
          enrolled_by?: string
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
          academic_session: string
          class_level: string
          class_teacher_id: string | null
          created_at: string | null
          created_by: string
          id: string
          is_active: boolean | null
          name: string
          section: string | null
          updated_at: string | null
        }
        Insert: {
          academic_session?: string
          class_level: string
          class_teacher_id?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          is_active?: boolean | null
          name: string
          section?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_session?: string
          class_level?: string
          class_teacher_id?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          is_active?: boolean | null
          name?: string
          section?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          creator_sector: string | null
          date: string
          description: string | null
          id: string
          location: string | null
          status: string
          target_audience: string[] | null
          target_sectors: string[] | null
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
          creator_sector?: string | null
          date: string
          description?: string | null
          id?: string
          location?: string | null
          status?: string
          target_audience?: string[] | null
          target_sectors?: string[] | null
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
          creator_sector?: string | null
          date?: string
          description?: string | null
          id?: string
          location?: string | null
          status?: string
          target_audience?: string[] | null
          target_sectors?: string[] | null
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
      lesson_plan_history: {
        Row: {
          created_at: string | null
          duration: number
          generated_plan: string
          grade: string
          id: string
          objectives: string
          subject: string
          teacher_id: string
          topic: string
        }
        Insert: {
          created_at?: string | null
          duration: number
          generated_plan: string
          grade: string
          id?: string
          objectives: string
          subject: string
          teacher_id: string
          topic: string
        }
        Update: {
          created_at?: string | null
          duration?: number
          generated_plan?: string
          grade?: string
          id?: string
          objectives?: string
          subject?: string
          teacher_id?: string
          topic?: string
        }
        Relationships: []
      }
      missed_calls: {
        Row: {
          call_type: string
          caller_id: string
          created_at: string
          id: string
          is_seen: boolean | null
          receiver_id: string
        }
        Insert: {
          call_type?: string
          caller_id: string
          created_at?: string
          id?: string
          is_seen?: boolean | null
          receiver_id: string
        }
        Update: {
          call_type?: string
          caller_id?: string
          created_at?: string
          id?: string
          is_seen?: boolean | null
          receiver_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admission_no: string | null
          avatar: string | null
          class_grade: string | null
          consent_info_usage: boolean | null
          consent_terms: boolean | null
          created_at: string
          current_academic_session: string | null
          date_of_birth: string | null
          default_password: string | null
          department: string | null
          doctor_contact: string | null
          emergency_alt_phone: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          gender: string | null
          has_medical_conditions: boolean | null
          home_address: string | null
          id: string
          is_profile_complete: boolean | null
          is_super_admin: boolean | null
          is_suspended: boolean | null
          medical_details: string | null
          must_change_password: boolean | null
          name: string | null
          nationality: string | null
          parent_address: string | null
          parent_email: string | null
          parent_guardian_name: string | null
          parent_occupation: string | null
          parent_phone: string | null
          parent_relationship: string | null
          phone: string | null
          preferred_hospital: string | null
          preferred_language: string | null
          previous_class: string | null
          previous_school: string | null
          sector: string | null
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          admission_no?: string | null
          avatar?: string | null
          class_grade?: string | null
          consent_info_usage?: boolean | null
          consent_terms?: boolean | null
          created_at?: string
          current_academic_session?: string | null
          date_of_birth?: string | null
          default_password?: string | null
          department?: string | null
          doctor_contact?: string | null
          emergency_alt_phone?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          gender?: string | null
          has_medical_conditions?: boolean | null
          home_address?: string | null
          id: string
          is_profile_complete?: boolean | null
          is_super_admin?: boolean | null
          is_suspended?: boolean | null
          medical_details?: string | null
          must_change_password?: boolean | null
          name?: string | null
          nationality?: string | null
          parent_address?: string | null
          parent_email?: string | null
          parent_guardian_name?: string | null
          parent_occupation?: string | null
          parent_phone?: string | null
          parent_relationship?: string | null
          phone?: string | null
          preferred_hospital?: string | null
          preferred_language?: string | null
          previous_class?: string | null
          previous_school?: string | null
          sector?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          admission_no?: string | null
          avatar?: string | null
          class_grade?: string | null
          consent_info_usage?: boolean | null
          consent_terms?: boolean | null
          created_at?: string
          current_academic_session?: string | null
          date_of_birth?: string | null
          default_password?: string | null
          department?: string | null
          doctor_contact?: string | null
          emergency_alt_phone?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          gender?: string | null
          has_medical_conditions?: boolean | null
          home_address?: string | null
          id?: string
          is_profile_complete?: boolean | null
          is_super_admin?: boolean | null
          is_suspended?: boolean | null
          medical_details?: string | null
          must_change_password?: boolean | null
          name?: string | null
          nationality?: string | null
          parent_address?: string | null
          parent_email?: string | null
          parent_guardian_name?: string | null
          parent_occupation?: string | null
          parent_phone?: string | null
          parent_relationship?: string | null
          phone?: string | null
          preferred_hospital?: string | null
          preferred_language?: string | null
          previous_class?: string | null
          previous_school?: string | null
          sector?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: []
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
      result_upload_notifications: {
        Row: {
          class_name: string
          created_at: string
          id: string
          is_read: boolean | null
          result_type: string
          student_name: string
          submitted_at: string
          teacher_id: string
          teacher_name: string
        }
        Insert: {
          class_name: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          result_type: string
          student_name: string
          submitted_at?: string
          teacher_id: string
          teacher_name: string
        }
        Update: {
          class_name?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          result_type?: string
          student_name?: string
          submitted_at?: string
          teacher_id?: string
          teacher_name?: string
        }
        Relationships: []
      }
      secondary_affective_traits: {
        Row: {
          attendance: number | null
          attitude_to_school: number | null
          created_at: string
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
          created_at?: string
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
          created_at?: string
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
            isOneToOne: true
            referencedRelation: "secondary_report_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      secondary_psychomotor_skills: {
        Row: {
          created_at: string
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
          created_at?: string
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
          created_at?: string
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
            isOneToOne: true
            referencedRelation: "secondary_report_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      secondary_report_cards: {
        Row: {
          academic_session: string
          admission_no: string
          age: number | null
          approved_at: string | null
          approved_by: string | null
          arm: string | null
          class_average: number | null
          class_level: string
          class_teacher_remark: string | null
          created_at: string
          created_by: string
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
          published_at: string | null
          rejection_reason: string | null
          status: string | null
          student_average: number | null
          student_id: string
          student_name: string
          student_total_score: number | null
          submitted_at: string | null
          term: string
          total_students: number | null
          updated_at: string
        }
        Insert: {
          academic_session: string
          admission_no: string
          age?: number | null
          approved_at?: string | null
          approved_by?: string | null
          arm?: string | null
          class_average?: number | null
          class_level: string
          class_teacher_remark?: string | null
          created_at?: string
          created_by: string
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
          published_at?: string | null
          rejection_reason?: string | null
          status?: string | null
          student_average?: number | null
          student_id: string
          student_name: string
          student_total_score?: number | null
          submitted_at?: string | null
          term: string
          total_students?: number | null
          updated_at?: string
        }
        Update: {
          academic_session?: string
          admission_no?: string
          age?: number | null
          approved_at?: string | null
          approved_by?: string | null
          arm?: string | null
          class_average?: number | null
          class_level?: string
          class_teacher_remark?: string | null
          created_at?: string
          created_by?: string
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
          published_at?: string | null
          rejection_reason?: string | null
          status?: string | null
          student_average?: number | null
          student_id?: string
          student_name?: string
          student_total_score?: number | null
          submitted_at?: string | null
          term?: string
          total_students?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      secondary_report_subjects: {
        Row: {
          ca1_score: number | null
          ca2_score: number | null
          class_average: number | null
          created_at: string
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
          created_at?: string
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
          created_at?: string
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
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          details: Json | null
          id: string
          is_resolved: boolean | null
          message: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          is_resolved?: boolean | null
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          is_resolved?: boolean | null
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
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
      suspension_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          reason: string
          requested_by: string
          status: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          reason: string
          requested_by: string
          status?: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          reason?: string
          requested_by?: string
          status?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
          updated_by?: string | null
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
          is_class_teacher: boolean | null
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
          is_class_teacher?: boolean | null
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
          is_class_teacher?: boolean | null
          subject?: string
          teacher_id?: string
          teacher_name?: string
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
      generate_default_password: { Args: never; Returns: string }
      generate_teacher_id: { Args: never; Returns: string }
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_group_admin: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
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
      app_role: "admin" | "teacher" | "student"
      exam_status: "draft" | "active" | "completed"
      exam_type: "entrance" | "cbt" | "termly"
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
      app_role: ["admin", "teacher", "student"],
      exam_status: ["draft", "active", "completed"],
      exam_type: ["entrance", "cbt", "termly"],
      result_status: ["pending", "approved", "rejected"],
    },
  },
} as const
