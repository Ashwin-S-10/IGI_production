"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from './database'
import type { Team, Round, SubmissionRound1, SubmissionRound2, AIJob, Telecast } from './database'

// Teams hooks
export function useTeams() {
  const query = useQuery({
    queryKey: ['teams'],
    queryFn: () => db.getTeams(),
    staleTime: 30000, // 30 seconds
  })
  
  return {
    teams: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: ['teams', id],
    queryFn: () => db.getTeam(id),
    enabled: !!id,
  })
}

export function useCreateTeam() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (team: Parameters<typeof db.createTeam>[0]) => db.createTeam(team),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export function useUpdateTeam() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof db.updateTeam>[1] }) => 
      db.updateTeam(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['teams', data.team_id] })
    },
  })
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

// Telecast hooks
export function useTelecast() {
  const query = useQuery({
    queryKey: ['telecast'],
    queryFn: () => db.getTelecastStatus(),
    staleTime: 5000, // 5 seconds
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
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