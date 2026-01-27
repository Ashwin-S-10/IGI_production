'use client';

// Re-export Supabase hooks for backward compatibility
export {
  useTeams,
  useRounds,
  useSubmissionsRound1,
  useSubmissionsRound2,
  useAIJobs,
  useTelecast,
} from '@/lib/supabase/hooks';

// Legacy hooks that don't have Supabase equivalents yet
import { useMemo } from 'react';

// Mock data for features not yet migrated to Supabase
const MOCK_ROUND3_DUELS: any[] = [];
const MOCK_ROUND3_SUBMISSIONS: any[] = [];
const MOCK_MISSION_TASKS: any[] = [];
const MOCK_ROUND2_PROMPTS: any[] = [];
const MOCK_ROUND3_QUESTIONS: any[] = [];

export function useRound3Duels() {
  return {
    duels: MOCK_ROUND3_DUELS,
    loading: false,
    error: null,
  };
}

export function useRound3Submissions(duelId?: string) {
  const submissions = useMemo(() => {
    if (!duelId) {
      return MOCK_ROUND3_SUBMISSIONS;
    }
    return MOCK_ROUND3_SUBMISSIONS.filter((entry: any) => entry.duelId === duelId);
  }, [duelId]);

  return {
    submissions,
    loading: false,
    error: null,
  } as const;
}

export function useMissionTasks() {
  return {
    tasks: MOCK_MISSION_TASKS,
    readOnly: true,
    loading: false,
    error: null,
  } as const;
}

export function useRound2Prompts() {
  return {
    prompts: MOCK_ROUND2_PROMPTS,
    loading: false,
    error: null,
  } as const;
}

export function useRound3Questions() {
  return {
    questions: MOCK_ROUND3_QUESTIONS,
    loading: false,
    error: null,
  } as const;
}

export function useDocument<T>(_collectionPath: string, _docId: string) {
  return {
    doc: null as T | null,
    loading: false,
    error: 'Realtime Firebase data is not available in the offline contest mode.',
  };
}
