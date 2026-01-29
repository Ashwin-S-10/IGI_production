import { supabase, isSupabaseConfigured } from './client'
import { supabaseAdmin, isSupabaseServerConfigured } from './server'
import type { Database } from './types'

// Type aliases for easier use
type Tables = Database['public']['Tables']
type Team = Tables['teams']['Row']
type Round = Tables['rounds']['Row']
type SubmissionRound1 = Tables['submissions_round1']['Row']
type SubmissionRound2 = Tables['submissions_round2']['Row']
type AIJob = Tables['ai_jobs']['Row']
type Telecast = Tables['telecast']['Row']
type TelecastViewer = Tables['telecast_viewers']['Row']

export class SupabaseDatabase {
  private client = supabase
  private adminClient = supabaseAdmin

  private checkConfiguration() {
    if (!isSupabaseConfigured) {
      console.warn('⚠️ Supabase is not properly configured. Please check your environment variables.')
      return false
    }
    return true
  }

  // Teams operations
  async getTeams(): Promise<Team[]> {
    if (!this.checkConfiguration()) return []
    
    try {
      const { data, error } = await this.client
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('⚠️ Database error (tables may not exist yet):', error.message)
        return []
      }
      return data || []
    } catch (error) {
      console.warn('⚠️ Database connection error:', error)
      return []
    }
  }

  async getTeam(id: string): Promise<Team | null> {
    if (!this.checkConfiguration()) return null
    
    try {
      const { data, error } = await this.client
        .from('teams')
        .select('*')
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.warn('⚠️ Database error:', error.message)
        return null
      }
      return data
    } catch (error) {
      console.warn('⚠️ Database connection error:', error)
      return null
    }
  }

  async createTeam(team: Tables['teams']['Insert']): Promise<Team> {
    const { data, error } = await this.client
      .from('teams')
      .insert(team as any)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateTeam(id: string, updates: Tables['teams']['Update']): Promise<Team> {
    const { data, error } = await this.client
      .from('teams')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteTeam(id: string): Promise<void> {
    const { error } = await this.client
      .from('teams')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Rounds operations
  async getRounds(): Promise<Round[]> {
    try {
      const { data, error } = await this.client
        .from('rounds')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ getRounds error:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('❌ getRounds catch:', error)
      throw error
    }
  }

  async updateRound(id: string, updates: Tables['rounds']['Update']): Promise<Round> {
    try {
      console.log('🔄 Updating round:', id, 'with:', updates)
      
      // Ensure Flag is properly passed
      const updateData: any = {}
      Object.keys(updates).forEach(key => {
        if (updates[key as keyof typeof updates] !== undefined) {
          updateData[key] = updates[key as keyof typeof updates]
        }
      })
      
      console.log('📦 Update data prepared:', updateData)
      
      const { data, error } = await this.client
        .from('rounds')
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('❌ updateRound error:', error)
        throw error
      }
      console.log('✅ Round updated successfully:', data)
      return data
    } catch (error) {
      console.error('❌ updateRound catch:', error)
      throw error
    }
  }

  // Round 1 Submissions
  async getSubmissionsRound1(teamId?: string): Promise<SubmissionRound1[]> {
    let query = this.client
      .from('submissions_round1')
      .select('*')
      .order('submitted_at', { ascending: false })

    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async createSubmissionRound1(submission: Tables['submissions_round1']['Insert']): Promise<SubmissionRound1> {
    const { data, error } = await this.client
      .from('submissions_round1')
      .insert(submission as any)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateSubmissionRound1(id: string, updates: Tables['submissions_round1']['Update']): Promise<SubmissionRound1> {
    const { data, error } = await this.client
      .from('submissions_round1')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Round 2 Submissions
  async getSubmissionsRound2(teamId?: string): Promise<SubmissionRound2[]> {
    let query = this.client
      .from('submissions_round2')
      .select('*')
      .order('submitted_at', { ascending: false })

    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async createSubmissionRound2(submission: Tables['submissions_round2']['Insert']): Promise<SubmissionRound2> {
    const { data, error } = await this.client
      .from('submissions_round2')
      .insert(submission as any)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateSubmissionRound2(id: string, updates: Tables['submissions_round2']['Update']): Promise<SubmissionRound2> {
    const { data, error } = await this.client
      .from('submissions_round2')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async clearAllRound2Submissions(): Promise<{ count: number }> {
    // Use admin client if available, otherwise use regular client
    const clientToUse = isSupabaseServerConfigured ? this.adminClient : this.client
    
    console.log('[clearAllRound2Submissions] Using', isSupabaseServerConfigured ? 'admin' : 'regular', 'client');

    const { error, count } = await clientToUse
      .from('submissions_round2')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

    if (error) {
      console.error('[clearAllRound2Submissions] Error:', error);
      throw error;
    }
    return { count: count || 0 }
  }

  // AI Jobs operations
  async getAIJobs(): Promise<AIJob[]> {
    const { data, error } = await this.client
      .from('ai_jobs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createAIJob(job: Tables['ai_jobs']['Insert']): Promise<AIJob> {
    const { data, error } = await this.client
      .from('ai_jobs')
      .insert(job as any)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateAIJob(id: string, updates: Tables['ai_jobs']['Update']): Promise<AIJob> {
    const { data, error } = await this.client
      .from('ai_jobs')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Telecast operations
  async getTelecastStatus(): Promise<Telecast | null> {
    if (!this.checkConfiguration()) return null

    // Prefer server/admin client when available so server API routes work
    const clientToUse = isSupabaseServerConfigured ? this.adminClient : this.client

    try {
      const { data, error } = await clientToUse
        .from('telecast')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.warn('⚠️ Database error (telecast table may not exist yet):', error.message)
        return null
      }
      return data
    } catch (error) {
      console.warn('⚠️ Database connection error:', error)
      return null
    }
  }

  async triggerTelecast(videoPath: string): Promise<Telecast> {
    const clientToUse = isSupabaseServerConfigured ? this.adminClient : this.client

    // First, deactivate any existing telecasts
    await clientToUse
      .from('telecast')
      .update({ active: false } as any)
      .eq('active', true)

    // Create new telecast
    const { data, error } = await clientToUse
      .from('telecast')
      .insert({
        active: true,
        triggered_at: new Date().toISOString(),
        timestamp: Date.now(),
        video_path: videoPath,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async clearTelecast(): Promise<void> {
    const clientToUse = isSupabaseServerConfigured ? this.adminClient : this.client
    const { error } = await clientToUse
      .from('telecast')
      .update({ active: false } as any)
      .eq('active', true)

    if (error) throw error
  }

  async markTelecastViewed(teamId: string): Promise<TelecastViewer> {
    const clientToUse = isSupabaseServerConfigured ? this.adminClient : this.client
    const { data, error } = await clientToUse
      .from('telecast_viewers')
      .insert({
        team_id: teamId,
        viewed_at: new Date().toISOString(),
      } as any)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Real-time subscriptions
  subscribeToTeams(callback: (teams: Team[]) => void) {
    return this.client
      .channel('teams-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'teams' },
        () => {
          this.getTeams().then(callback).catch(console.error)
        }
      )
      .subscribe()
  }

  subscribeToSubmissions(callback: (submissions: any[]) => void) {
    return this.client
      .channel('submissions-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'submissions_round1' },
        () => {
          Promise.all([
            this.getSubmissionsRound1(),
            this.getSubmissionsRound2()
          ]).then(([r1, r2]) => callback([...r1, ...r2])).catch(console.error)
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'submissions_round2' },
        () => {
          Promise.all([
            this.getSubmissionsRound1(),
            this.getSubmissionsRound2()
          ]).then(([r1, r2]) => callback([...r1, ...r2])).catch(console.error)
        }
      )
      .subscribe()
  }

  subscribeToTelecast(callback: (telecast: Telecast | null) => void) {
    return this.client
      .channel('telecast-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'telecast' },
        () => {
          this.getTelecastStatus().then(callback).catch(console.error)
        }
      )
      .subscribe()
  }
}

// Export singleton instance
export const db = new SupabaseDatabase()

// Export types for use in components
export type {
  Team,
  Round,
  SubmissionRound1,
  SubmissionRound2,
  AIJob,
  Telecast,
  TelecastViewer
}