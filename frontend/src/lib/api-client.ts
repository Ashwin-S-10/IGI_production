// API Client for communicating with the backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Debug: Log the API base URL (remove in production)
if (typeof window !== 'undefined') {
  console.log('[API Client] Using API_BASE_URL:', API_BASE_URL);
}

// Session management
let sessionId: string | null = null;

if (typeof window !== 'undefined') {
  sessionId = localStorage.getItem('sessionId');
}

export function setSessionId(id: string | null) {
  sessionId = id;
  if (typeof window !== 'undefined') {
    if (id) {
      localStorage.setItem('sessionId', id);
    } else {
      localStorage.removeItem('sessionId');
    }
  }
}

export function getSessionId(): string | null {
  return sessionId;
}

// Helper function to make API calls
async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Debug: Log the full URL being called
  console.log('[API Client] Calling:', url);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Add session ID to headers if available
  if (sessionId) {
    headers['x-session-id'] = sessionId;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  async login(email: string, password: string) {
    const response = await apiCall<{ success: boolean; user: any; sessionId: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    
    if (response.sessionId) {
      setSessionId(response.sessionId);
    }
    
    return response;
  },

  async commanderLogin(email: string, password: string) {
    const response = await apiCall<{ success: boolean; user: any; sessionId: string }>(
      '/api/auth/commander-login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    
    if (response.sessionId) {
      setSessionId(response.sessionId);
    }
    
    return response;
  },

  async logout() {
    const response = await apiCall('/api/auth/logout', { method: 'POST' });
    setSessionId(null);
    return response;
  },

  async getSession() {
    return apiCall<{ user: any | null }>('/api/auth/session');
  },
};

// Contest API
export const contestApi = {
  async getStoryAck() {
    return apiCall('/api/contest/story-ack');
  },

  async acknowledgeStory() {
    return apiCall('/api/contest/story-ack', { method: 'POST' });
  },

  async getState() {
    return apiCall('/api/contest/state');
  },

  async getTelecastStatus() {
    return apiCall('/api/contest/telecast/status');
  },

  async triggerTelecast(videoPath: string) {
    return apiCall('/api/contest/telecast/trigger', {
      method: 'POST',
      body: JSON.stringify({ videoPath }),
    });
  },

  async clearTelecast() {
    return apiCall('/api/contest/telecast/clear', { method: 'POST' });
  },

  async markTelecastViewed(teamId: string) {
    return apiCall('/api/contest/telecast/mark-viewed', {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    });
  },

  // Round 1 API - Get questions (without answers)
  async getRound1Questions() {
    return apiCall<{ questions: Array<{ question_id: number; title: string; question_text: string }> }>('/api/contest/round1/questions');
  },

  // Round 1 API - Evaluate answer with Gemini (returns score + analysis)
  async evaluateRound1Answer(user_id: string, question: string, user_answer: string) {
    return apiCall<{ score: number; analysis: string }>('/api/contest/round1/evaluate', {
      method: 'POST',
      body: JSON.stringify({ user_id, question, user_answer }),
    });
  },

  // Round 1 API - Final submission
  async submitRound1(data: { team_id: string; round_id: number; total_score: number; submitted_at: string }) {
    return apiCall('/api/contest/round1/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async analyzeRound1(data: any) {
    return apiCall('/api/contest/round1/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Round 2 API - Get questions (without bug explanations)
  async getRound2Questions() {
    return apiCall<{ questions: Array<{ question_id: number; title: string; description: string; code_snippet: string }> }>('/api/contest/round2/questions');
  },

  // Round 2 API - Submit single answer for scoring
  async submitRound2Answer(question_id: number, user_answer: string, language?: string) {
    return apiCall<{ 
      score: number;
      identifiedErrors: Array<{
        error_description: string;
        fix_description: string;
        identification_score: number;
        fix_score: number;
      }>;
      analysis: string;
      reason: string;
    }>('/api/contest/round2/submit-answer', {
      method: 'POST',
      body: JSON.stringify({ question_id, user_answer, language }),
    });
  },

  // Round 2 API - Final submission
  async submitRound2(data: { team_id: string; round_id: number; total_score: number; submitted_at: string }) {
    return apiCall('/api/contest/round2/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async submitRound3(data: any) {
    return apiCall('/api/contest/round3/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async judgeRound3(data: any) {
    return apiCall('/api/contest/round3/judge', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Teams API
export const teamsApi = {
  async login(team_name: string, password: string) {
    const response = await apiCall<{ success: boolean; data: { team_id: string; team_name: string } }>(
      '/api/teams/login',
      {
        method: 'POST',
        body: JSON.stringify({ team_name, password }),
      }
    );
    
    // Create a session-like response for compatibility
    if (response.success && response.data) {
      const sessionUser = {
        email: response.data.team_name,
        role: 'team',
        teamId: response.data.team_id,
        displayName: response.data.team_name,
      };
      
      // Generate a client-side session ID
      const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      setSessionId(sessionId);
      
      return { success: true, user: sessionUser, sessionId };
    }
    
    return response;
  },

  async getRankings(round?: 1 | 2 | 3) {
    const query = round ? `?round=${round}` : '';
    return apiCall(`/api/teams/rankings${query}`);
  },

  async getTeam(teamId: string) {
    return apiCall(`/api/teams/${teamId}`);
  },

  async submitRoundScore(data: { team_id: string; round_number: 1 | 2; total_score: number }) {
    return apiCall('/api/teams/round/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAllTeams() {
    return apiCall('/api/teams/admin/teams');
  },

  async createTeam(data: { team_name: string; player1_name: string; player2_name: string; phone_no: string }) {
    return apiCall('/api/teams/admin/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Mission API
export const missionApi = {
  async getTasks() {
    return apiCall('/api/mission/tasks');
  },
};

// Uploads API
export const uploadsApi = {
  async create(data: any) {
    return apiCall('/api/uploads/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export default {
  auth: authApi,
  contest: contestApi,
  teams: teamsApi,
  mission: missionApi,
  uploads: uploadsApi,
};
