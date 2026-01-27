import type { Database } from './types'

type Tables = Database['public']['Tables']

export type Team = Tables['teams']['Row']
export type Round = Tables['rounds']['Row']
export type SubmissionRound1 = Tables['submissions_round1']['Row']
export type SubmissionRound2 = Tables['submissions_round2']['Row']
export type AIJob = Tables['ai_jobs']['Row']
export type Telecast = Tables['telecast']['Row']
export type TelecastViewer = Tables['telecast_viewers']['Row']

// Legacy type aliases for compatibility (if needed)
export type Round3Question = any; 
export type Round3Duel = {
    id: string;
    teamA: string;
    teamB: string;
    judgedAt: string | Date | null;
    roundId: string;
    status: 'pending' | 'completed';
    winner?: string | null;
};
export type Round3Submission = any; 
export type Round2Prompt = any;
