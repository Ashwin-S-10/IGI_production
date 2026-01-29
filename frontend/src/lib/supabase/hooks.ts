"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from './database'
import type { Team, Round, SubmissionRound1, SubmissionRound2, AIJob, Telecast } from './database'

// Teams hooks
export function useTeams() {
  const query = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await fetch('/api/teams');
      if (!res.ok) throw new Error('Failed to fetch teams');
      const { teams } = await res.json();
      return teams;
    },
    staleTime: 30000,
  });
  return {
    teams: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: ['teams', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/teams/${id}`);
      if (!res.ok) throw new Error('Failed to fetch team');
      const { team } = await res.json();
      return team;
    },
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (team: Omit<Team, 'id'>) => {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(team),
      });
      if (!res.ok) throw new Error('Failed to create team');
      const { team: created } = await res.json();
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Team> }) => {
      const res = await fetch(`/api/teams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update team');
      const { team: updated } = await res.json();
      return updated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      if (data?.id) queryClient.invalidateQueries({ queryKey: ['teams', data.id] });
    },
  });
}

// Rounds hooks
export function useRounds() {
  const query = useQuery({
    queryKey: ['rounds'],
    queryFn: () => db.getRounds(),
    staleTime: 60000, // 1 minute
  })
  
  return {
    rounds: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useUpdateRound() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof db.updateRound>[1] }) => 
      db.updateRound(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds'] })
    },
  })
}

// Submissions hooks
export function useSubmissionsRound1(teamId?: string) {
  const query = useQuery({
    queryKey: ['submissions-round1', teamId],
    queryFn: () => db.getSubmissionsRound1(teamId),
    staleTime: 15000, // 15 seconds
  })
  
  return {
    submissions: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useSubmissionsRound2(teamId?: string) {
  const query = useQuery({
    queryKey: ['submissions-round2', teamId],
    queryFn: () => db.getSubmissionsRound2(teamId),
    staleTime: 15000, // 15 seconds
  })
  
  return {
    submissions: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useCreateSubmissionRound1() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (submission: Parameters<typeof db.createSubmissionRound1>[0]) => 
      db.createSubmissionRound1(submission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions-round1'] })
    },
  })
}

export function useCreateSubmissionRound2() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (submission: Parameters<typeof db.createSubmissionRound2>[0]) => 
      db.createSubmissionRound2(submission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions-round2'] })
    },
  })
}

// AI Jobs hooks
export function useAIJobs() {
  const query = useQuery({
    queryKey: ['ai-jobs'],
    queryFn: () => db.getAIJobs(),
    staleTime: 10000, // 10 seconds
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  })
  
  return {
    jobs: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useCreateAIJob() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (job: Parameters<typeof db.createAIJob>[0]) => db.createAIJob(job),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-jobs'] })
    },
  })
}

export function useUpdateAIJob() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof db.updateAIJob>[1] }) => 
      db.updateAIJob(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-jobs'] })
    },
  })
}

// Telecast hooks - using Next.js API routes
export function useTelecast() {
  const query = useQuery({
    queryKey: ['telecast'],
    queryFn: async () => {
      const response = await fetch('/api/contest/telecast/status');
      if (!response.ok) {
        throw new Error('Failed to fetch telecast status');
      }
      return response.json();
    },
    staleTime: 1000, // 1 second
    refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
  })
  
  return {
    activeTelecast: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useTriggerTelecast() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (videoPath: string) => db.triggerTelecast(videoPath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecast'] })
    },
  })
}

export function useClearTelecast() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => db.clearTelecast(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecast'] })
    },
  })
}

export function useMarkTelecastViewed() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (teamId: string) => db.markTelecastViewed(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecast'] })
    },
  })
}