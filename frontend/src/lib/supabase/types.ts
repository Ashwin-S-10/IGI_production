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
          id: string
          name: string
          squad: string | null
          members: string[] | null
          round1_score: number | null
          last_activity: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          squad?: string | null
          members?: string[] | null
          round1_score?: number | null
          last_activity?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          squad?: string | null
          members?: string[] | null
          round1_score?: number | null
          last_activity?: string | null
          updated_at?: string
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
        }
        Update: {
          id?: string
          name?: string
          status?: 'pending' | 'active' | 'completed'
          description?: string | null
          start_time?: string | null
          end_time?: string | null
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