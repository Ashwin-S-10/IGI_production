/**
 * Firestore data models and helper types for contest collections.
 */

export interface Team {
  id: string;
  name: string;
  members: string[];
  createdAt: Date;
  squad?: 'FOSS-1' | 'FOSS-2';
  round1Score?: number;
  round2Score?: number;
  round3Score?: number;
  round2SubmittedAt?: Date;
  round2Qualified?: boolean;
  round3Seed?: number;
  eliminated?: boolean;
}

export interface Round {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed';
  startTime?: Date;
  endTime?: Date;
  config?: Record<string, unknown>;
}

export interface SubmissionRound1 {
  id: string;
  teamId: string;
  submittedAt: Date;
  imageUrl: string;
  ocrRaw: string;
  ocrClean: string;
  score: number;
  logicScore: number;
  stepsScore: number;
  completenessScore: number;
  contextScore: number;
  clarityScore: number;
  confidence: 'high' | 'medium' | 'low';
  feedback: string;
  questionId?: string | null;
  squad?: 'FOSS-1' | 'FOSS-2';
  attachments?: SubmissionAttachment[];
}

export interface SubmissionAttachment {
  name: string;
  size: number;
  contentType: string;
  storagePath: string;
  downloadUrl: string;
  uploadedAt: Date;
}

export interface SubmissionRound2 {
  id: string;
  teamId: string;
  submittedAt: Date;
  language?: string;
  answers: Array<{
    promptId: string;
    description: string;
    line: number;
  }>;
  evaluations: Array<{
    promptId: string;
    index: number;
    descriptionCorrect: boolean;
    lineCorrect: boolean;
    partial: boolean;
    points: 0 | 0.5 | 1;
    feedback: string;
  }>;
  totalScore: number;
  durationSeconds?: number;
  placement?: number;
}

export interface Round3Duel {
  id: string;
  round: 1 | 2 | 3;
  seedA: number;
  seedB: number;
  teamA: string;
  teamB: string;
  problemId: string;
  status: 'pending' | 'scheduled' | 'active' | 'awaiting_judgement' | 'judged' | 'rematch_scheduled';
  startTime?: Date;
  endTime?: Date;
  questionId?: string;
  questionText?: string;
  submissionA?: string;
  submissionB?: string;
  judgedAt?: Date;
  winner?: 'A' | 'B';
  winnerTeamId?: string;
  loserTeamId?: string;
  rematchCount?: number;
  result?: Round3DuelResult;
  nextDuelId?: string;
  nextSlot?: 'A' | 'B';
}

export interface AIJob {
  id: string;
  type: 'round1_scoring' | 'round2_evaluation' | 'round3_judge';
  status: 'pending' | 'running' | 'completed' | 'failed';
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface Round2Prompt {
  id: string;
  title: string;
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  snippet: string;
  context?: string;
  tags?: string[];
  answer: {
    summary: string;
    keywords: string[];
    line: number;
    tolerance?: number;
    partialCreditLines?: number[];
  };
}

export interface Round3Question {
  id: string;
  title: string;
  prompt: string;
  expectedAnswer: string;
  tags?: string[];
  timeLimitMinutes: number;
}

export interface Round3Submission {
  id: string;
  duelId: string;
  teamId: string;
  submittedAt: Date;
  answer: string;
  durationSeconds?: number;
}

export interface Round3DuelScorecard {
  correct: boolean;
  clarity: number;
  steps: number;
}

export interface Round3DuelResult {
  winner: 'A' | 'B' | 'rematch';
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  scores: {
    A: Round3DuelScorecard;
    B: Round3DuelScorecard;
  };
}

export interface Round1Evidence {
  id: string;
  teamId: string;
  submittedAt: Date;
  submittedBy: string;
  artifacts: SubmissionAttachment[];
  notes?: string;
}

export interface MissionTask {
  id: string;
  completedSteps: string[];
  notes?: string;
  updatedAt?: Date;
  createdAt?: Date;
}

// Firestore collection paths
export const COLLECTIONS = {
  TEAMS: 'teams',
  ROUNDS: 'rounds',
  SUBMISSIONS_ROUND1: 'submissions_round1',
  SUBMISSIONS_ROUND2: 'submissions_round2',
  ROUND3_BRACKET: 'round3_bracket',
  ROUND3_DUELS: 'round3_duels',
  ROUND3_SUBMISSIONS: 'round3_submissions',
  ROUND2_PROMPTS: 'round2_prompts',
  ROUND3_QUESTIONS: 'round3_questions',
  AI_JOBS: 'ai_jobs',
  ROUND1_EVIDENCE: 'round1_evidence',
  MISSION_TASKS: 'mission_tasks',
} as const;
