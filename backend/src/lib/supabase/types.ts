export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          team_id: string
          team_name: string
          player1_name: string
          player2_name: string
          phone_no: string
          password: string
          r1_score: number
          r1_submission_time: string | null
          r2_score: number
          r2_submission_time: string | null
          created_at: string
          round3_1_score: number | null
          round3_1_timestamp: string | null
          round3_2_score: number | null
          round3_2_timestamp: string | null
          round3_3_score: number | null
          round3_3_timestamp: string | null
          rank: number | null
        }
        Insert: {
          team_id: string
          team_name: string
          player1_name: string
          player2_name: string
          phone_no: string
          password: string
          r1_score?: number
          r1_submission_time?: string | null
          r2_score?: number
          r2_submission_time?: string | null
          created_at?: string
          round3_1_score?: number | null
          round3_1_timestamp?: string | null
          round3_2_score?: number | null
          round3_2_timestamp?: string | null
          round3_3_score?: number | null
          round3_3_timestamp?: string | null
          rank?: number | null
        }
        Update: {
          team_id?: string
          team_name?: string
          player1_name?: string
          player2_name?: string
          phone_no?: string
          password?: string
          r1_score?: number
          r1_submission_time?: string | null
          r2_score?: number
          r2_submission_time?: string | null
          created_at?: string
          round3_1_score?: number | null
          round3_1_timestamp?: string | null
          round3_2_score?: number | null
          round3_2_timestamp?: string | null
          round3_3_score?: number | null
          round3_3_timestamp?: string | null
          rank?: number | null
        }
      }
      rounds: {
        Row: {
          id: string
          name: string
          status: 'pending' | 'active' | 'completed'
          description: string | null
          start_time: string | null
          end_time: string | null
          created_at: string
          updated_at: string
          Flag: number
          timer: number | null
        }
        Insert: {
          id?: string
          name: string
          status?: 'pending' | 'active' | 'completed'
          description?: string | null
          start_time?: string | null
          end_time?: string | null
          created_at?: string
          updated_at?: string
          Flag?: number
          timer?: number | null
        }
        Update: {
          id?: string
          name?: string
          status?: 'pending' | 'active' | 'completed'
          description?: string | null
          start_time?: string | null
          end_time?: string | null
          updated_at?: string
          Flag?: number
          timer?: number | null
        }
      }
      evaluation: {
        Row: {
          queue_id: string
          team_id: string
          round: string
          question_id: string
          raw_answer: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          score: number | null
          feedback: string | null
          submission_time: string
          retry_count: number
          max_retries: number
          last_error: string | null
          next_retry_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          queue_id?: string
          team_id: string
          round: string
          question_id: string
          raw_answer: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          score?: number | null
          feedback?: string | null
          submission_time?: string
          retry_count?: number
          max_retries?: number
          last_error?: string | null
          next_retry_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          queue_id?: string
          team_id?: string
          round?: string
          question_id?: string
          raw_answer?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          score?: number | null
          feedback?: string | null
          submission_time?: string
          retry_count?: number
          max_retries?: number
          last_error?: string | null
          next_retry_at?: string | null
          updated_at?: string
        }
      }
      submissions_round1: {
        Row: {
          id: string
          team_id: string
          score: number | null
          feedback: string | null
          submitted_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          score?: number | null
          feedback?: string | null
          submitted_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          score?: number | null
          feedback?: string | null
          submitted_at?: string
          updated_at?: string
        }
      }
      submissions_round2: {
        Row: {
          id: string
          team_id: string
          total_score: number | null
          bug_results: Json | null
          submitted_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          total_score?: number | null
          bug_results?: Json | null
          submitted_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          total_score?: number | null
          bug_results?: Json | null
          submitted_at?: string
          updated_at?: string
        }
      }
      ai_jobs: {
        Row: {
          id: string
          type: string
          round: string | null
          status: 'pending' | 'running' | 'completed' | 'failed'
          progress: number | null
          error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: string
          round?: string | null
          status?: 'pending' | 'running' | 'completed' | 'failed'
          progress?: number | null
          error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: string
          round?: string | null
          status?: 'pending' | 'running' | 'completed' | 'failed'
          progress?: number | null
          error?: string | null
          updated_at?: string
        }
      }
      telecast: {
        Row: {
          id: string
          active: boolean
          triggered_at: string | null
          timestamp: number | null
          video_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          active?: boolean
          triggered_at?: string | null
          timestamp?: number | null
          video_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          active?: boolean
          triggered_at?: string | null
          timestamp?: number | null
          video_path?: string | null
          updated_at?: string
        }
      }
      telecast_viewers: {
        Row: {
          id: string
          team_id: string
          viewed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          viewed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          viewed_at?: string
        }
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